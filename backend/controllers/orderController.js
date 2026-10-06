const { Op } = require('sequelize');
const Order = require('../models/Order');
const Garment = require('../models/Garment');
const SiteSettings = require('../models/SiteSettings');
const { readVerificationToken } = require('./otpController');
const { sendMail, layout, escapeHtml } = require('../utils/mailer');

const MAX_ORDERS_PER_EMAIL_PER_DAY = 5;
const MAX_QTY = 500;

const fileUrl = (f) => f.location || `/uploads/products/${f.filename}`;
const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const num = (v, min, max, fallback) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};

// ── Middleware: the e-mail OTP token must be valid *before* files are accepted ─
exports.requireVerifiedEmail = (req, res, next) => {
  const email = readVerificationToken(req.headers['x-verification-token']);
  if (!email) {
    return res.status(401).json({ message: 'Email verification expired. Please verify your email again.' });
  }
  req.verifiedEmail = email;
  next();
};

// ── POST /orders (public) ─────────────────────────────────────────────────────
exports.createOrder = async (req, res) => {
  try {
    let data;
    try { data = JSON.parse(req.body.data || '{}'); } catch { data = {}; }

    const customerName = String(data.customerName || '').trim();
    const phone = String(data.phone || '').replace(/[^\d+]/g, '');
    const address = String(data.address || '').trim();
    if (!customerName || phone.length < 10 || !address) {
      return res.status(400).json({ message: 'Name, a valid phone number and delivery address are required' });
    }

    const email = req.verifiedEmail;
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recent = await Order.count({ where: { email, createdAt: { [Op.gte]: since } } });
    if (recent >= MAX_ORDERS_PER_EMAIL_PER_DAY) {
      return res.status(429).json({ message: 'Daily order limit reached for this email. Please contact us on WhatsApp.' });
    }

    const garment = await Garment.findByPk(data.garmentId);
    if (!garment || !garment.isActive) return res.status(400).json({ message: 'Selected product is no longer available' });

    const color = garment.colors.find(c => c.hex === data.colorHex) || garment.colors[0];
    const size = garment.sizes.find(s => s.label === data.size);
    if (!size) return res.status(400).json({ message: 'Please choose a valid size' });
    const quantity = Math.round(num(data.quantity, 1, MAX_QTY, 1));

    // Map uploaded files by field name
    const files = {};
    (req.files || []).forEach(f => { files[f.fieldname] = f; });

    // Only accept prints for placements the admin has enabled, priced from the DB
    const requested = Array.isArray(data.prints) ? data.prints : [];
    const prints = [];
    for (const p of requested) {
      const placement = garment.placements.find(pl => pl.key === p.key && pl.enabled);
      if (!placement) continue;
      const artwork = files[`artwork_${placement.key}`];
      if (!artwork) continue;
      const t = p.transform || {};
      prints.push({
        key: placement.key,
        label: placement.label,
        view: placement.view,
        price: Number(placement.price) || 0,
        kind: p.kind === 'text' ? 'text' : 'image',
        text: p.kind === 'text' ? String(p.text || '').slice(0, 200) : undefined,
        font: p.kind === 'text' ? String(p.font || '').slice(0, 60) : undefined,
        color: p.kind === 'text' ? String(p.color || '').slice(0, 9) : undefined,
        artworkUrl: fileUrl(artwork),
        transform: {
          cx: num(t.cx, 0, 1, 0.5),
          cy: num(t.cy, 0, 1, 0.5),
          scale: num(t.scale, 0.05, 5, 1),
          angle: num(t.angle, -360, 360, 0),
        },
      });
    }
    if (prints.length === 0) {
      return res.status(400).json({ message: 'Add at least one print to your design' });
    }

    const basePrice = Number(garment.basePrice) || 0;
    const printsPrice = prints.reduce((s, p) => s + p.price, 0);
    const sizeExtra = Number(size.extra) || 0;
    const unitPrice = basePrice + printsPrice + sizeExtra;
    const total = unitPrice * quantity;

    const previews = {};
    if (files.preview_front) previews.front = fileUrl(files.preview_front);
    if (files.preview_back) previews.back = fileUrl(files.preview_back);

    const order = await Order.create({
      customerName,
      email,
      phone,
      address,
      city: String(data.city || '').trim(),
      pincode: String(data.pincode || '').trim(),
      notes: String(data.notes || '').trim(),
      emailVerified: true,
      garmentId: garment.id,
      garmentName: garment.name,
      colorName: color?.name,
      colorHex: color?.hex,
      size: size.label,
      quantity,
      prints,
      previews,
      basePrice,
      printsPrice,
      sizeExtra,
      unitPrice,
      total,
      ipAddress: req.ip,
    });
    await order.update({ orderNumber: `AC-${new Date().getFullYear()}-${String(order.id).padStart(4, '0')}` });

    notifyOrderPlaced(order).catch(err => console.error('Order email failed:', err.message));

    const json = order.toJSON();
    delete json.ipAddress;
    res.status(201).json(json);
  } catch (err) {
    console.error('createOrder error:', err);
    res.status(400).json({ message: err.message });
  }
};

async function notifyOrderPlaced(order) {
  const settings = await SiteSettings.findOne();
  const brand = settings?.companyName || 'Astitva Creations';
  const rows = [
    ['Product', `${order.garmentName} – ${order.colorName}, Size ${order.size}`],
    ['Prints', order.prints.map(p => p.label).join(', ')],
    ['Quantity', order.quantity],
    ['Price per piece', inr(order.unitPrice)],
    ['Order total', `<b>${inr(order.total)}</b>`],
  ].map(([k, v]) => `<tr><td style="padding:6px 0;color:#777">${k}</td><td style="padding:6px 0;text-align:right">${k === 'Order total' ? v : escapeHtml(String(v))}</td></tr>`).join('');

  await sendMail({
    to: order.email,
    subject: `Order ${order.orderNumber} received – ${brand}`,
    text: `Hi ${order.customerName}, we've received your order ${order.orderNumber} (${order.garmentName}, total ${inr(order.total)}). Our team will contact you shortly to confirm the design and payment.`,
    html: layout(brand, `Thanks ${order.customerName.split(' ')[0]}, we've got your order!`, `
      <p style="margin:0 0 16px;color:#444;line-height:1.6">Order <b>${escapeHtml(order.orderNumber)}</b> is in. Our team will review your design and contact you on <b>${escapeHtml(order.phone)}</b> to confirm details and payment.</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">${rows}</table>
    `),
  });

  if (settings?.email) {
    await sendMail({
      to: settings.email,
      subject: `🧾 New website order ${order.orderNumber} – ${inr(order.total)}`,
      text: `New order ${order.orderNumber} from ${order.customerName} (${order.phone}). Total ${inr(order.total)}.`,
      html: layout(brand, `New order ${order.orderNumber}`, `
        <p style="margin:0 0 16px;color:#444;line-height:1.6"><b>${escapeHtml(order.customerName)}</b> · ${escapeHtml(order.phone)} · ${escapeHtml(order.email)}<br/>${escapeHtml(order.address)} ${escapeHtml(order.city || '')} ${escapeHtml(order.pincode || '')}</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px">${rows}</table>
        <p style="margin:16px 0 0;color:#777;font-size:13px">Open the admin dashboard → Orders to view the artwork and mockups.</p>
      `),
    });
  }
}

// ── Admin ─────────────────────────────────────────────────────────────────────
exports.getOrders = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const where = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.q) {
      const q = `%${req.query.q}%`;
      where[Op.or] = [
        { orderNumber: { [Op.like]: q } },
        { customerName: { [Op.like]: q } },
        { phone: { [Op.like]: q } },
        { email: { [Op.like]: q } },
      ];
    }
    const { count, rows } = await Order.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
      offset: (page - 1) * limit,
      attributes: { exclude: ['ipAddress'] },
    });
    res.json({ total: count, page, pages: Math.ceil(count / limit), orders: rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getOrderStats = async (req, res) => {
  try {
    const rows = await Order.findAll({
      attributes: ['status', [Order.sequelize.fn('COUNT', Order.sequelize.col('id')), 'count'],
        [Order.sequelize.fn('SUM', Order.sequelize.col('total')), 'revenue']],
      group: ['status'],
      raw: true,
    });
    const byStatus = {};
    let total = 0;
    let revenue = 0;
    rows.forEach(r => {
      byStatus[r.status] = parseInt(r.count);
      total += parseInt(r.count);
      if (r.status !== 'cancelled') revenue += Number(r.revenue) || 0;
    });
    res.json({ total, revenue, byStatus });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, { attributes: { exclude: ['ipAddress'] } });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    const { status, adminNotes } = req.body;
    const statuses = ['new', 'confirmed', 'in_production', 'shipped', 'delivered', 'cancelled'];
    await order.update({
      ...(statuses.includes(status) ? { status } : {}),
      ...(adminNotes !== undefined ? { adminNotes } : {}),
    });
    res.json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    await order.destroy();
    res.json({ message: 'Order deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
