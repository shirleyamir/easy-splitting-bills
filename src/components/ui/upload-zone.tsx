import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileImage, X, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Button } from '@/components/ui/button';

interface UploadZoneProps {
  onFileUpload: (file: File) => void;
  uploadedFile?: File | null;
  isProcessing?: boolean;
  className?: string;
}

export const UploadZone = ({ onFileUpload, uploadedFile, isProcessing, className }: UploadZoneProps) => {
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileUpload = useCallback((file: File) => {
    onFileUpload(file);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  }, [onFileUpload]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  const takePhoto = async () => {
    try {
      const image = await CapacitorCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera
      });

      if (image.dataUrl) {
        // Convert data URL to File object
        const response = await fetch(image.dataUrl);
        const blob = await response.blob();
        const file = new File([blob], 'receipt.jpg', { type: 'image/jpeg' });
        
        handleFileUpload(file);
      }
    } catch (error) {
      console.error('Camera error:', error);
      // Fallback to file input if camera is not available
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1
  });

  const clearFile = () => {
    setPreview(null);
    onFileUpload(null as any);
  };

  if (preview) {
    return (
      <div className={cn("relative", className)}>
        <div className="relative bg-card rounded-lg shadow-receipt overflow-hidden">
          <img 
            src={preview} 
            alt="Receipt preview" 
            className="w-full h-64 object-cover"
          />
          <button
            onClick={clearFile}
            className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {isProcessing ? (
          <p className="text-sm text-primary mt-2 flex items-center gap-2">
            <Upload className="h-4 w-4 animate-spin" />
            Processing receipt with AI...
          </p>
        ) : (
          <p className="text-sm text-muted-foreground mt-2">Receipt uploaded successfully!</p>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload by clicking/dropping */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-300",
          isDragActive 
            ? "border-primary bg-primary/5" 
            : "border-border hover:border-primary/50 hover:bg-muted/50"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          {isDragActive ? (
            <Upload className="h-10 w-10 text-primary animate-pulse" />
          ) : (
            <FileImage className="h-10 w-10 text-muted-foreground" />
          )}
          <div>
            <p className="font-medium">
              {isDragActive ? "Drop your receipt here" : "Upload receipt image"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Drag & drop or click to select • JPG, PNG, WebP
            </p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or</span>
        </div>
      </div>

      {/* Camera button */}
      <Button
        onClick={takePhoto}
        variant="outline"
        className="w-full h-16 text-base"
        type="button"
      >
        <Camera className="h-5 w-5 mr-2" />
        Take Photo with Camera
      </Button>
    </div>
  );
};