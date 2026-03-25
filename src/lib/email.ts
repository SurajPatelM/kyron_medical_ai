import { Resend } from "resend";
import type { Appointment } from "@/types";

function client(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export function buildConfirmationHtml(apt: Appointment): string {
  const { patient, doctor, slot, reason } = apt;
  const when = `${slot.date} at ${slot.time}`;

  return `
<!DOCTYPE html>
<html>
<body style="margin:0;background:#0A1628;font-family:Plus Jakarta Sans,Segoe UI,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0A1628;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:28px 32px;background:linear-gradient(135deg,rgba(0,212,170,0.15),rgba(14,165,233,0.1));">
              <h1 style="margin:0;color:#f8fafc;font-size:22px;font-weight:600;">Kyron Medical</h1>
              <p style="margin:8px 0 0;color:#94a3b8;font-size:14px;">Appointment confirmation</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px;color:#e2e8f0;font-size:15px;line-height:1.6;">
              <p style="margin:0 0 16px;">Hi ${patient.firstName},</p>
              <p style="margin:0 0 16px;">Your appointment is confirmed.</p>
              <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;color:#cbd5e1;font-size:14px;">
                <tr><td style="padding:6px 0;"><strong style="color:#00D4AA;">Provider</strong></td></tr>
                <tr><td style="padding:0 0 12px;">${doctor.name} — ${doctor.specialty}</td></tr>
                <tr><td style="padding:6px 0;"><strong style="color:#00D4AA;">When</strong></td></tr>
                <tr><td style="padding:0 0 12px;">${when}</td></tr>
                <tr><td style="padding:6px 0;"><strong style="color:#00D4AA;">Reason</strong></td></tr>
                <tr><td style="padding:0 0 12px;">${reason}</td></tr>
                <tr><td style="padding:6px 0;"><strong style="color:#00D4AA;">Location</strong></td></tr>
                <tr><td style="padding:0 0 12px;">245 Wellness Drive, Suite 300, Boston, MA 02115</td></tr>
              </table>
              <p style="margin:24px 0 0;color:#94a3b8;font-size:13px;">Please arrive 15 minutes early with a photo ID and insurance card.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendAppointmentEmail(apt: Appointment): Promise<boolean> {
  const resend = client();
  if (!resend) {
    console.warn("RESEND_API_KEY not set; skipping email");
    return false;
  }

  const from =
    process.env.RESEND_FROM_EMAIL || "Kyron Medical <onboarding@resend.dev>";

  try {
    const { error } = await resend.emails.send({
      from,
      to: apt.patient.email,
      subject: `Appointment confirmed — ${apt.doctor.name}`,
      html: buildConfirmationHtml(apt),
    });
    if (error) {
      console.error("Resend error:", error);
      return false;
    }
    return true;
  } catch (e) {
    console.error("sendAppointmentEmail:", e);
    return false;
  }
}
