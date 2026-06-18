// =========================================================
//  Edge Function : admin-user-actions
//  Gère deux actions :
//
//  1) send-reset-email  (publique — pas d'auth requise)
//     Génère un lien de récupération Supabase et l'envoie
//     via Resend HTTP API (bypasse le SMTP de Supabase).
//
//  2) delete-user  (admin requis)
//     Supprime un utilisateur Supabase Auth.
//
//  Secrets à définir dans Supabase → Settings → Edge Functions :
//    RESEND_API_KEY   = re_xxxxxxxxxxxx   (clé API Resend)
//    SITE_URL         = https://ambiense-website-iot.vercel.app
//
//  SUPABASE_URL, SUPABASE_ANON_KEY et SUPABASE_SERVICE_ROLE_KEY
//  sont injectés automatiquement — aucun secret manuel requis.
//
//  Déploiement :
//    npx supabase functions deploy admin-user-actions --project-ref fdlwkvsovkewlfwnrpvm
// =========================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

// Vérifie que le demandeur est authentifié ET admin
// Utilise le client service_role pour vérifier le JWT directement —
// plus fiable que créer un client intermédiaire avec l'anon key.
async function verifyAdmin(req: Request, adminClient: ReturnType<typeof createClient>) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return { user: null as null, adminErr: 'Non authentifié', status: 401 }

  const token = authHeader.replace(/^Bearer\s+/i, '')

  // getUser(token) vérifie le JWT avec la clé Supabase directement
  const { data: { user }, error } = await adminClient.auth.getUser(token)
  if (error || !user) {
    console.error('[verifyAdmin] getUser error:', error?.message)
    return { user: null as null, adminErr: `Session invalide : ${error?.message ?? 'token rejected'}`, status: 401 }
  }

  // Vérifie le rôle via le client service_role (bypass RLS)
  const { data: roleRow, error: roleErr } = await adminClient
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (roleErr) {
    console.error('[verifyAdmin] role check error:', roleErr.message)
    return { user: null as null, adminErr: `Erreur vérification rôle : ${roleErr.message}`, status: 500 }
  }

  if (roleRow?.role !== 'admin') {
    return { user: null as null, adminErr: 'Accès refusé — rôle admin requis', status: 403 }
  }

  return { user, adminErr: null as null, status: 200 }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const adminClient = createClient(supabaseUrl, serviceKey)

    const body   = await req.json()
    const action = body?.action as string | undefined

    // ═══════════════════════════════════════════════════════
    //  ACTION : send-reset-email  (pas d'auth requise)
    //  Génère un lien de récupération et l'envoie via Resend.
    // ═══════════════════════════════════════════════════════
    if (action === 'send-reset-email') {
      const { email, redirectTo } = body as { email?: string; redirectTo?: string }
      if (!email) return json({ error: 'email manquant' }, 400)

      const siteUrl    = Deno.env.get('SITE_URL') ?? 'https://ambiense-website-iot.vercel.app'
      const finalRedirect = redirectTo ?? `${siteUrl}/reset-password`

      // Génère le lien de récupération (sans envoi d'email côté Supabase)
      const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: { redirectTo: finalRedirect },
      })

      // Retourne succès même si l'email n'existe pas (évite l'énumération d'emails)
      if (linkErr || !linkData?.properties?.action_link) {
        console.warn('[send-reset-email] generateLink failed:', linkErr?.message)
        return json({ success: true })
      }

      // On n'utilise PAS action_link (Supabase redirige vers son Site URL).
      // On extrait hashed_token et on construit le lien directement vers notre app.
      // ResetPasswordPage appelle supabase.auth.verifyOtp({ token_hash }) pour établir la session.
      const hashedToken = linkData.properties.hashed_token
      const resetLink   = `${finalRedirect}?token_hash=${encodeURIComponent(hashedToken)}&type=recovery`
      console.log('[send-reset-email] direct reset link built:', resetLink)
      const resendKey  = Deno.env.get('RESEND_API_KEY')

      if (!resendKey) {
        return json({ error: 'Secret RESEND_API_KEY manquant dans les Edge Functions secrets' }, 500)
      }

      const emailRes = await fetch('https://api.resend.com/emails', {
        method:  'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type':  'application/json',
        },
        body: JSON.stringify({
          // onboarding@resend.dev fonctionne sans vérification de domaine
          from:    'AMBIENSE <onboarding@resend.dev>',
          to:      [email],
          subject: 'Réinitialisation de votre mot de passe — AMBIENSE',
          html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a14;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 16px;">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#12121f;border-radius:10px;overflow:hidden;">
        <tr>
          <td style="background:#1a1a2e;padding:24px 32px;text-align:center;">
            <h1 style="color:#c9a240;margin:0;font-size:22px;letter-spacing:3px;">AMBIENSE</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;color:#e0e0f0;">
            <h2 style="margin:0 0 16px;font-size:20px;color:#fff;">Réinitialisation de mot de passe</h2>
            <p style="margin:0 0 12px;line-height:1.6;color:#aaa;">
              Vous (ou un administrateur) avez demandé la réinitialisation du mot de passe
              de ce compte <strong style="color:#e0e0f0;">AMBIENSE</strong>.
            </p>
            <p style="margin:0 0 24px;line-height:1.6;color:#aaa;">
              Ce lien est valide pendant <strong style="color:#e0e0f0;">1 heure</strong>.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td align="center" style="padding:8px 0 32px;">
                <a href="${resetLink}"
                   style="background:#c9a240;color:#0f0f1a;padding:14px 36px;border-radius:6px;
                          text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">
                  Réinitialiser mon mot de passe
                </a>
              </td></tr>
            </table>
            <p style="margin:0;font-size:12px;color:#555;line-height:1.6;">
              Si vous n'avez pas demandé cette réinitialisation, ignorez simplement cet email —
              votre mot de passe restera inchangé.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px;background:#0f0f1a;text-align:center;">
            <p style="margin:0;font-size:11px;color:#444;">
              AMBIENSE · Projet IoT ISEP
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
        }),
      })

      if (!emailRes.ok) {
        const errBody = await emailRes.json().catch(() => ({}))
        console.error('[send-reset-email] Resend error:', errBody)
        return json({ error: `Erreur Resend : ${errBody.message ?? emailRes.statusText}` }, 500)
      }

      return json({ success: true })
    }

    // ═══════════════════════════════════════════════════════
    //  Actions suivantes : requièrent le rôle admin
    // ═══════════════════════════════════════════════════════
    const { user, adminErr, status } = await verifyAdmin(req, adminClient)
    if (adminErr) return json({ error: adminErr }, status)

    // ── ACTION : delete-user ─────────────────────────────
    if (action === 'delete-user') {
      const { userId } = body as { userId?: string }
      if (!userId || typeof userId !== 'string') return json({ error: 'userId manquant' }, 400)
      if (userId === user!.id) return json({ error: 'Impossible de supprimer votre propre compte' }, 400)

      const { error: delErr } = await adminClient.auth.admin.deleteUser(userId)
      if (delErr) return json({ error: delErr.message }, 500)

      return json({ success: true })
    }

    return json({ error: `Action inconnue : ${action}` }, 400)

  } catch (e) {
    console.error('[admin-user-actions] unhandled error:', e)
    return json({ error: String(e) }, 500)
  }
})
