// src/lib/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';


cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});


export const uploadImage = async (base64Image: string, folder: string = 'deeshora'): Promise<string> => {
  try {
    const result = await cloudinary.uploader.upload(base64Image, {
      folder: folder,
      resource_type: 'image',
    });
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload image to Cloudinary');
  }
};


export const deleteImage = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error('Failed to delete image from Cloudinary');
  }
};


export const getOptimizedUrl = (url: string, options: object = {}): string => {
  return cloudinary.url(url, {
    ...options,
    secure: true,
  });
};


export default cloudinary;