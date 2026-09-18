import React, { useState, useRef } from 'react';
import { UploadCloud, X, FileText, CheckCircle2, AlertCircle, Download } from 'lucide-react';
import Papa from 'papaparse';
import { REQUIRED_COLUMNS } from '../ml/preprocessor';
import { generateDemoDataset } from '../ml/syntheticData';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (rows: any[], filename: string) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [summaryInfo, setSummaryInfo] = useState<{ count: number; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setErrorMessage('Please upload a valid .csv file conforming to the YUKTHI 2026 specification.');
      return;
    }

    setParsing(true);
    setErrorMessage(null);

    Papa.parse(file, {
      header: true,
      dynamicTyping: false,
      skipEmptyLines: 'greedy',
      complete: (results) => {
        setParsing(false);
        if (results.errors && results.errors.length > 0 && results.data.length === 0) {
          setErrorMessage(`CSV Parsing Error: ${results.errors[0].message}`);
          return;
        }

        if (!results.data || results.data.length === 0) {
          setErrorMessage('The uploaded CSV file is empty.');
          return;
        }

        setSummaryInfo({
          count: results.data.length,
          name: file.name
        });

        // Pass parsed rows to parent handler
        onUploadSuccess(results.data, file.name);
        onClose();
      },
      error: (err) => {
        setParsing(false);
        setErrorMessage(`Failed to read CSV: ${err.message}`);
      }
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDownloadSample = () => {
    const demo = generateDemoDataset(2); // small 2-day sample
    const csv = Papa.unparse(demo);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'yukthi2026_chiller_sample_spec.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-blue-600" />
              Upload Chiller Operational Data
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Conforming to the YUKTHI 2026 11-field central chiller data specification
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Dropzone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-blue-500 bg-blue-50/50'
                : 'border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-slate-50'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFile(e.target.files[0]);
                }
              }}
              accept=".csv"
              className="hidden"
            />
            <div className="flex flex-col items-center">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-3">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-slate-800">
                Drag and drop your chiller CSV here, or <span className="text-blue-600 underline">browse files</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Supports full-scale dataset (~25,000+ observations, ~3 equipment units, 30-min sampling)
              </p>
            </div>
          </div>

          {parsing && (
            <div className="flex items-center justify-center gap-2 text-xs text-blue-600 font-medium py-2">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              Parsing &amp; validating operational records...
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block">Validation Error:</strong>
                {errorMessage}
              </div>
            </div>
          )}

          {/* Data Specification Reference Box */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-800">Expected 11 Fields (Specification):</span>
              <button
                onClick={handleDownloadSample}
                className="text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium text-[11px] underline"
              >
                <Download className="w-3 h-3" />
                Download Sample CSV
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px] text-slate-600 font-mono">
              {REQUIRED_COLUMNS.map((col, idx) => (
                <div key={idx} className="bg-white px-2 py-1 rounded border border-slate-200 truncate" title={col}>
                  <span className="text-slate-400 mr-1">{idx + 1}.</span>
                  {col}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Real datasets are validated, cleaned, and processed locally in memory.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
