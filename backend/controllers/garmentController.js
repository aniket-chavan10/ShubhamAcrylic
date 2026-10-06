const Garment = require('../models/Garment');

const ORDER = [['sortOrder', 'ASC'], ['id', 'ASC']];

const parseMaybeJson = (value, fallback) => {
  if (value === undefined) return undefined;
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch { return fallback; }
};

const clamp01 = (n) => Math.min(1, Math.max(0, Number(n) || 0));
const money = (n) => Math.max(0, Math.round((Number(n) || 0) * 100) / 100);
const slugify = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

function sanitize(body) {
  const data = {};
  if (body.name !== undefined) data.name = String(body.name).trim();
  if (body.key !== undefined) data.key = slugify(body.key);
  if (body.style !== undefined && ['hoodie', 'oversized-tee', 'polo'].includes(body.style)) data.style = body.style;
  if (body.tagline !== undefined) data.tagline = String(body.tagline);
  if (body.description !== undefined) data.description = String(body.description);
  if (body.fabric !== undefined) data.fabric = String(body.fabric);
  if (body.basePrice !== undefined) data.basePrice = money(body.basePrice);
  if (body.sortOrder !== undefined) data.sortOrder = parseInt(body.sortOrder) || 0;
  if (body.isActive !== undefined) data.isActive = body.isActive === true || body.isActive === 'true';

  const colors = parseMaybeJson(body.colors, []);
  if (Array.isArray(colors)) {
    data.colors = colors
      .filter(c => c && c.name && /^#[0-9a-f]{6}$/i.test(c.hex))
      .map(c => ({ name: String(c.name).trim(), hex: c.hex.toLowerCase() }));
  }

  const sizes = parseMaybeJson(body.sizes, []);
  if (Array.isArray(sizes)) {
    data.sizes = sizes
      .filter(s => s && String(s.label || '').trim())
      .map(s => ({ label: String(s.label).trim(), extra: money(s.extra) }));
  }

  const placements = parseMaybeJson(body.placements, []);
  if (Array.isArray(placements)) {
    data.placements = placements
      .filter(p => p && p.key && p.label)
      .map(p => ({
        key: slugify(p.key),
        label: String(p.label).trim(),
        view: p.view === 'back' ? 'back' : 'front',
        price: money(p.price),
        x: clamp01(p.x),
        y: clamp01(p.y),
        w: clamp01(p.w) || 0.1,
        h: clamp01(p.h) || 0.1,
        enabled: p.enabled !== false && p.enabled !== 'false',
      }));
  }
  return data;
}

function applyUploads(req, data) {
  const fileUrl = (f) => f.location || `/uploads/products/${f.filename}`;
  if (req.files?.mockupFront?.[0]) data.mockupFront = fileUrl(req.files.mockupFront[0]);
  if (req.files?.mockupBack?.[0]) data.mockupBack = fileUrl(req.files.mockupBack[0]);
  // Explicit removal ("" or "null") of a custom mockup
  if (req.body.removeMockupFront === 'true') data.mockupFront = null;
  if (req.body.removeMockupBack === 'true') data.mockupBack = null;
}

// ── Public ────────────────────────────────────────────────────────────────────
exports.getActiveGarments = async (req, res) => {
  try {
    const garments = await Garment.findAll({ where: { isActive: true }, order: ORDER });
    res.json(garments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Admin ─────────────────────────────────────────────────────────────────────
exports.getAllGarments = async (req, res) => {
  try {
    res.json(await Garment.findAll({ order: ORDER }));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createGarment = async (req, res) => {
  try {
    const data = sanitize(req.body);
    if (!data.name) return res.status(400).json({ message: 'Name is required' });
    if (!data.key) data.key = slugify(data.name);
    if (await Garment.findOne({ where: { key: data.key } })) {
      return res.status(400).json({ message: 'A garment with this key already exists' });
    }
    applyUploads(req, data);
    const garment = await Garment.create(data);
    res.status(201).json(garment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateGarment = async (req, res) => {
  try {
    const garment = await Garment.findByPk(req.params.id);
    if (!garment) return res.status(404).json({ message: 'Garment not found' });
    const data = sanitize(req.body);
    if (data.key && data.key !== garment.key && await Garment.findOne({ where: { key: data.key } })) {
      return res.status(400).json({ message: 'A garment with this key already exists' });
    }
    applyUploads(req, data);
    await garment.update(data);
    res.json(garment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteGarment = async (req, res) => {
  try {
    const garment = await Garment.findByPk(req.params.id);
    if (!garment) return res.status(404).json({ message: 'Garment not found' });
    await garment.destroy();
    res.json({ message: 'Garment deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create the default Hoodie / Oversized Tee / Polo on first run
exports.seedDefaults = async () => {
  if (await Garment.count() > 0) return;
  await Garment.bulkCreate(Garment.DEFAULTS);
  console.log('✅ Default garments (Hoodie, Oversized Tee, Polo) created');
};
