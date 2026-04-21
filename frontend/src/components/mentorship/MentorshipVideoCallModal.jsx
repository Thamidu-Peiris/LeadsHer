import { useCallback, useEffect, useRef, useState } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import toast from 'react-hot-toast';
import { mentorshipApi } from '../../api/mentorshipApi';
import { getApiErrorMessage } from '../../utils/apiErrorMessage';
import { safeLeaveAgoraClient } from '../../utils/mentorshipVideoCall';

/**
 * @param {{
 *   open: boolean;
 *   onClose: () => void;
 *   mentorshipId: string;
 *   sessionId: string;
 *   peerName?: string;
 *   onCallEnded?: () => void;
 * }} props
 */
export default function MentorshipVideoCallModal({
  open,
  onClose,
  mentorshipId,
  sessionId,
  peerName = 'Peer',
  onCallEnded,
}) {
  const remoteVideoRef = useRef(null);
  const localVideoRef = useRef(null);
  const clientRef = useRef(null);
  const localTracksRef = useRef([]);

  const [phase, setPhase] = useState('idle'); // idle | joining | live | leaving
  const [error, setError] = useState('');

  const cleanup = useCallback(async () => {
    const client = clientRef.current;
    const tracks = localTracksRef.current;
    clientRef.current = null;
    localTracksRef.current = [];
    if (remoteVideoRef.current) remoteVideoRef.current.innerHTML = '';
    if (localVideoRef.current) localVideoRef.current.innerHTML = '';
    if (!client) return;
    try {
      client.removeAllListeners();
      if (tracks.length) {
        try {
          await client.unpublish(tracks);
        } catch {
          /* ignore */
        }
        tracks.forEach((t) => {
          try {
            t.stop();
            t.close();
          } catch {
            /* ignore */
          }
        });
      }
      await safeLeaveAgoraClient(client);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!open) {
      void cleanup();
      return undefined;
    }
    if (!mentorshipId || !sessionId) return undefined;

    let cancelled = false;
    const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    clientRef.current = client;

    const run = async () => {
      setError('');
      setPhase('joining');
      try {
        const res = await mentorshipApi.getAgoraToken(mentorshipId, sessionId);
        const { appId, channel, token, uid } = res.data?.data || {};
        if (!appId || !channel || uid == null) {
          throw new Error('Invalid video token response');
        }
        if (cancelled) return;

        await client.join(appId, channel, token || null, uid);

        const [mic, cam] = await AgoraRTC.createMicrophoneAndCameraTracks();
        if (cancelled) {
          mic.stop();
          mic.close();
          cam.stop();
          cam.close();
          await safeLeaveAgoraClient(client);
          return;
        }
        localTracksRef.current = [mic, cam];
        await client.publish([mic, cam]);
        cam.play(localVideoRef.current);

        client.on('user-published', async (user, mediaType) => {
          if (cancelled) return;
          try {
            await client.subscribe(user, mediaType);
            if (mediaType === 'video' && user.videoTrack && remoteVideoRef.current) {
              user.videoTrack.play(remoteVideoRef.current);
            }
            if (mediaType === 'audio' && user.audioTrack) {
              user.audioTrack.play();
            }
          } catch (e) {
            console.error(e);
          }
        });

        client.on('user-unpublished', (user, mediaType) => {
          if (mediaType === 'video' && user.videoTrack) {
            user.videoTrack.stop();
          }
          if (mediaType === 'audio' && user.audioTrack) {
            user.audioTrack.stop();
          }
        });

        if (!cancelled) setPhase('live');
      } catch (e) {
        if (cancelled) return;
        const msg = getApiErrorMessage(e, 'Could not start video call');
        setError(msg);
        toast.error(msg);
        setPhase('idle');
        await safeLeaveAgoraClient(client);
        clientRef.current = null;
      }
    };

    void run();

    return () => {
      cancelled = true;
      void cleanup();
    };
  }, [open, mentorshipId, sessionId, cleanup]);

  const handleEndAndComplete = async () => {
    setPhase('leaving');
    try {
      await mentorshipApi.completeSessionVideoCall(mentorshipId, sessionId);
      toast.success('Session marked complete');
      onCallEnded?.();
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Could not mark session complete'));
    } finally {
      await cleanup();
      onClose();
      setPhase('idle');
    }
  };

  const handleLeaveOnly = async () => {
    setPhase('leaving');
    await cleanup();
    onClose();
    setPhase('idle');
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleLeaveOnly();
      }}
    >
      <div
        className="flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-neutral-950 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="video-call-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div className="min-w-0">
            <h2 id="video-call-title" className="truncate text-sm font-semibold text-white">
              Video session with {peerName}
            </h2>
            <p className="truncate text-xs text-neutral-400">
              {phase === 'joining' && 'Connecting…'}
              {phase === 'live' && 'Connected'}
              {phase === 'leaving' && 'Leaving…'}
              {phase === 'idle' && error}
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleLeaveOnly()}
            className="shrink-0 rounded-lg px-2 py-1 text-neutral-400 hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-[22px] leading-none">close</span>
          </button>
        </div>

        <div className="relative bg-black">
          <div ref={remoteVideoRef} className="aspect-video w-full bg-neutral-900" />
          <div
            ref={localVideoRef}
            className="absolute bottom-3 right-3 h-28 w-40 overflow-hidden rounded-lg border border-white/20 bg-black shadow-lg"
          />
        </div>

        {error && (
          <p className="border-t border-white/10 bg-rose-950/40 px-4 py-2 text-xs text-rose-100">{error}</p>
        )}

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-white/10 px-4 py-3">
          <button
            type="button"
            onClick={() => handleLeaveOnly()}
            disabled={phase === 'leaving'}
            className="rounded-lg border border-white/20 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/10 disabled:opacity-50"
          >
            Leave
          </button>
          <button
            type="button"
            onClick={() => handleEndAndComplete()}
            disabled={phase === 'joining' || phase === 'leaving'}
            className="rounded-lg bg-rose-500 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-rose-600 disabled:opacity-50"
          >
            End call &amp; mark complete
          </button>
        </div>
      </div>
    </div>
  );
}
