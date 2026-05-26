const router = require('express').Router();
const pool = require('../db');

// GET /api/transactions — all transactions with filters
router.get('/', async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = 'SELECT * FROM transactions';
    const params = [];
    const conditions = [];

    if (status && status !== 'all') {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(customer_name ILIKE $${params.length} OR customer_email ILIKE $${params.length} OR customer_phone ILIKE $${params.length} OR receipt_id ILIKE $${params.length})`);
    }

    if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/transactions/stats — summary stats for admin dashboard
router.get('/stats', async (req, res) => {
  try {
    const [total, paid, pending, revenue] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM transactions'),
      pool.query("SELECT COUNT(*) FROM transactions WHERE status='paid'"),
      pool.query("SELECT COUNT(*) FROM transactions WHERE status='pending'"),
      pool.query("SELECT COALESCE(SUM(amount),0) AS total FROM transactions WHERE status='paid'"),
    ]);
    res.json({
      total: parseInt(total.rows[0].count),
      paid: parseInt(paid.rows[0].count),
      pending: parseInt(pending.rows[0].count),
      revenue: parseFloat(revenue.rows[0].total),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
