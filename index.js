const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || [
  'http://localhost:5173',
  'https://tradenexustradesmart.com',
].join(','))
  .split(',')
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
