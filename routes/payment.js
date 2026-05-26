const router = require('express').Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const pool = require('../db');
require('dotenv').config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// POST /api/payment/create-order
router.post('/create-order', async (req, res) => {
  const { amount, plan_category, plan_duration, customer } = req.body;
  try {
    const receipt_id = `REC-TN-${Date.now()}-${Math.floor(Math.random() * 9999)}`;

    const order = await razorpay.orders.create({
      amount: amount * 100, // paise
      currency: 'INR',
      receipt: receipt_id,
      notes: {
        plan_category,
        plan_duration,
        customer_name: customer.name,
        customer_email: customer.email,
      },
    });

    // Save pending transaction
    await pool.query(
      `INSERT INTO transactions
        (razorpay_order_id, receipt_id, customer_name, customer_email, customer_phone, customer_state, customer_pan, plan_category, plan_duration, amount, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'pending')`,
      [order.id, receipt_id, customer.name, customer.email, customer.phone, customer.state, customer.pan, plan_category, plan_duration, amount]
    );

    res.json({ order_id: order.id, receipt_id, key: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/payment/verify
router.post('/verify', async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  try {
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      await pool.query('UPDATE transactions SET status=$1 WHERE razorpay_order_id=$2', ['failed', razorpay_order_id]);
      return res.status(400).json({ error: 'Payment verification failed' });
    }

    const result = await pool.query(
      'UPDATE transactions SET razorpay_payment_id=$1, status=$2 WHERE razorpay_order_id=$3 RETURNING *',
      [razorpay_payment_id, 'paid', razorpay_order_id]
    );

    res.json({ success: true, transaction: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
