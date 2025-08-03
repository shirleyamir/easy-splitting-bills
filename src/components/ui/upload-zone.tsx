import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileImage, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadZoneProps {
  onFileUpload: (file: File) => void;
  uploadedFile?: File | null;
  className?: string;
}

export const UploadZone = ({ onFileUpload, uploadedFile, className }: UploadZoneProps) => {
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      onFileUpload(file);
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  }, [onFileUpload]);

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
        <p className="text-sm text-muted-foreground mt-2">Receipt uploaded successfully!</p>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-300",
        isDragActive 
          ? "border-primary bg-primary/5" 
          : "border-border hover:border-primary/50 hover:bg-muted/50",
        className
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-4">
        {isDragActive ? (
          <Upload className="h-12 w-12 text-primary animate-pulse" />
        ) : (
          <FileImage className="h-12 w-12 text-muted-foreground" />
        )}
        <div>
          <p className="text-lg font-medium">
            {isDragActive ? "Drop your receipt here" : "Upload receipt image"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Drag & drop or click to select • JPG, PNG, WebP
          </p>
        </div>
      </div>
    </div>
  );
};