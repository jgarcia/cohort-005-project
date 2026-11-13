// PROTOTYPE: throwaway (wayfinder ticket #17). Signs a Knock user token so
// the browser can read its own Notification Feed straight from Knock with the
// public key. Enhanced security mode is on, so Knock rejects feed calls without it.
import crypto from "node:crypto";

function env(name: string) {
  if (!process.env[name]) {
    try {
      process.loadEnvFile(".env");
    } catch {}
  }
  return process.env[name];
}

export function getKnockFeedConfig(userId: number | null) {
  const publicKey = env("KNOCK_PUBLIC_API_KEY");
  const channelId = env("KNOCK_FEED_CHANNEL_ID");
  const signingKey = env("KNOCK_SIGNING_KEY");
  if (!userId || !publicKey || !channelId || !signingKey) return null;

  const now = Math.floor(Date.now() / 1000);
  const encode = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  const unsigned = `${encode({ alg: "RS256", typ: "JWT" })}.${encode({
    sub: String(userId),
    iat: now,
    exp: now + 60 * 60,
  })}`;
  const pem = Buffer.from(signingKey, "base64").toString("utf8");
  const signature = crypto
    .sign("RSA-SHA256", Buffer.from(unsigned), pem)
    .toString("base64url");

  return {
    userId: String(userId),
    publicKey,
    channelId,
    userToken: `${unsigned}.${signature}`,
  };
}

export type KnockFeedConfig = NonNullable<ReturnType<typeof getKnockFeedConfig>>;
