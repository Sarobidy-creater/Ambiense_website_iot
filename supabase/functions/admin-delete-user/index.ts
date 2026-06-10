// =========================================================
//  Edge Function : admin-delete-user
//  Supprime un utilisateur Supabase Auth via service_role.
//  Vérifie que l'appelant est bien admin avant de supprimer.
//
//  Déploiement :
//    npx supabase functions deploy admin-delete-user --project-ref fdlwkvsovkewlfwnrpvm
//
//  Variables d'environnement Supabase à définir (Settings > Edge Functions secrets) :
//    SERVICE_ROLE_KEY = eyJ...  (votre clé service_role)
// =========================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Client avec la clé du demandeur (pour vérifier son rôle)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Non authentifié' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey  = Deno.env.get('SERVICE_ROLE_KEY')!

    // Client utilisateur (pour vérifier qu'il est admin)
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })

    // Vérifie que l'appelant est authentifié
    const { data: { user }, error: userErr } = await userClient.auth.getUser()
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: 'Session invalide' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Vérifie que l'appelant est admin
    const { data: role } = await userClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (role?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Accès refusé — rôle admin requis' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. Récupère l'ID à supprimer
    const { userId } = await req.json()
    if (!userId || typeof userId !== 'string') {
      return new Response(JSON.stringify({ error: 'userId manquant' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Sécurité : ne pas permettre à l'admin de se supprimer lui-même
    if (userId === user.id) {
      return new Response(JSON.stringify({ error: 'Impossible de supprimer votre propre compte' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3. Suppression avec service_role
    const adminClient = createClient(supabaseUrl, serviceKey)
    const { error: delErr } = await adminClient.auth.admin.deleteUser(userId)

    if (delErr) {
      return new Response(JSON.stringify({ error: delErr.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
