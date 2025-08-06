import { useState, useRef } from 'react';
import { Camera, Upload, X } from 'lucide-react';
import { Button } from './button';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';

interface ProfilePictureUploadProps {
  currentImage?: string | null;
  onImageChange: (base64: string | null) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ProfilePictureUpload({ 
  currentImage, 
  onImageChange, 
  className = '',
  size = 'md'
}: ProfilePictureUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Image size must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setPreview(base64);
      onImageChange(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    setPreview(null);
    onImageChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <div className={`relative ${sizeClasses[size]} rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-700`}>
        {preview ? (
          <Avatar className="w-full h-full">
            <AvatarImage src={preview} className="object-cover" />
            <AvatarFallback>
              <Camera className="w-6 h-6 text-gray-400" />
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <Camera className="w-6 h-6 text-gray-400" />
          </div>
        )}
        
        {/* Upload overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center opacity-0 hover:opacity-100 cursor-pointer"
             onClick={triggerFileSelect}>
          <Upload className="w-4 h-4 text-white" />
        </div>
      </div>

      {/* Remove button */}
      {preview && (
        <Button
          size="sm"
          variant="destructive"
          className="absolute -top-1 -right-1 w-6 h-6 rounded-full p-0"
          onClick={handleRemove}
        >
          <X className="w-3 h-3" />
        </Button>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload button for no image state */}
      {!preview && (
        <Button
          size="sm"
          variant="outline"
          className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-xs"
          onClick={triggerFileSelect}
        >
          <Upload className="w-3 h-3 mr-1" />
          Upload
        </Button>
      )}
    </div>
  );
}