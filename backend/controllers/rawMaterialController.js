const { Op } = require('sequelize');
const sequelize = require('../config/database');
const RawMaterial = require('../models/RawMaterial');
const StockMovement = require('../models/StockMovement');
const { applyMovement, stockStatus, suggestedBuy, r2, today } = require('../utils/inventory');

const nonNeg = (n) => Math.max(0, Number(n) || 0);
const str = (v, max = 160) => String(v ?? '').trim().slice(0, max);
const fail = (res, err) => res.status(err.status || 400).json({ message: err.message });

const withStatus = (m) => {
  const json = m.toJSON ? m.toJSON() : m;
  return { ...json, status: stockStatus(json), suggestedBuy: suggestedBuy(json) };
};

function fields(body) {
  const data = {};
  if (body.name !== undefined) data.name = str(body.name, 120);
  if (body.category !== undefined) data.category = str(body.category, 40) || 'garment';
  if (body.color !== undefined) data.color = str(body.color, 60);
  if (body.colorHex !== undefined) data.colorHex = /^#[0-9a-f]{3,8}$/i.test(body.colorHex) ? body.colorHex : '';
  if (body.size !== undefined) data.size = str(body.size, 20);
  if (body.sku !== undefined) data.sku = str(body.sku, 60);
  if (body.unit !== undefined) data.unit = str(body.unit, 20) || 'pcs';
  if (body.reorderLevel !== undefined) data.reorderLevel = nonNeg(body.reorderLevel);
  if (body.reorderQty !== undefined) data.reorderQty = nonNeg(body.reorderQty);
  if (body.costPrice !== undefined) data.costPrice = nonNeg(body.costPrice);
  if (body.supplier !== undefined) data.supplier = str(body.supplier);
  if (body.notes !== undefined) data.notes = String(body.notes || '');
  if (body.garmentId !== undefined) data.garmentId = body.garmentId ? parseInt(body.garmentId) || null : null;
  if (body.isActive !== undefined) data.isActive = body.isActive === true || body.isActive === 'true';
  return data;
}

function summarise(materials) {
  return materials.reduce((s, m) => {
    if (!m.isActive) return s;
    s.total++;
    if (m.status === 'low') s.low++;
    if (m.status === 'out') s.out++;
    s.value += Math.max(0, Number(m.quantity) || 0) * (Number(m.costPrice) || 0);
    return s;
  }, { total: 0, low: 0, out: 0, value: 0 });
}

// ── GET /raw-materials ───────────────────────────────────────────────────────
exports.list = async (req, res) => {
  try {
    const where = {};
    if (req.query.category) where.category = req.query.category;
    if (req.query.q) {
      const q = `%${req.query.q}%`;
      where[Op.or] = [{ name: { [Op.like]: q } }, { color: { [Op.like]: q } }, { sku: { [Op.like]: q } }, { supplier: { [Op.like]: q } }];
    }
    const rows = await RawMaterial.findAll({ where, order: [['name', 'ASC'], ['color', 'ASC'], ['id', 'ASC']] });
    const all = rows.map(withStatus);
    const filtered = req.query.stock ? all.filter(m => m.status === req.query.stock || (req.query.stock === 'reorder' && m.status !== 'ok')) : all;
    res.json({ materials: filtered, summary: summarise(all) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET /raw-materials/reorder — what needs buying (dashboard, menu badge) ───
exports.reorder = async (req, res) => {
  try {
    const rows = (await RawMaterial.findAll({ where: { isActive: true } })).map(withStatus);
    const items = rows
      .filter(m => m.status !== 'ok')
      .sort((a, b) => (a.status === b.status ? Number(a.quantity) - Number(b.quantity) : a.status === 'out' ? -1 : 1));
    res.json({ items, count: items.length, summary: summarise(rows) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── POST /raw-materials ──────────────────────────────────────────────────────
// Body may include `openingStock` – logged as the first adjustment.
async function createOne(body, userId, t) {
  const data = fields(body);
  if (!data.name) throw new Error('Material name is required');
  const material = await RawMaterial.create({ ...data, quantity: 0 }, { transaction: t });
  const opening = nonNeg(body.openingStock);
  if (opening > 0) {
    await applyMovement(material.id, {
      type: 'adjustment', change: opening, unitCost: data.costPrice || null,
      note: 'Opening stock', date: today(), userId,
    }, t);
    await material.reload({ transaction: t });
  }
  return material;
}

exports.create = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const material = await createOne(req.body, req.user?.id, t);
    await t.commit();
    res.status(201).json(withStatus(material));
  } catch (err) {
    await t.rollback();
    fail(res, err);
  }
};

// ── POST /raw-materials/bulk — e.g. every colour × size of a plain hoodie ───
exports.bulkCreate = async (req, res) => {
  const items = Array.isArray(req.body.items) ? req.body.items.slice(0, 300) : [];
  if (!items.length) return res.status(400).json({ message: 'Nothing to add' });
  const t = await sequelize.transaction();
  try {
    const existing = await RawMaterial.findAll({ attributes: ['name', 'color', 'size'], transaction: t, raw: true });
    const key = (m) => [m.name, m.color, m.size].map(v => String(v || '').trim().toLowerCase()).join('|');
    const seen = new Set(existing.map(key));
    const created = [];
    let skipped = 0;
    for (const item of items) {
      if (seen.has(key(item))) { skipped++; continue; }
      seen.add(key(item));
      created.push(await createOne(item, req.user?.id, t));
    }
    await t.commit();
    res.status(201).json({ created: created.map(withStatus), skipped });
  } catch (err) {
    await t.rollback();
    fail(res, err);
  }
};

// ── PUT /raw-materials/:id — details only; stock changes go through movements
exports.update = async (req, res) => {
  try {
    const material = await RawMaterial.findByPk(req.params.id);
    if (!material) return res.status(404).json({ message: 'Material not found' });
    const data = fields(req.body);
    if (data.name === '') return res.status(400).json({ message: 'Material name is required' });
    await material.update(data);
    res.json(withStatus(material));
  } catch (err) {
    fail(res, err);
  }
};

exports.remove = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const material = await RawMaterial.findByPk(req.params.id, { transaction: t });
    if (!material) { await t.rollback(); return res.status(404).json({ message: 'Material not found' }); }
    await StockMovement.destroy({ where: { materialId: material.id }, transaction: t });
    await material.destroy({ transaction: t });
    await t.commit();
    res.json({ message: 'Material deleted' });
  } catch (err) {
    await t.rollback();
    fail(res, err);
  }
};

// ── POST /raw-materials/:id/movements ────────────────────────────────────────
// { type: purchase | usage | adjustment, quantity, unitCost?, supplier?, reference?, note?, date? }
// For an adjustment, `quantity` is the counted stock and the difference is logged.
exports.addMovement = async (req, res) => {
  const { type } = req.body;
  if (!['purchase', 'usage', 'adjustment'].includes(type)) return res.status(400).json({ message: 'Unknown entry type' });
  const qty = r2(nonNeg(req.body.quantity));
  if (type !== 'adjustment' && qty <= 0) return res.status(400).json({ message: 'Enter a quantity greater than 0' });

  const t = await sequelize.transaction();
  try {
    const material = await RawMaterial.findByPk(req.params.id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!material) throw Object.assign(new Error('Material not found'), { status: 404 });
    const current = Number(material.quantity) || 0;
    let change = qty;
    if (type === 'usage') {
      if (qty > current) throw new Error(`Only ${current} ${material.unit} in stock. Record a purchase or correct the stock count first.`);
      change = -qty;
    }
    if (type === 'adjustment') {
      change = r2(qty - current);
      if (change === 0) throw new Error('Counted stock is the same as the current stock');
    }
    const { material: updated, movement } = await applyMovement(material.id, {
      type, change,
      unitCost: type === 'purchase' ? req.body.unitCost : undefined,
      supplier: str(req.body.supplier), reference: str(req.body.reference, 80),
      note: req.body.note || '', date: req.body.date || today(), userId: req.user?.id,
    }, t);
    await t.commit();
    res.status(201).json({ material: withStatus(updated), movement });
  } catch (err) {
    await t.rollback();
    fail(res, err);
  }
};

// ── POST /raw-materials/purchases — one supplier bill with several lines ────
// { date, supplier, reference, note, items: [{ materialId, quantity, unitCost }] }
exports.recordPurchase = async (req, res) => {
  const items = (Array.isArray(req.body.items) ? req.body.items : [])
    .map(it => ({ materialId: parseInt(it.materialId), quantity: r2(nonNeg(it.quantity)), unitCost: it.unitCost }))
    .filter(it => it.materialId && it.quantity > 0);
  if (!items.length) return res.status(400).json({ message: 'Add at least one item with a quantity' });

  const t = await sequelize.transaction();
  try {
    const results = [];
    for (const it of items) {
      results.push(await applyMovement(it.materialId, {
        type: 'purchase', change: it.quantity, unitCost: it.unitCost,
        supplier: str(req.body.supplier), reference: str(req.body.reference, 80),
        note: req.body.note || '', date: req.body.date || today(), userId: req.user?.id,
      }, t));
    }
    await t.commit();
    const total = items.reduce((s, it) => s + it.quantity * (Number(it.unitCost) || 0), 0);
    res.status(201).json({ count: results.length, total: r2(total), materials: results.map(r => withStatus(r.material)) });
  } catch (err) {
    await t.rollback();
    fail(res, err);
  }
};

// ── GET /raw-materials/:id/movements and /raw-materials/movements ───────────
exports.movements = async (req, res) => {
  try {
    const where = req.params.id ? { materialId: req.params.id } : {};
    if (req.query.type) where.type = req.query.type;
    const rows = await StockMovement.findAll({
      where,
      include: [{ model: RawMaterial, as: 'material', attributes: ['id', 'name', 'color', 'size', 'unit'] }],
      order: [['date', 'DESC'], ['id', 'DESC']],
      limit: Math.min(500, parseInt(req.query.limit) || 100),
    });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
