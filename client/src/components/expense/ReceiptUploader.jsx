import { useState, useRef } from 'react';
import { Upload, Camera, Loader2, FileImage, X } from 'lucide-react';
import { extractTextFromImage, parseReceiptText } from '../../utils/ocr';
import Button from '../common/Button';

export default function ReceiptUploader({ onExtract, disabled = false }) {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    setError(null);
    setPreview(URL.createObjectURL(file));
    setProcessing(true);
    setProgress(0);

    try {
      const text = await extractTextFromImage(file, setProgress);
      const fields = parseReceiptText(text);
      onExtract?.(fields, file);
    } catch (err) {
      setError('Failed to process receipt. Please try again or enter details manually.');
      console.error('OCR Error:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const clearPreview = () => {
    setPreview(null);
    setError(null);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        id="receipt-upload"
        disabled={disabled || processing}
      />

      {!preview ? (
        <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors">
          <FileImage className="w-10 h-10 text-text-muted mx-auto mb-3" />
          <p className="text-sm text-text-secondary mb-3">Upload a receipt to auto-fill expense fields via OCR</p>
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              icon={Upload}
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || processing}
            >
              Upload Image
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={Camera}
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.setAttribute('capture', 'environment');
                  fileInputRef.current.click();
                  fileInputRef.current.removeAttribute('capture');
                }
              }}
              disabled={disabled || processing}
            >
              Take Photo
            </Button>
          </div>
        </div>
      ) : (
        <div className="relative glass rounded-xl p-4">
          <button
            onClick={clearPreview}
            className="absolute top-2 right-2 p-1 rounded-lg bg-surface-700 hover:bg-surface-600 text-text-muted hover:text-text-primary transition-colors z-10"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-start gap-4">
            <img src={preview} alt="Receipt" className="w-24 h-24 rounded-lg object-cover flex-shrink-0" />
            <div className="flex-1 min-w-0">
              {processing ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    Processing receipt...
                  </div>
                  <div className="w-full bg-surface-700 rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="text-xs text-text-muted">{progress}% complete</p>
                </div>
              ) : error ? (
                <p className="text-sm text-danger">{error}</p>
              ) : (
                <div className="flex items-center gap-2 text-sm text-success">
                  <span className="w-2 h-2 rounded-full bg-success" />
                  Receipt processed successfully
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
