import React, { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  isProcessing: boolean;
}

const DropZone: React.FC<DropZoneProps> = ({ onFilesSelected, isProcessing }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (isProcessing) return;

      const files = (Array.from(e.dataTransfer.files) as File[]).filter(
        (f) => f.name.endsWith('.xlsx') || f.name.endsWith('.xls') || f.name.endsWith('.csv')
      );
      
      if (files.length > 0) {
        onFilesSelected(files);
      }
    },
    [onFilesSelected, isProcessing]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        onFilesSelected(Array.from(e.target.files));
      }
    },
    [onFilesSelected]
  );

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={clsx(
        'relative w-full p-12 transition-all duration-200 ease-in-out border-4 border-dashed rounded-xl group cursor-pointer overflow-hidden',
        isDragging
          ? 'border-royal-blue bg-royal-light'
          : 'border-gray-300 bg-gray-50 hover:border-royal-blue hover:bg-white',
        isProcessing ? 'opacity-70 pointer-events-none' : ''
      )}
    >
      <input
        type="file"
        multiple
        accept=".xlsx,.xls,.csv"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        onChange={handleFileInput}
        disabled={isProcessing}
      />
      
      <div className="flex flex-col items-center justify-center space-y-4 text-center">
        <div className={clsx(
          "p-6 rounded-full transition-colors border-2",
          isDragging ? "bg-royal-blue text-white border-royal-blue" : "bg-white text-royal-blue border-royal-blue group-hover:bg-royal-blue group-hover:text-white"
        )}>
            {isProcessing ? (
                <Loader2 className="w-12 h-12 animate-spin" />
            ) : (
                <Upload className="w-12 h-12" />
            )}
        </div>
        
        <div>
          <h3 className="text-2xl font-bold text-royal-text mb-2">
            {isProcessing ? 'Importing Data...' : 'Drop Excel Files Here'}
          </h3>
          <p className="text-base text-gray-600 max-w-sm mx-auto font-medium">
            Upload your project history (WEB, UNS, Analytics, etc.). 
            <br/>Supported format: <span className="font-bold text-royal-blue bg-blue-100 px-1.5 py-0.5 rounded border border-blue-200">.xlsx</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default DropZone;