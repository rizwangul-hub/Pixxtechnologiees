const cloudinary = require('../config/cloudinary');

/**
 * Upload buffer to Cloudinary
 * @param {Buffer} fileBuffer - Image or document buffer
 * @param {string} folder - Destination folder in Cloudinary
 * @returns {Promise<{url: string, public_id: string}>}
 */
const uploadToCloudinary = (fileBuffer, folder = 'pixx_technologies') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve({
          url: result.secure_url,
          public_id: result.public_id,
        });
      }
    );
    uploadStream.end(fileBuffer);
  });
};

/**
 * Delete image from Cloudinary by public_id
 */
const deleteFromCloudinary = async (publicId) => {
  try {
    return await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('[Cloudinary Delete Error]', error.message);
    throw error;
  }
};

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
};
