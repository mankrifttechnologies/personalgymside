import { useState } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

export const useNativeCamera = () => {
  const [photo, setPhoto] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isNative = Capacitor.isNativePlatform();

  const takePhoto = async () => {
    if (!isNative) {
      setError('Camera is only available on native devices');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera
      });

      const base64Image = `data:image/jpeg;base64,${image.base64String}`;
      setPhoto(base64Image);
      return base64Image;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to capture photo';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const pickFromGallery = async () => {
    if (!isNative) {
      setError('Gallery is only available on native devices');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos
      });

      const base64Image = `data:image/jpeg;base64,${image.base64String}`;
      setPhoto(base64Image);
      return base64Image;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to pick photo';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const clearPhoto = () => {
    setPhoto(null);
    setError(null);
  };

  return {
    photo,
    isLoading,
    error,
    isNative,
    takePhoto,
    pickFromGallery,
    clearPhoto
  };
};
