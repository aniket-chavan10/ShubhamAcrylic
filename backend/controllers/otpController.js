const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const EmailOtp = require('../models/EmailOtp');
const SiteSettings = require('../models/SiteSettings');
const { sendMail, layout } = require('../utils/mailer');

const OTP_TTL_MS = 10 * 60 * 1000;          // code valid for 10 minutes
const RESEND_COOLDOWN_MS = 60 * 1000;       // one code per minute per e-mail
const MAX_PER_EMAIL_PER_HOUR = 5;
const MAX_PER_IP_PER_HOUR = 10;
const MAX_VERIFY_ATTEMPTS = 5;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const hashCode = (email, code) =>
  crypto.createHash('sha256').update(`${email}:${code}:${process.env.JWT_SECRET}`).digest('hex');

// ── POST /otp/send ────────────────────────────────────────────────────────────
exports.sendOtp = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    const now = Date.now();
    const hourAgo = new Date(now - 60 * 60 * 1000);

    const latest = await EmailOtp.findOne({ where: { email }, order: [['createdAt', 'DESC']] });
    if (latest && now - new Date(latest.createdAt).getTime() < RESEND_COOLDOWN_MS) {
      const wait = Math.ceil((RESEND_COOLDOWN_MS - (now - new Date(latest.createdAt).getTime())) / 1000);
      return res.status(429).json({ message: `Please wait ${wait}s before requesting a new code`, retryAfter: wait });
    }

    const [emailCount, ipCount] = await Promise.all([
      EmailOtp.count({ where: { email, createdAt: { [Op.gte]: hourAgo } } }),
      EmailOtp.count({ where: { ipAddress: req.ip, createdAt: { [Op.gte]: hourAgo } } }),
    ]);
    if (emailCount >= MAX_PER_EMAIL_PER_HOUR || ipCount >= MAX_PER_IP_PER_HOUR) {
      return res.status(429).json({ message: 'Too many verification requests. Please try again in an hour.' });
    }

    const code = String(crypto.randomInt(100000, 1000000));
    await EmailOtp.create({
      email,
      codeHash: hashCode(email, code),
      expiresAt: new Date(now + OTP_TTL_MS),
      ipAddress: req.ip,
    });

    const settings = await SiteSettings.findOne();
    const brand = settings?.companyName || 'Astitva Creations';

    await sendMail({
      to: email,
      subject: `${code} is your ${brand} verification code`,
      text: `Your ${brand} verification code is ${code}. It expires in 10 minutes.`,
      html: layout(brand, 'Verify your email to place your order', `
        <p style="margin:0 0 20px;color:#444;line-height:1.6">Use the code below to confirm your email address. It expires in <b>10 minutes</b>.</p>
        <div style="font-size:34px;font-weight:700;letter-spacing:10px;background:#f4f2ed;border-radius:12px;padding:18px;text-align:center">${code}</div>
        <p style="margin:20px 0 0;color:#777;font-size:13px;line-height:1.6">If you didn't request this, you can safely ignore this email.</p>
      `),
    });

    res.json({ message: 'Verification code sent', expiresIn: OTP_TTL_MS / 1000 });
  } catch (err) {
    console.error('sendOtp error:', err);
    res.status(500).json({ message: 'Could not send verification email. Please try again later.' });
  }
};

// ── POST /otp/verify ──────────────────────────────────────────────────────────
// Returns a short-lived token that must accompany the order submission.
exports.verifyOtp = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const code = String(req.body.code || '').trim();
    if (!EMAIL_RE.test(email) || !/^\d{6}$/.test(code)) {
      return res.status(400).json({ message: 'Enter the 6-digit code sent to your email' });
    }

    const otp = await EmailOtp.findOne({
      where: { email, consumed: false },
      order: [['createdAt', 'DESC']],
    });
    if (!otp || new Date(otp.expiresAt).getTime() < Date.now()) {
      return res.status(400).json({ message: 'Code expired. Please request a new one.' });
    }
    if (otp.attempts >= MAX_VERIFY_ATTEMPTS) {
      return res.status(429).json({ message: 'Too many wrong attempts. Please request a new code.' });
    }

    const expected = Buffer.from(otp.codeHash, 'hex');
    const actual = Buffer.from(hashCode(email, code), 'hex');
    if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
      await otp.increment('attempts');
      const left = MAX_VERIFY_ATTEMPTS - otp.attempts - 1;
      return res.status(400).json({ message: `Incorrect code. ${Math.max(left, 0)} attempt(s) left.` });
    }

    await otp.update({ consumed: true });
    const verificationToken = jwt.sign({ purpose: 'order', email }, process.env.JWT_SECRET, { expiresIn: '30m' });
    res.json({ message: 'Email verified', verificationToken });
  } catch (err) {
    console.error('verifyOtp error:', err);
    res.status(500).json({ message: 'Verification failed. Please try again.' });
  }
};

// Used by the order controller to validate the token issued above
exports.readVerificationToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.purpose === 'order' ? decoded.email : null;
  } catch {
    return null;
  }
};
