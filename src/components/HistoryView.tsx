import React, { useState } from 'react';
import {
  Clock,
  Database,
  TrendingUp,
  FileText,
  Trash2,
  Download,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  Info,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { HistoryDatasetItem, HistoryPredictionItem, HistoryReportItem } from '../types';

interface HistoryViewProps {
  datasetHistory: HistoryDatasetItem[];
  predictionHistory: HistoryPredictionItem[];
  reportHistory: HistoryReportItem[];
  onClearHistory: () => void;
  onSelectDataset?: (dataset: HistoryDatasetItem) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  datasetHistory,
  predictionHistory,
  reportHistory,
  onClearHistory,
  onSelectDataset
}) => {
  const [activeTab, setActiveTab] = useState<'DATASETS' | 'PREDICTIONS' | 'REPORTS'>('DATASETS');

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Clock className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900">🕘 Session &amp; Historical Audit Trail</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Audit log of previously uploaded datasets, previous AI energy forecast snapshots, and generated engineering reports.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onClearHistory}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
            title="Clear saved local history entries"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Log
          </button>
        </div>
      </div>

      {/* History Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('DATASETS')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'DATASETS'
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          Previously Uploaded Datasets ({datasetHistory.length})
        </button>

        <button
          onClick={() => setActiveTab('PREDICTIONS')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'PREDICTIONS'
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          Previous Predictions ({predictionHistory.length})
        </button>

        <button
          onClick={() => setActiveTab('REPORTS')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'REPORTS'
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Previous Reports ({reportHistory.length})
        </button>
      </div>

      {/* Previously Uploaded Datasets */}
      {activeTab === 'DATASETS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Dataset Ingestion History
            </h2>
            <span className="text-xs text-slate-500">
              {datasetHistory.length} total recorded uploads
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/50 text-slate-600 border-b border-slate-200 font-mono text-[11px]">
                <tr>
                  <th className="py-2.5 px-4">Dataset Name</th>
                  <th className="py-2.5 px-4">Uploaded At</th>
                  <th className="py-2.5 px-4">Rows</th>
                  <th className="py-2.5 px-4">Equipments</th>
                  <th className="py-2.5 px-4">Health Score</th>
                  <th className="py-2.5 px-4">Flagged Anomalies</th>
                  <th className="py-2.5 px-4">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px] text-slate-700">
                {datasetHistory.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 font-sans">
                      No datasets in history yet. Upload a CSV file or load the benchmark demo dataset to log entries.
                    </td>
                  </tr>
                ) : (
                  datasetHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2 font-sans">
                        <Database className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{item.name}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{item.uploadedAt}</td>
                      <td className="py-3 px-4 font-bold text-blue-600">{item.rowCount.toLocaleString()}</td>
                      <td className="py-3 px-4">{item.equipmentCount} Units</td>
                      <td className="py-3 px-4">
                        <span className={`font-bold ${
                          item.healthScore >= 80 ? 'text-emerald-600' : 'text-amber-600'
                        }`}>
                          {item.healthScore}/100
                        </span>
                      </td>
                      <td className="py-3 px-4 text-rose-600 font-bold">{item.anomalyCount}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-sans font-semibold ${
                          item.isDemo ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {item.isDemo ? 'Benchmark Demo' : 'User Upload'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Previous Predictions */}
      {activeTab === 'PREDICTIONS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Machine Learning Energy Forecast Snapshots
            </h2>
            <span className="text-xs text-slate-500">
              {predictionHistory.length} recorded forecasts
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/50 text-slate-600 border-b border-slate-200 font-mono text-[11px]">
                <tr>
                  <th className="py-2.5 px-4">Generated Timestamp</th>
                  <th className="py-2.5 px-4">Dataset</th>
                  <th className="py-2.5 px-4">Horizon</th>
                  <th className="py-2.5 px-4">Expected 1h Energy</th>
                  <th className="py-2.5 px-4">Confidence Interval</th>
                  <th className="py-2.5 px-4">Expected Load (RT)</th>
                  <th className="py-2.5 px-4">Predicted COP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px] text-slate-700">
                {predictionHistory.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 font-sans">
                      No prediction logs recorded yet. Energy forecasts automatically snapshot here.
                    </td>
                  </tr>
                ) : (
                  predictionHistory.map((pred) => (
                    <tr key={pred.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{pred.generatedAt}</td>
                      <td className="py-3 px-4 font-bold text-slate-900 font-sans">{pred.datasetName}</td>
                      <td className="py-3 px-4">+{pred.horizonHours} Hours</td>
                      <td className="py-3 px-4 font-bold text-emerald-600 text-sm">
                        {pred.next1hPredictedEnergy} kWh
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {pred.confidenceLower} – {pred.confidenceUpper} kWh
                      </td>
                      <td className="py-3 px-4">{pred.expectedPlantLoad} RT</td>
                      <td className="py-3 px-4 font-bold text-blue-600">{pred.predictedCop.toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Previous Reports */}
      {activeTab === 'REPORTS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Generated Engineering Reports Archive
            </h2>
            <span className="text-xs text-slate-500">
              {reportHistory.length} exported documents
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/50 text-slate-600 border-b border-slate-200 font-mono text-[11px]">
                <tr>
                  <th className="py-2.5 px-4">Report Title</th>
                  <th className="py-2.5 px-4">Generated Timestamp</th>
                  <th className="py-2.5 px-4">Dataset</th>
                  <th className="py-2.5 px-4">Plant Health</th>
                  <th className="py-2.5 px-4">Total Savings Identified</th>
                  <th className="py-2.5 px-4">Format</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px] text-slate-700">
                {reportHistory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 font-sans">
                      No reports generated yet. Visit the Reports tab to generate and download reports.
                    </td>
                  </tr>
                ) : (
                  reportHistory.map((rep) => (
                    <tr key={rep.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2 font-sans">
                        <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>{rep.title}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{rep.generatedAt}</td>
                      <td className="py-3 px-4 font-sans text-slate-700">{rep.datasetName}</td>
                      <td className="py-3 px-4">
                        <span className={`font-bold ${
                          rep.healthScore >= 80 ? 'text-emerald-600' : 'text-amber-600'
                        }`}>
                          {rep.healthScore}/100
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-600">
                        ₹{rep.totalSavingsRupees.toLocaleString()} / day
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-sans font-bold bg-slate-100 text-slate-800">
                          {rep.format}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
