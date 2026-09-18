import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Download,
  Database,
  Calendar,
  Layers,
  Clock,
  Sparkles,
  Info,
  RefreshCw,
  Table,
  Check,
  AlertTriangle
} from 'lucide-react';
import Papa from 'papaparse';
import { AnalysisResult } from '../types';
import { REQUIRED_COLUMNS } from '../ml/preprocessor';
import { generateDemoDataset } from '../ml/syntheticData';

interface UploadDataViewProps {
  analysis: AnalysisResult;
  onUploadSuccess: (rows: any[], filename: string) => void;
  onLoadDemo: () => void;
  isLoading: boolean;
}

export const UploadDataView: React.FC<UploadDataViewProps> = ({
  analysis,
  onUploadSuccess,
  onLoadDemo,
  isLoading
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadSuccessName, setUploadSuccessName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

        setUploadSuccessName(file.name);
        onUploadSuccess(results.data, file.name);
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
    const demoRows = generateDemoDataset();
    const csvContent = Papa.unparse(demoRows);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'yukthi_2026_chiller_sample_dataset.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Preview first 10 records of active dataset
  const previewRows = analysis.records.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
              <UploadCloud className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900">📁 Upload &amp; Manage Dataset</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Upload CSV telemetry files or switch to the pre-loaded multi-week synthetic dataset calibrated for CH-01, CH-02, and CH-03 under real-world ambient conditions.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            id="btn-download-sample"
            onClick={handleDownloadSample}
            className="px-3 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Sample CSV Template
          </button>

          <button
            id="btn-load-demo"
            onClick={onLoadDemo}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Reload Benchmark Demo
          </button>
        </div>
      </div>

      {/* Upload Zone & Drag Drop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Drag & Drop Card */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
            <UploadCloud className="w-4 h-4 text-blue-600" />
            Upload CSV File
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Drag and drop your chiller operational CSV, or browse from your computer. Headers will be automatically normalized.
          </p>

          <div
            id="drag-drop-zone"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
              isDragging
                ? 'border-blue-500 bg-blue-50/50 scale-[0.99]'
                : 'border-slate-300 hover:border-blue-400 bg-slate-50/50'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFile(e.target.files[0]);
                }
              }}
            />

            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shadow-xs">
                <UploadCloud className="w-7 h-7" />
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Click to browse or drag &amp; drop your CSV file here
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Supports .csv with comma or semicolon delimiter (Up to 50MB)
                </p>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition-colors">
                  Select CSV File
                </span>
              </div>
            </div>
          </div>

          {parsing && (
            <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
              <span>Parsing CSV file and executing preprocessing pipeline...</span>
            </div>
          )}

          {errorMessage && (
            <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {uploadSuccessName && !parsing && (
            <div className="mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Successfully ingested <strong>{uploadSuccessName}</strong>. Models updated!</span>
            </div>
          )}
        </div>

        {/* Expected Schema / Column Checklist */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Table className="w-4 h-4 text-indigo-600" />
              Required Schema (11 Columns)
            </h2>
            <p className="text-xs text-slate-500 mb-3">
              YUKTHI 2026 data specification columns. Tolerant alias matching handles minor variations.
            </p>

            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {REQUIRED_COLUMNS.map((col, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs py-1 px-2 rounded bg-slate-50 border border-slate-100"
                >
                  <span className="font-mono text-slate-700 truncate max-w-[190px]">{col}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-0.5">
                    <Check className="w-3 h-3" /> Valid
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Missing columns will be imputed or derived dynamically.</span>
          </div>
        </div>
      </div>

      {/* Active File Information Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-600" />
          Active File Information &amp; Dataset Summary
        </h2>
        <p className="text-xs text-slate-500 mb-5">
          Metadata regarding the currently active operational telemetry dataset
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-6">
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Dataset Name</span>
            <div className="text-sm font-bold text-slate-900 mt-1 truncate" title={analysis.datasetName}>
              {analysis.datasetName}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {analysis.isDemoData ? 'Calibrated Demo' : 'User Uploaded'}
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Total Rows</span>
            <div className="text-lg font-bold text-blue-600 mt-1 font-mono">
              {analysis.records.length.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Time-series records</div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Equipments</span>
            <div className="text-lg font-bold text-emerald-600 mt-1 font-mono">
              {analysis.dataQuality.equipmentUnits.length} Units
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {analysis.dataQuality.equipmentUnits.join(', ')}
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Time Horizon</span>
            <div className="text-sm font-bold text-slate-900 mt-1">
              {analysis.dataQuality.dateRange.durationDays} Days
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 truncate" title={`${analysis.dataQuality.dateRange.start} to ${analysis.dataQuality.dateRange.end}`}>
              {analysis.dataQuality.dateRange.start.slice(0, 10)} → {analysis.dataQuality.dateRange.end.slice(0, 10)}
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Sampling Rate</span>
            <div className="text-lg font-bold text-indigo-600 mt-1 font-mono">
              ~{analysis.dataQuality.nominalIntervalMinutes} min
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {analysis.dataQuality.samplingConsistency}% consistent
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Data Health</span>
            <div className={`text-lg font-bold mt-1 font-mono ${
              analysis.overallHealthScore >= 80 ? 'text-emerald-600' : 'text-amber-600'
            }`}>
              {analysis.overallHealthScore}/100
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {analysis.totalAnomalies} flagged anomalies
            </div>
          </div>
        </div>

        {/* Data Preview Table */}
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <div className="bg-slate-100 px-4 py-2.5 flex items-center justify-between border-b border-slate-200">
            <span className="text-xs font-bold text-slate-700">
              Raw Sample Data Preview (First 10 records)
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              Showing 10 of {analysis.records.length.toLocaleString()} rows
            </span>
          </div>

          <div className="overflow-x-auto max-h-72">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 sticky top-0 font-mono text-[11px]">
                <tr>
                  <th className="py-2 px-3">Timestamp</th>
                  <th className="py-2 px-3">Equipment</th>
                  <th className="py-2 px-3">Load (RT)</th>
                  <th className="py-2 px-3">Energy (kWh)</th>
                  <th className="py-2 px-3">Cooling Temp (°C)</th>
                  <th className="py-2 px-3">Chilled Flow (L/s)</th>
                  <th className="py-2 px-3">COP</th>
                  <th className="py-2 px-3">kW/RT</th>
                  <th className="py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px] text-slate-700">
                {previewRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80">
                    <td className="py-1.5 px-3 text-slate-500 whitespace-nowrap">{row.timestamp}</td>
                    <td className="py-1.5 px-3 font-semibold text-slate-900">{row.equipment_id}</td>
                    <td className="py-1.5 px-3">{row.buildingLoad.toFixed(1)}</td>
                    <td className="py-1.5 px-3 font-semibold text-blue-600">{row.actualEnergy.toFixed(1)}</td>
                    <td className="py-1.5 px-3">{row.coolingWaterTemp.toFixed(1)}°C</td>
                    <td className="py-1.5 px-3">{row.chilledWaterRate.toFixed(1)}</td>
                    <td className="py-1.5 px-3 text-emerald-600 font-semibold">{row.cop.toFixed(2)}</td>
                    <td className="py-1.5 px-3">{row.kwPerRT.toFixed(3)}</td>
                    <td className="py-1.5 px-3">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-sans font-semibold ${
                        row.severity === 'NORMAL'
                          ? 'bg-emerald-100 text-emerald-800'
                          : row.severity === 'WATCH'
                          ? 'bg-blue-100 text-blue-800'
                          : row.severity === 'WARNING'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {row.severity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
