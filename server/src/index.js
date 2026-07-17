const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

connectDB();

const app = express();

app.use(helmet());
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/tests', require('./routes/testRoutes'));
app.use('/api/questions', require('./routes/questionRoutes'));
app.use('/api/exam', require('./routes/examRoutes'));
app.use('/api/security', require('./routes/securityRoutes'));
app.use('/api/results', require('./routes/resultRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/colleges', require('./routes/collegeRoutes'));
app.use('/api/auth', require('./routes/passwordResetRoutes'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
