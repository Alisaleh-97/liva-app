import { env } from './env.js';

export const emailConfigured = Boolean(env.RESEND_API_KEY);

/**
 * Sends a password reset code without adding another server dependency.
 * In local development the route also returns the code to the preview UI;
 * production responses never expose it.
 */
export async function sendPasswordResetCode({ email, firstName, code }) {
  if (!emailConfigured) {
    if (env.NODE_ENV !== 'production') {
      console.log(`[liva-server] password reset code for ${email}: ${code}`);
    }
    return false;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `LIVA <${env.EMAIL_FROM}>`,
      to: [email],
      subject: 'Your LIVA password reset code',
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;background:#07111f;padding:32px;color:#ffffff">
          <div style="max-width:520px;margin:auto;background:#0e1d2e;border-radius:24px;padding:28px">
            <div style="font-size:13px;color:#19c6e6;font-weight:800;letter-spacing:1px">LIVA LIVE MARKET</div>
            <h1 style="margin:16px 0 8px;font-size:24px">Hi ${escapeHtml(firstName || 'there')},</h1>
            <p style="color:#b8c5d6;line-height:1.6">Use this one-time code to reset your password. It expires in 10 minutes.</p>
            <div style="font-size:34px;letter-spacing:8px;font-weight:900;background:#07111f;border-radius:16px;padding:18px;text-align:center;margin:22px 0">${code}</div>
            <p style="color:#8392a7;font-size:13px">If you did not request this, you can safely ignore this message.</p>
          </div>
        </div>`,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Email provider rejected the request (${response.status}): ${detail.slice(0, 180)}`);
  }
  return true;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
