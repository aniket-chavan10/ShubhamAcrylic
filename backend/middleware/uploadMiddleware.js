const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ── S3 setup (only when AWS env vars are configured) ─────────────────────────
let s3Upload = null;

if (process.env.AWS_S3_BUCKET && process.env.AWS_ACCESS_KEY_ID) {
  try {
    const { S3Client } = require('@aws-sdk/client-s3');
    const multerS3 = require('multer-s3');

    const s3 = new S3Client({
      region: process.env.AWS_REGION || 'ap-south-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    s3Upload = multer({
      storage: multerS3({
        s3,
        bucket: process.env.AWS_S3_BUCKET,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: (req, file, cb) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          const ext = path.extname(file.originalname).toLowerCase();
          cb(null, `uploads/products/product-${uniqueSuffix}${ext}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
      fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|webp|svg/;
        const ext = allowed.test(path.extname(file.originalname).toLowerCase());
        const mime = allowed.test(file.mimetype) || file.mimetype === 'image/svg+xml';
        if (ext || mime) cb(null, true);
        else cb(new Error('Only image files (jpg, jpeg, png, webp, svg) are allowed!'), false);
      },
    });

    console.log('✅ S3 upload middleware configured (bucket:', process.env.AWS_S3_BUCKET + ')');
  } catch (err) {
    console.warn('⚠️  S3 setup failed, falling back to local disk:', err.message);
  }
}

// ── Local disk fallback ──────────────────────────────────────────────────────
const uploadDir = path.join(__dirname, '../uploads/products');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const localStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `product-${uniqueSuffix}${ext}`);
  },
});

const localUpload = multer({
  storage: localStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|svg/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype) || file.mimetype === 'image/svg+xml';
    if (ext || mime) cb(null, true);
    else cb(new Error('Only image files (jpg, jpeg, png, webp, svg) are allowed!'), false);
  },
});

// Export: use S3 if configured, else local disk
const upload = s3Upload || localUpload;

module.exports = upload;
