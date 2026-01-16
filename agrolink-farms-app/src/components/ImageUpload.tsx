'use client';

import { useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

interface ImageUploadProps {
  onUpload: (url: string) => void;
  maxFiles?: number;
  folder?: string;
}

export default function ImageUpload({
  onUpload,
  maxFiles = 1,
  folder = 'listings',
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [error, setError] = useState('');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;

    if (!files || files.length === 0) return;

    if (uploadedImages.length >= maxFiles) {
      setError(`Maximum ${maxFiles} file(s) allowed`);
      return;
    }

    setUploading(true);
    setError('');

    try {
      const file = files[0];

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB');
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload an image file');
      }

      // Generate unique filename
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8);
      const filename = `${timestamp}-${random}-${file.name}`;

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('animals')
        .upload(`${folder}/${filename}`, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('animals').getPublicUrl(`${folder}/${filename}`);

      setUploadedImages((prev) => [...prev, publicUrl]);
      onUpload(publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (url: string) => {
    setUploadedImages((prev) => prev.filter((img) => img !== url));
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div>
        <label className="block text-sm font-bold text-gray-900 mb-2">
          Upload Images
        </label>

        <label className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-700 hover:bg-green-50 transition-colors cursor-pointer block">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploading || uploadedImages.length >= maxFiles}
            className="hidden"
          />
          <div>
            <p className="text-gray-600 font-medium">📸 Click to upload or drag and drop</p>
            <p className="text-xs text-gray-500 mt-1">PNG, JPG, WebP up to 5MB</p>
            {uploadedImages.length < maxFiles && (
              <p className="text-xs text-gray-400 mt-1">
                {uploadedImages.length}/{maxFiles} uploaded
              </p>
            )}
          </div>

          {uploading && (
            <div className="mt-2">
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-green-700"></div>
              <p className="text-sm text-gray-600 mt-2">Uploading...</p>
            </div>
          )}
        </label>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <p className="text-red-900 text-sm">{error}</p>
        </div>
      )}

      {/* Uploaded Images */}
      {uploadedImages.length > 0 && (
        <div>
          <p className="text-sm font-bold text-gray-900 mb-2">Uploaded Images</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {uploadedImages.map((url, i) => (
              <div
                key={i}
                className="relative rounded-lg overflow-hidden bg-gray-200 aspect-square"
              >
                <img
                  src={url}
                  alt={`Uploaded ${i + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => handleRemoveImage(url)}
                  className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full transition-colors"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Success Message */}
      {uploadedImages.length === maxFiles && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
          <p className="text-green-900 text-sm">✓ All images uploaded successfully</p>
        </div>
      )}
    </div>
  );
}
