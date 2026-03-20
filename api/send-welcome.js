const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, agencyName } = req.body;
  if (!email) return res.status(400).json({ error: 'Missing email' });

  try {
    await resend.emails.send({
      from: 'Metrik <hello@usemetrik.app>',
      to: email,
      subject: 'Your 14-day trial just started.',
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:48px 32px;">

    <!-- Logo -->
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:48px;">
      <div style="width:8px;height:8px;border-radius:50%;background:#c8f060;"></div>
      <span style="font-size:12px;font-weight:600;letter-spacing:3px;color:#4a4742;text-transform:uppercase;">Metrik</span>
    </div>

    <!-- Headline -->
    <h1 style="font-size:28px;font-weight:700;color:#f0ede8;letter-spacing:-0.5px;margin:0 0 16px;line-height:1.2;">
      You've got 14 days.<br>Find out if you're actually profitable.
    </h1>

    <p style="font-size:15px;color:#8a8580;line-height:1.7;margin:0 0 32px;">
      ${agencyName ? `Welcome, ${agencyName}.` : 'Welcome.'} Most agencies running Meta ads don't actually know if their clients are making money. Metrik fixes that.
    </p>

    <!-- What to do first -->
    <div style="background:#111111;border-radius:12px;border:0.5px solid rgba(255,255,255,0.08);padding:24px;margin-bottom:32px;">
      <p style="font-size:11px;font-weight:600;color:#4a4742;text-transform:uppercase;letter-spacing:1px;margin:0 0 16px;">Start here</p>
      <div style="display:flex;flex-direction:column;gap:12px;">
        <div style="display:flex;align-items:flex-start;gap:12px;">
          <span style="color:#c8f060;font-weight:700;font-size:13px;margin-top:1px;">1</span>
          <span style="font-size:13px;color:#8a8580;line-height:1.5;">Add your first client — name, gross margin, AOV</span>
        </div>
        <div style="display:flex;align-items:flex-start;gap:12px;">
          <span style="color:#c8f060;font-weight:700;font-size:13px;margin-top:1px;">2</span>
          <span style="font-size:13px;color:#8a8580;line-height:1.5;">Log today's numbers — ad spend, Meta revenue, store revenue</span>
        </div>
        <div style="display:flex;align-items:flex-start;gap:12px;">
          <span style="color:#c8f060;font-weight:700;font-size:13px;margin-top:1px;">3</span>
          <span style="font-size:13px;color:#8a8580;line-height:1.5;">Watch Metrik tell you exactly what to do with your budget</span>
        </div>
      </div>
    </div>

    <!-- CTA -->
    <a href="https://www.usemetrik.app/app.html" style="display:block;background:#c8f060;color:#0a0a0a;text-decoration:none;padding:14px 24px;border-radius:10px;font-size:14px;font-weight:700;text-align:center;margin-bottom:32px;">
      Open Metrik →
    </a>

    <!-- Footer -->
    <p style="font-size:12px;color:#2a2724;line-height:1.6;margin:0;">
      Your trial runs for 14 days. After that, pick a plan or your data stays locked until you do.<br><br>
      — Mahlik, founder of Metrik
    </p>

  </div>
</body>
</html>
      `,
    });

    res.status(200).json({ sent: true });
  } catch (err) {
    console.error('Welcome email error:', err);
    res.status(500).json({ error: err.message });
  }
};
