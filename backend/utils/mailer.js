const nodemailer = require('nodemailer');

// SMTP transport configured from env. When SMTP is not configured (local dev)
// mails are printed to the console instead of being sent.
const isConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const transporter = isConfigured
  ? nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 465,
    secure: (parseInt(process.env.SMTP_PORT) || 465) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })
  : null;

const escapeHtml = (s = '') => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Shared branded wrapper for every e-mail we send
function layout(brand, title, bodyHtml) {
  return `
  <div style="background:#f4f2ed;padding:32px 12px;font-family:Helvetica,Arial,sans-serif;color:#141414">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden">
      <div style="background:#141414;color:#ffffff;padding:22px 28px;font-size:18px;font-weight:700;letter-spacing:.04em;text-transform:uppercase">
        ${escapeHtml(brand)}
      </div>
      <div style="padding:28px">
        <h1 style="font-size:20px;margin:0 0 16px">${escapeHtml(title)}</h1>
        ${bodyHtml}
      </div>
      <div style="padding:16px 28px;background:#faf9f6;color:#777;font-size:12px">
        This is an automated message from ${escapeHtml(brand)}. Please do not reply to this e-mail.
      </div>
    </div>
  </div>`;
}

async function sendMail({ to, subject, html, text }) {
  if (!isConfigured) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Email service is not configured');
    }
    console.log(`\n📧 [DEV MAIL – SMTP not configured]\nTo: ${to}\nSubject: ${subject}\n${text || ''}\n`);
    return;
  }
  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to,
    subject,
    html,
    text,
  });
}

module.exports = { sendMail, layout, escapeHtml, isConfigured };
