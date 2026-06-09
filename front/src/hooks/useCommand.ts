// =========================================================
//  Hook useCommand — envoie une commande à un actionneur
//  et suit son statut (pending → done/error) en polling.
// =========================================================
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Command } from '../lib/types';

interface SendCommandArgs {
  deviceId: string;
  action: string;
  payload?: Record<string, unknown>;
}

interface Result {
  lastCommand: Command | null;
  sending: boolean;
  error: string | null;
  sendCommand: (args: SendCommandArgs) => Promise<void>;
}

export function useCommand(): Result {
  const [lastCommand, setLastCommand] = useState<Command | null>(null);
  const [sending, setSending]         = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const pollRef                       = useRef<ReturnType<typeof setInterval> | null>(null);

  // Arrête le polling du statut
  const stopPoll = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  // Démarre un polling pour surveiller le statut de la commande
  const startPoll = useCallback((commandId: number) => {
    stopPoll();
    pollRef.current = setInterval(async () => {
      const { data, error: err } = await supabase
        .from('G1E_commands')
        .select('*')
        .eq('id', commandId)
        .single();

      if (err) return;
      const cmd = data as Command;
      setLastCommand(cmd);

      // Arrête le polling une fois terminé
      if (cmd.status === 'done' || cmd.status === 'error') stopPoll();
    }, 1000);
  }, [stopPoll]);

  // Nettoyage au démontage
  useEffect(() => () => stopPoll(), [stopPoll]);

  const sendCommand = useCallback(async ({
    deviceId, action, payload,
  }: SendCommandArgs) => {
    setSending(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();

    const { data, error: err } = await supabase
      .from('G1E_commands')
      .insert({
        device_id:  deviceId,
        action,
        payload:    payload ?? null,
        status:     'pending',
        created_by: user?.id ?? null,
      })
      .select()
      .single();

    if (err) {
      setError(err.message);
    } else {
      const cmd = data as Command;
      setLastCommand(cmd);
      startPoll(cmd.id);
    }

    setSending(false);
  }, [startPoll]);

  return { lastCommand, sending, error, sendCommand };
}
