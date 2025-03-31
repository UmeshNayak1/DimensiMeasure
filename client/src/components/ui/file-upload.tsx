import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Upload } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number; // in MB
  isUploading?: boolean;
}

export function FileUpload({ 
  onFileSelect, 
  accept = "image/*", 
  maxSize = 10, 
  isUploading = false 
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateFile = (file: File): boolean => {
    // Check file type
    if (accept !== "*" && !file.type.match(accept.replace(/\*/g, '.*'))) {
      setError(`Invalid file type. Supported formats: ${accept.replace('image/', '')}`);
      return false;
    }
    
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File is too large. Maximum size is ${maxSize}MB.`);
      return false;
    }
    
    setError(null);
    return true;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        onFileSelect(file);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        onFileSelect(file);
      }
    }
  };

  const onButtonClick = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  return (
    <div className="w-full">
      <div 
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all
          ${dragActive ? 'border-primary bg-blue-50' : 'border-gray-300 hover:bg-gray-50'}
          ${error ? 'border-red-400' : ''}`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          Drag and drop an image here, or{' '}
          <span className="text-primary font-medium cursor-pointer" onClick={onButtonClick}>
            browse
          </span>
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Supports JPG, PNG, WEBP - Max {maxSize}MB
        </p>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          onChange={handleChange}
          disabled={isUploading}
        />
        
        <Button 
          className="mt-4" 
          onClick={onButtonClick} 
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>Select Image</>
          )}
        </Button>
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
