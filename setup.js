const pool = require('./db');

async function setup() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      razorpay_order_id VARCHAR(100),
      razorpay_payment_id VARCHAR(100),
      receipt_id VARCHAR(50) UNIQUE NOT NULL,
      customer_name VARCHAR(150) NOT NULL,
      customer_email VARCHAR(150) NOT NULL,
      customer_phone VARCHAR(15) NOT NULL,
      customer_state VARCHAR(100),
      customer_pan VARCHAR(10),
      plan_category VARCHAR(200) NOT NULL,
      plan_duration VARCHAR(50) NOT NULL,
      amount NUMERIC(10,2) NOT NULL,
      status VARCHAR(30) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log('✅ Transactions table created');
  process.exit(0);
}

setup().catch(err => {
  console.error('❌ Setup error:', err.message);
  process.exit(1);
});
