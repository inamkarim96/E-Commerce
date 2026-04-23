const { v2: cloudinary } = require("cloudinary");
const multer = require("multer");

const {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET
} = require("./env");

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET
});

function uploadProductImage(buffer, filename) {
  const dataUri = `data:image/jpeg;base64,${buffer.toString("base64")}`;
  return cloudinary.uploader
    .upload(dataUri, {
      folder: "naturadry/products",
      resource_type: "image",
      public_id: filename
    })
    .then((result) => result.secure_url);
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

const productImageUpload = upload.single("image");

module.exports = {
  cloudinary,
  uploadProductImage,
  productImageUpload
};
