const COOKIE_NAME = "admin_session";
const MAX_AGE = 86400; // 24 hours in seconds

function getSecret(): string {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) throw new Error("ADMIN_PASSWORD env var is not set");
  return pw;
}

async function hmac(data: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Create an HMAC-signed cookie value: timestamp|nonce|signature */
export async function signCookie(): Promise<string> {
  const secret = getSecret();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const payload = `${timestamp}|${nonce}`;
  const sig = await hmac(payload, secret);
  return `${payload}|${sig}`;
}

/** Verify an HMAC-signed cookie value. Returns true if valid and not expired. */
export async function verifyCookie(value: string): Promise<boolean> {
  try {
    const secret = getSecret();
    const parts = value.split("|");
    if (parts.length !== 3) return false;
    const [timestamp, nonce, sig] = parts;
    const payload = `${timestamp}|${nonce}`;
    const expected = await hmac(payload, secret);

    // Constant-time comparison
    if (sig.length !== expected.length) return false;
    let mismatch = 0;
    for (let i = 0; i < sig.length; i++) {
      mismatch |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
    }
    if (mismatch !== 0) return false;

    // Check expiry
    const ts = parseInt(timestamp, 10);
    if (isNaN(ts)) return false;
    const now = Math.floor(Date.now() / 1000);
    return now - ts < MAX_AGE;
  } catch {
    return false;
  }
}

export function verifyPassword(password: string): boolean {
  const secret = getSecret();
  return password === secret;
}

export { COOKIE_NAME, MAX_AGE };
