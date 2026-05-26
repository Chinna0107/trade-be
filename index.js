const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

const configuredOrigins = [
  process.env.FRONTEND_DEV_URL,
  process.env.FRONTEND_PROD_URL,
  process.env.FRONTEND_URL,
  ...(process.env.FRONTEND_URLS || '').split(','),
];

const allowedOrigins = (configuredOrigins.some(Boolean)
  ? configuredOrigins
  : [
      'http://localhost:5173',
      'https://tradenexustradesmart.com',
    ])
  .flatMap((origin) => (origin || '').split(','))
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin.replace(/\/$/, ''))) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
}));
app.use(express.json());

app.use('/api/payment', require('./routes/payment'));
app.use('/api/transactions', require('./routes/transactions'));

app.get('/', (req, res) => res.json({ message: '📈 Trade Nexo API is running' }));

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
