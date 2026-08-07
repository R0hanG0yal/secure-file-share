const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Configure Cloudinary if env variables are available
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

async function uploadFile(filePath, originalFilename) {
  // If Cloudinary configured, upload to Cloudinary
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        resource_type: 'auto',
        public_id: `share_${Date.now()}_${path.parse(originalFilename).name}`
      });
      // Clean up local temp file
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return { url: result.secure_url, publicId: result.public_id };
    } catch (err) {
      console.error('[Cloudinary Upload Error]', err);
    }
  }

  // Fallback: serve locally via app_server uploads directory
  const ext = path.extname(originalFilename);
  const targetFilename = `file_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
  const targetPath = path.join(uploadsDir, targetFilename);
  
  fs.copyFileSync(filePath, targetPath);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  return {
    url: `/uploads/${targetFilename}`,
    localPath: targetPath
  };
}

module.exports = { uploadFile };
