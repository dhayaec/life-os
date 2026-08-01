import 'server-only';

import { appendFileSync } from 'node:fs';
import { Resend } from 'resend';

import { env } from '@/server/env';

type SendEmailInput = {
  to: string;
  name?: string | null;
  subject: string;
  url: string;
  actionLabel: string;
  body: string;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function layout(input: {
  name: string | null | undefined;
  url: string;
  actionLabel: string;
  body: string;
}): string {
  const greeting = input.name ? `Hi ${escapeHtml(input.name)},` : 'Hi,';
  return `<!doctype html>
<html>
  <body style="margin:0;background:#f8fafc;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;padding:24px;">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
      <div style="padding:24px 28px;border-bottom:1px solid #e2e8f0;">
        <strong style="font-size:16px;color:#0f172a;">LifeOS</strong>
      </div>
      <div style="padding:28px;color:#334155;font-size:15px;line-height:1.6;">
        <p style="margin:0 0 16px;">${greeting}</p>
        <p style="margin:0 0 20px;white-space:pre-line;">${escapeHtml(input.body)}</p>
        <p style="margin:0;">
          <a href="${input.url}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600;">${escapeHtml(input.actionLabel)}</a>
        </p>
        <p style="margin:20px 0 0;font-size:12px;color:#94a3b8;word-break:break-all;">Or copy this link: ${escapeHtml(input.url)}</p>
      </div>
    </div>
  </body>
</html>`;
}

export async function sendEmail({
  to,
  name,
  subject,
  url,
  actionLabel,
  body,
}: SendEmailInput): Promise<void> {
  // E2E hook: when E2E_EMAIL_FILE is set, persist the link for Playwright to read
  // and skip the real provider call so CI stays hermetic. No-op in production.
  if (process.env['E2E_EMAIL_FILE']) {
    appendFileSync(process.env['E2E_EMAIL_FILE'], JSON.stringify({ subject, url }) + '\n');
    return;
  }

  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console -- dev affordance, mirrors the old sink
    console.log(`[LifeOS email]\n  To: ${to}\n  Subject: ${subject}\n  ${url}`);
  }

  try {
    const { error } = await new Resend(env.RESEND_API_KEY).emails.send({
      from: env.EMAIL_FROM,
      to,
      subject,
      html: layout({ name, url, actionLabel, body }),
    });
    if (error) {
      console.error(`[LifeOS email] Resend failed for "${subject}": ${error.message}`);
    }
  } catch (err) {
    console.error(`[LifeOS email] send threw for "${subject}":`, err);
  }
}
