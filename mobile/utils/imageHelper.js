import { UPLOAD_URL } from './config';

export const getImageUrl = (imagePath) => {
  if (!imagePath || imagePath === 'no-photo.jpg') {
    return 'https://via.placeholder.com/150';
  }

  // If it's already a full URL but contains localhost, replace it
  if (imagePath.startsWith('http')) {
    if (imagePath.includes('localhost')) {
      return imagePath.replace('localhost', UPLOAD_URL.split('//')[1].split(':')[0]);
    }
    return imagePath;
  }

  // Handle local file URIs (picked from library)
  if (imagePath.startsWith('file://') || imagePath.startsWith('content://') || imagePath.startsWith('data:')) {
    return imagePath;
  }

  // If it's just a filename or relative path
  if (!imagePath || imagePath.trim() === '') {
    return 'https://via.placeholder.com/150';
  }

  const cleanPath = imagePath.toString().replace(/^uploads[/\\]/, '');

  return `${UPLOAD_URL}/${cleanPath}`;
};
