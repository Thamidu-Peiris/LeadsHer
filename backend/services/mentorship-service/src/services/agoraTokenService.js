const { RtcTokenBuilder, RtcRole } = require('agora-token');

function agoraUidFromObjectId(oid) {
  const s = String(oid);
  const hex = (s.match(/[a-fA-F0-9]{24}/) || [s.replace(/\D/g, '').padEnd(24, '0')])[0].slice(-8);
  const n = parseInt(hex, 16);
  if (Number.isNaN(n)) return 1;
  return (n >>> 0) || 1;
}

/**
 * @param {{ channelName: string; uid: number; expireSeconds?: number }} opts
 * @returns {{ appId: string; token: string | null; uid: number; privilegeExpiredTs: number }}
 */
function buildRtcToken({ channelName, uid, expireSeconds = 3600 }) {
  const appId = process.env.AGORA_APP_ID?.trim();
  if (!appId) {
    const err = new Error('Video calls are not configured (missing AGORA_APP_ID)');
    err.status = 503;
    throw err;
  }
  const cert = (process.env.AGORA_APP_CERTIFICATE || '').trim();
  const currentTs = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTs + expireSeconds;
  let token = null;
  if (cert) {
    token = RtcTokenBuilder.buildTokenWithUid(appId, cert, channelName, uid, RtcRole.PUBLISHER, privilegeExpiredTs);
  }
  return { appId, token, uid, privilegeExpiredTs };
}

module.exports = { agoraUidFromObjectId, buildRtcToken };
