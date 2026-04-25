require('dotenv').config();
require('./config');
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const vaccinationRoutes = require('./routes/vaccination');
const verifyRoutes = require('./routes/verify');
const adminRoutes = require('./routes/admin');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/vaccination', vaccinationRoutes);
app.use('/verify', verifyRoutes);
app.use('/admin', adminRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 4000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
}

module.exports = app;
