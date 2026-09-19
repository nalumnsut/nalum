const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Pending alumni-submitted photos live in their own folder, separate from
// uploads/event-images (which only ever holds admin-approved photos). This
// keeps "what's actually published" easy to reason about — nothing here is
// linked from any Event document until an admin approves it.
const uploadDir = path.join(__dirname, "../uploads/event-photo-requests");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    // Use mimetype-derived extension to prevent client spoofed double extensions;
    // fallback to originalname ext only if mimetype unknown, but fileFilter ensures allowedTypes.
    const extFromMime = {
      "image/jpeg": ".jpg",
      "image/jpg": ".jpg",
      "image/png": ".png",
      "image/gif": ".gif",
      "image/webp": ".webp",
    };
    const safeExt = extFromMime[file.mimetype] || path.extname(file.originalname).toLowerCase();
    // Whitelist final extension
    const allowedExts = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    const finalExt = allowedExts.includes(safeExt) ? safeExt : ".jpg";
    cb(null, `photo-request-${uniqueSuffix}${finalExt}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only image files are allowed (jpeg, jpg, png, gif, webp)"));
  }
};

const uploadEventPhotoRequest = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per photo
    files: 5,
  },
  fileFilter: fileFilter,
});

module.exports = uploadEventPhotoRequest;
