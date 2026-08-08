import "server-only";
import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER;

const configured = Boolean(SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS);

const transporter = configured
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
  : null;

// Best-effort: notification emails should never block or fail the action that triggered them
// (e.g. task creation must succeed even if the mail server is down or unconfigured).
export async function sendMail(opts: { to: string; subject: string; html: string }) {
  if (!transporter) {
    console.warn(`[mailer] SMTP not configured — skipped email "${opts.subject}" to ${opts.to}`);
    return;
  }
  try {
    await transporter.sendMail({
      from: SMTP_FROM,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
  } catch (err) {
    console.error("[mailer] Failed to send email:", err);
  }
}
