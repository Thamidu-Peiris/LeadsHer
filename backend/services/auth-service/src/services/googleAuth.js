/**
 * Verify Google ID token (from frontend Google Sign-In) and return user info.
 * Requires GOOGLE_CLIENT_ID in env.
 */
const { OAuth2Client } = require('google-auth-library');

const getGooglePayload = async (idToken) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    const err = new Error('Google OAuth is not configured.');
    err.status = 503;
    throw err;
  }
  const client = new OAuth2Client(clientId);
  const ticket = await client.verifyIdToken({ idToken, audience: clientId });
  const payload = ticket.getPayload();
  return {
    googleId: payload.sub,
    email: payload.email,
    name: payload.name,
    profilePicture: payload.picture,
  };
};

module.exports = { getGooglePayload };
