/** @param {import('agora-rtc-sdk-ng').IAgoraRTCClient | null} client */
export async function safeLeaveAgoraClient(client) {
  if (!client) return;
  try {
    client.removeAllListeners();
    await client.leave();
  } catch {
    /* ignore */
  }
}

/**
 * @param {{ date?: string; duration?: number; callStatus?: string }} session
 * @returns {{ phase: 'no_date' | 'completed' | 'too_early' | 'open' | 'ended'; label: string; canJoin: boolean }}
 */
export function getSessionVideoWindowInfo(session) {
  if (!session?.date) {
    return { phase: 'no_date', label: 'No session time', canJoin: false };
  }
  if (session.callStatus === 'completed') {
    return { phase: 'completed', label: 'Video call completed', canJoin: false };
  }
  const start = new Date(session.date).getTime();
  if (Number.isNaN(start)) {
    return { phase: 'no_date', label: 'Invalid session time', canJoin: false };
  }
  const durMs = (Number(session.duration) || 30) * 60 * 1000;
  const end = start + durMs;
  const now = Date.now();
  const earlyMs = 15 * 60 * 1000;
  const lateMs = 60 * 60 * 1000;
  if (now < start - earlyMs) {
    return {
      phase: 'too_early',
      label: 'Opens 15 min before start',
      canJoin: false,
    };
  }
  if (now > end + lateMs) {
    return { phase: 'ended', label: 'Window ended', canJoin: false };
  }
  return { phase: 'open', label: 'Video call available', canJoin: true };
}
