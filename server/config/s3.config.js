const fs = require('fs');
const path = require('path');
const multer = require('multer');
let multerS3;
let AWS;
try {
  multerS3 = require('multer-s3');
  AWS = require('aws-sdk');
} catch (e) {
  // optional
}
require('dotenv').config();

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// If S3 is configured, use multer-s3, otherwise fall back to disk storage
if (process.env.AWS_BUCKET_NAME && AWS && multerS3) {
  const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
  });

  const upload = multer({
    storage: multerS3({
      s3: s3,
      bucket: process.env.AWS_BUCKET_NAME,
      // Only set ACL when explicitly configured. Some S3 buckets disallow ACLs (Block Public Access),
      // which will raise an error if 'acl' is provided. Leave undefined by default.
      ...(process.env.S3_ACL ? { acl: process.env.S3_ACL } : {}),
      metadata: function (req, file, cb) {
        cb(null, { fieldName: file.fieldname });
      },
      key: function (req, file, cb) {
        cb(null, `pets/${Date.now().toString()}-${file.originalname}`);
      }
    }),
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) cb(null, true);
      else cb(new Error('Only images are allowed'));
    },
  });

  module.exports = upload;
} else {
  // Ensure uploads directory exists
  const uploadDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const ext = path.extname(file.originalname);
      cb(null, `${Date.now().toString()}-${file.fieldname}${ext}`);
    }
  });

  const upload = multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) cb(null, true);
      else cb(new Error('Only images are allowed'));
    },
  });

  module.exports = upload;
}