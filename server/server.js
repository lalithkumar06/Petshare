const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth.routes');
const petRoutes = require('./routes/pet.routes');
const adoptionRoutes = require('./routes/adoption.routes');
const notificationRoutes = require('./routes/notification.routes');

dotenv.config();

const app = express();

// Middleware
// Allow Authorization header for CORS preflight (required for multipart/form-data with auth)
app.use(cors({
  origin: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.options('*', cors());
app.use(express.json());

// Serve uploaded files when using local disk storage
const path = require('path');
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');
if (fs.existsSync(uploadsDir)) {
  app.use('/uploads', express.static(uploadsDir));
}

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/adoptions', adoptionRoutes);
app.use('/api/notifications', notificationRoutes);

// JSON error handler to avoid HTML error pages (especially from multer/s3)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err && err.stack ? err.stack : err);
  // Multer errors sometimes have code like 'LIMIT_FILE_SIZE' or are instances of MulterError
  const isMulterError = err && (err.code === 'LIMIT_FILE_SIZE' || err.code === 'LIMIT_UNEXPECTED_FILE' || err.name === 'MulterError');
  if (isMulterError) {
    return res.status(400).json({ message: err.message || 'File upload error', code: err.code });
  }

  // Default to JSON error response
  const status = err && err.status ? err.status : 500;
  res.status(status).json({ message: err && err.message ? err.message : 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});