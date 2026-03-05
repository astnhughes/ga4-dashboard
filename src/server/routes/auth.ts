import { Router, Request, Response } from 'express';
import crypto from 'crypto';

const router = Router();

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret-change-in-production';

// Optional: restrict to specific emails (comma-separated env var)
const ALLOWED_EMAILS = process.env.ALLOWED_EMAILS
  ? process.env.ALLOWED_EMAILS.split(',').map((e) => e.trim().toLowerCase())
  : null; // null = allow any Google account

// --- Token signing (HMAC-SHA256, no JWT dependency) ---

interface SessionPayload {
  email: string;
  name: string;
  picture: string;
  exp: number;
}

function signToken(payload: SessionPayload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

export function verifyToken(token: string): SessionPayload | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [data, sig] = parts;
  const expected = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
  if (sig !== expected) return null;
  try {
    return JSON.parse(Buffer.from(data, 'base64url').toString()) as SessionPayload;
  } catch {
    return null;
  }
}

// --- Helper: get cookie from request ---

export function getCookie(req: Request, name: string): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;
  const match = header.split(';').find((c) => c.trim().startsWith(`${name}=`));
  if (!match) return undefined;
  return decodeURIComponent(match.trim().slice(name.length + 1));
}

// --- Helper: base URL (respects Cloud Run proxy) ---

function getBaseUrl(req: Request): string {
  const proto = req.get('x-forwarded-proto') || req.protocol;
  const host = req.get('x-forwarded-host') || req.get('host');
  return `${proto}://${host}`;
}

// --- Routes ---

// GET /api/auth/login — redirect to Google OAuth consent
router.get('/auth/login', (req: Request, res: Response) => {
  const baseUrl = getBaseUrl(req);
  const redirectUri = `${baseUrl}/api/auth/callback`;

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'email profile',
    access_type: 'online',
    prompt: 'select_account',
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

// GET /api/auth/callback — exchange code, set session cookie
router.get('/auth/callback', async (req: Request, res: Response) => {
  const { code, error } = req.query;

  if (error || !code) {
    res.status(400).send(`Authentication failed: ${error || 'missing code'}`);
    return;
  }

  const baseUrl = getBaseUrl(req);
  const redirectUri = `${baseUrl}/api/auth/callback`;

  try {
    // Exchange authorization code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: code as string,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      const detail = await tokenRes.text();
      console.error('Token exchange failed:', detail);
      res.status(401).send('Failed to authenticate with Google. Please try again.');
      return;
    }

    const tokens = await tokenRes.json();

    // Get user info from Google
    const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userRes.ok) {
      res.status(401).send('Failed to get user info from Google.');
      return;
    }

    const user = await userRes.json();

    // Check allowed emails (if restriction is enabled)
    if (ALLOWED_EMAILS && !ALLOWED_EMAILS.includes(user.email.toLowerCase())) {
      res.status(403).send(
        `Access denied. ${user.email} is not authorized to view this dashboard. Contact your administrator.`
      );
      return;
    }

    // Create signed session cookie (7-day expiry)
    const token = signToken({
      email: user.email,
      name: user.name || user.email,
      picture: user.picture || '',
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });

    res.cookie('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    // Redirect to the app
    const appUrl = process.env.NODE_ENV === 'production' ? '/' : 'http://localhost:5173/';
    res.redirect(appUrl);
  } catch (err) {
    console.error('OAuth callback error:', err);
    res.status(500).send('Authentication error. Please try again.');
  }
});

// GET /api/auth/me — return current user (or 401)
router.get('/auth/me', (req: Request, res: Response) => {
  const token = getCookie(req, 'session');
  if (!token) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const payload = verifyToken(token);
  if (!payload || payload.exp < Date.now()) {
    res.clearCookie('session', { path: '/' });
    res.status(401).json({ error: 'Session expired' });
    return;
  }

  res.json({
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
  });
});

// POST /api/auth/logout — clear session
router.post('/auth/logout', (_req: Request, res: Response) => {
  res.clearCookie('session', { path: '/' });
  res.json({ success: true });
});

export default router;
