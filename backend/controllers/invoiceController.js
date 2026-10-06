const { Op } = require('sequelize');
const Invoice = require('../models/Invoice');
const Order = require('../models/Order');

const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const nonNeg = (n) => Math.max(0, Number(n) || 0);

// Same formula as the admin invoice editor (admin-dashboard/src/utils/invoiceMath.ts)
function computeTotals(inv) {
  const items = (inv.items || []).map(it => {
    const qty = nonNeg(it.qty);
    const rate = nonNeg(it.rate);
    const discountPct = Math.min(100, nonNeg(it.discountPct));
    return {
      description: String(it.description || '').trim(),
      hsn: String(it.hsn || '').trim(),
      unit: String(it.unit || 'pcs').trim(),
      qty,
      rate,
      discountPct,
      amount: r2(qty * rate * (1 - discountPct / 100)),
    };
  }).filter(it => it.description);

  const subtotal = r2(items.reduce((s, it) => s + it.amount, 0));
  const discountValue = nonNeg(inv.discountValue);
  const discountTotal = r2(inv.discountType === 'percent'
    ? subtotal * Math.min(100, discountValue) / 100
    : Math.min(discountValue, subtotal));
  const taxable = subtotal - discountTotal;
  const taxTotal = r2(taxable * nonNeg(inv.taxPercent) / 100);
  const beforeRound = r2(taxable + taxTotal + nonNeg(inv.shipping));
  const grandTotal = inv.roundOff ? Math.round(beforeRound) : beforeRound;

  return {
    items,
    subtotal,
    discountTotal,
    taxTotal,
    roundOffAmount: r2(grandTotal - beforeRound),
    grandTotal,
  };
}

async function nextInvoiceNumber() {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;
  const last = await Invoice.findOne({
    where: { invoiceNumber: { [Op.like]: `${prefix}%` } },
    order: [['id', 'DESC']],
  });
  const lastNum = last ? parseInt(last.invoiceNumber.slice(prefix.length)) || 0 : 0;
  return `${prefix}${String(lastNum + 1).padStart(4, '0')}`;
}

function buildPayload(body) {
  const bool = (v, d) => (v === undefined ? d : v === true || v === 'true');
  const data = {
    invoiceDate: body.invoiceDate || new Date().toISOString().slice(0, 10),
    dueDate: body.dueDate || null,
    source: body.source === 'website' ? 'website' : 'manual',
    orderId: body.orderId ? parseInt(body.orderId) : null,
    customerName: String(body.customerName || '').trim(),
    customerPhone: body.customerPhone || '',
    customerEmail: body.customerEmail || '',
    customerAddress: body.customerAddress || '',
    customerGstin: body.customerGstin || '',
    discountType: body.discountType === 'percent' ? 'percent' : 'amount',
    discountValue: nonNeg(body.discountValue),
    taxPercent: Math.min(100, nonNeg(body.taxPercent)),
    taxMode: body.taxMode === 'igst' ? 'igst' : 'cgst_sgst',
    shipping: nonNeg(body.shipping),
    roundOff: bool(body.roundOff, true),
    amountPaid: nonNeg(body.amountPaid),
    notes: body.notes || '',
    terms: body.terms || '',
  };
  const totals = computeTotals({ ...data, items: body.items });

  let status = ['draft', 'unpaid', 'partial', 'paid', 'cancelled'].includes(body.status) ? body.status : 'unpaid';
  if (status !== 'draft' && status !== 'cancelled') {
    if (data.amountPaid >= totals.grandTotal && totals.grandTotal > 0) status = 'paid';
    else if (data.amountPaid > 0) status = 'partial';
    else status = 'unpaid';
  }
  return { ...data, ...totals, status };
}

// ── GET /invoices ─────────────────────────────────────────────────────────────
exports.getInvoices = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const where = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.source) where.source = req.query.source;
    if (req.query.q) {
      const q = `%${req.query.q}%`;
      where[Op.or] = [
        { invoiceNumber: { [Op.like]: q } },
        { customerName: { [Op.like]: q } },
        { customerPhone: { [Op.like]: q } },
      ];
    }
    const { count, rows } = await Invoice.findAndCountAll({
      where,
      order: [['invoiceDate', 'DESC'], ['id', 'DESC']],
      limit,
      offset: (page - 1) * limit,
    });

    const all = await Invoice.findAll({
      where: { status: { [Op.notIn]: ['draft', 'cancelled'] } },
      attributes: ['grandTotal', 'amountPaid'],
      raw: true,
    });
    const summary = all.reduce((s, i) => {
      s.billed += Number(i.grandTotal) || 0;
      s.received += Math.min(Number(i.amountPaid) || 0, Number(i.grandTotal) || 0);
      return s;
    }, { billed: 0, received: 0 });
    summary.outstanding = summary.billed - summary.received;

    res.json({ total: count, page, pages: Math.ceil(count / limit), invoices: rows, summary });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getNextNumber = async (req, res) => {
  try {
    res.json({ invoiceNumber: await nextInvoiceNumber() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createInvoice = async (req, res) => {
  try {
    const payload = buildPayload(req.body);
    if (!payload.customerName) return res.status(400).json({ message: 'Customer name is required' });
    if (payload.items.length === 0) return res.status(400).json({ message: 'Add at least one item' });

    let invoiceNumber = String(req.body.invoiceNumber || '').trim();
    if (!invoiceNumber || await Invoice.findOne({ where: { invoiceNumber } })) {
      invoiceNumber = await nextInvoiceNumber();
    }
    const invoice = await Invoice.create({ ...payload, invoiceNumber });

    if (payload.orderId) {
      const order = await Order.findByPk(payload.orderId);
      if (order && order.status === 'new') await order.update({ status: 'confirmed' });
    }
    res.status(201).json(invoice);
  } catch (err) {
    console.error('createInvoice error:', err);
    res.status(400).json({ message: err.message });
  }
};

exports.updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    const payload = buildPayload(req.body);
    if (!payload.customerName) return res.status(400).json({ message: 'Customer name is required' });
    if (payload.items.length === 0) return res.status(400).json({ message: 'Add at least one item' });

    const invoiceNumber = String(req.body.invoiceNumber || '').trim();
    if (invoiceNumber && invoiceNumber !== invoice.invoiceNumber) {
      if (await Invoice.findOne({ where: { invoiceNumber } })) {
        return res.status(400).json({ message: 'Invoice number already used' });
      }
      payload.invoiceNumber = invoiceNumber;
    }
    await invoice.update(payload);
    res.json(invoice);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    await invoice.destroy();
    res.json({ message: 'Invoice deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.computeTotals = computeTotals;
