const sequelize = require('../config/database');
const RawMaterial = require('../models/RawMaterial');
const StockMovement = require('../models/StockMovement');

const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const today = () => new Date().toISOString().slice(0, 10);

/**
 * Change a material's stock and log it. Must run inside a transaction; the
 * material row is locked so concurrent updates can't lose a change.
 *
 * Purchases update the average cost:
 *   newCost = (oldQty × oldCost + boughtQty × unitCost) / (oldQty + boughtQty)
 */
async function applyMovement(materialId, entry, transaction) {
  const material = await RawMaterial.findByPk(materialId, { transaction, lock: transaction.LOCK.UPDATE });
  if (!material) throw Object.assign(new Error('Material not found'), { status: 404 });

  const oldQty = Number(material.quantity) || 0;
  const change = r2(entry.change);
  const balance = r2(oldQty + change);
  const updates = { quantity: balance };

  if (entry.type === 'purchase' && change > 0 && entry.unitCost !== undefined && entry.unitCost !== null && entry.unitCost !== '') {
    const unitCost = Math.max(0, Number(entry.unitCost) || 0);
    const oldCost = Number(material.costPrice) || 0;
    const base = Math.max(0, oldQty);
    updates.costPrice = base > 0 && oldCost > 0 ? r2((base * oldCost + change * unitCost) / (base + change)) : unitCost;
  }
  if (entry.type === 'purchase' && entry.supplier) updates.supplier = entry.supplier;

  await material.update(updates, { transaction });
  const movement = await StockMovement.create({
    materialId,
    type: entry.type,
    change,
    balanceAfter: balance,
    unitCost: entry.unitCost === '' || entry.unitCost === undefined ? null : entry.unitCost,
    supplier: entry.supplier || '',
    reference: entry.reference || '',
    note: entry.note || '',
    date: entry.date || today(),
    orderId: entry.orderId || null,
    userId: entry.userId || null,
  }, { transaction });

  return { material, movement };
}

// Order statuses where the plain garment has been taken out of stock
const CONSUMED = new Set(['in_production', 'shipped', 'delivered']);

/**
 * Keep stock in step with a website order: deduct the linked plain garment
 * when the order goes into production, put it back if the order is cancelled
 * or moved back. Idempotent — it looks at what was already logged for the order.
 */
async function syncOrderStock(order, userId) {
  if (!order.garmentId) return [];
  const t = await sequelize.transaction();
  try {
    const logged = await StockMovement.findAll({ where: { orderId: order.id, type: 'order' }, transaction: t });
    const netByMaterial = new Map();
    logged.forEach(m => netByMaterial.set(m.materialId, r2((netByMaterial.get(m.materialId) || 0) + Number(m.change))));
    const changes = [];

    if (CONSUMED.has(order.status)) {
      const alreadyDeducted = [...netByMaterial.values()].some(v => v < 0);
      if (!alreadyDeducted) {
        const candidates = await RawMaterial.findAll({ where: { garmentId: order.garmentId, isActive: true }, transaction: t });
        const norm = (s) => String(s || '').trim().toLowerCase();
        const material = candidates.find(m => norm(m.color) === norm(order.colorName) && norm(m.size) === norm(order.size));
        if (material) {
          changes.push(await applyMovement(material.id, {
            type: 'order', change: -(Number(order.quantity) || 1), reference: order.orderNumber,
            note: `Used for website order ${order.orderNumber}`, orderId: order.id, userId,
          }, t));
        }
      }
    } else {
      // Not (or no longer) in production: return anything still deducted
      for (const [materialId, net] of netByMaterial) {
        if (net < 0) {
          changes.push(await applyMovement(materialId, {
            type: 'order', change: -net, reference: order.orderNumber,
            note: `Returned to stock – order ${order.orderNumber} is ${order.status.replace('_', ' ')}`, orderId: order.id, userId,
          }, t));
        }
      }
    }
    await t.commit();
    return changes;
  } catch (err) {
    await t.rollback();
    throw err;
  }
}

/** Stock status for a material row */
function stockStatus(m) {
  const qty = Number(m.quantity) || 0;
  if (qty <= 0) return 'out';
  if (qty <= (Number(m.reorderLevel) || 0)) return 'low';
  return 'ok';
}

/** Suggested quantity to buy: the usual reorder qty, else enough for 2× the alert level */
function suggestedBuy(m) {
  const qty = Number(m.quantity) || 0;
  const level = Number(m.reorderLevel) || 0;
  const usual = Number(m.reorderQty) || 0;
  return Math.max(0, Math.ceil(usual > 0 ? usual : level * 2 - qty));
}

module.exports = { applyMovement, syncOrderStock, stockStatus, suggestedBuy, r2, today };
