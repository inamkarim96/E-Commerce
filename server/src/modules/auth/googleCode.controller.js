const fetch = require('node-fetch');
const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, BACKEND_URL } = require('../../config/env');

// Exchange the auth code for an ID token using Google OAuth token endpoint
// For a production app you should validate the code, handle errors, and verify the token.
// Here we implement a minimal exchange that returns the ID token to the client.

exports.exchangeCode = async (req, res) => {
  const { code, redirectUri } = req.body;
  if (!code) {
    return res.status(400).json({ success: false, error: 'Missing auth code' });
  }

  const tokenEndpoint = 'https://oauth2.googleapis.com/token';
  const params = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID || '',
    client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });

  try {
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });
    if (!response.ok) {
      const err = await response.text();
      console.error('Google token exchange failed:', err);
      return res.status(500).json({ success: false, error: 'Token exchange failed' });
    }
    const data = await response.json();
    // data.id_token is the JWT we can forward to Firebase login
    return res.json({ success: true, id_token: data.id_token });
  } catch (err) {
    console.error('Error exchanging auth code:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
