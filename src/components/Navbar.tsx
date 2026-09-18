import React from 'react';
import {
  Activity,
  Cpu,
  UploadCloud,
  RefreshCw,
  FileText,
  AlertTriangle,
  Layers,
  Database,
  Search,
  Sparkles,
  BarChart3,
  CheckCircle2,
  TrendingUp,
  Sliders,
  Leaf,
  Bell
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isDemoData: boolean;
  datasetName: string;
  totalRecords: number;
  overallHealth: number;
  alertCount?: number;
  onOpenUpload: () => void;
  onLoadDemo: () => void;
  onExportReport: () => void;
  isLoading: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  isDemoData,
  datasetName,
  totalRecords,
  overallHealth,
  alertCount = 0,
  onOpenUpload,
  onLoadDemo,
  onExportReport,
  isLoading
}) => {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Layers },
    { id: 'realtime', label: 'Real-Time & Alerts', icon: Bell, badge: alertCount > 0 ? alertCount : undefined },
    { id: 'forecast', label: 'Energy Prediction', icon: TrendingUp },
    { id: 'efficiency', label: 'Efficiency & COP', icon: Activity },
    { id: 'simulation', label: 'What-If Simulation', icon: Sliders },
    { id: 'recommendations', label: 'Energy Savings', icon: Leaf },
    { id: 'monitoring', label: 'Equipment Telemetry', icon: BarChart3 },
    { id: 'investigation', label: 'Anomaly Investigation', icon: Search },
    { id: 'quality', label: 'Data Quality', icon: Database }
  ];

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
      {/* Top Brand Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <div className="h-10 w-10 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-wider text-slate-100">CHILLER AI</span>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700/50 font-mono">
                  YUKTHI 2026
                </span>
                {isDemoData ? (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold tracking-wide animate-pulse">
                    DEMO DATA
                  </span>
                ) : (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold tracking-wide flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> REAL DATA
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Intelligent Energy &amp; Equipment Monitoring <span className="text-slate-500">•</span> Detect. Understand. Assess. Act.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-3">
            <button
              id="btn-nav-upload"
              onClick={onOpenUpload}
              className="px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              Upload CSV
            </button>

            <button
              id="btn-nav-demo"
              onClick={onLoadDemo}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              title="Reload synthetic 3-chiller demo dataset"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Demo Data
            </button>

            <button
              id="btn-nav-export"
              onClick={onExportReport}
              className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Export complete ML diagnostic analysis"
            >
              <FileText className="w-3.5 h-3.5" />
              Export Report
            </button>
          </div>
        </div>
      </div>

      {/* ML Pipeline Visual Flow Ribbon */}
      <div className="bg-slate-950/80 border-t border-b border-slate-800/80 px-4 py-1.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-[11px] text-slate-400 overflow-x-auto">
          <div className="flex items-center space-x-2 font-mono shrink-0">
            <span className="text-slate-500 font-sans font-medium uppercase tracking-wider text-[10px]">Active ML Workflow:</span>
            <span className="text-blue-400 font-semibold">DATA</span>
            <span className="text-slate-600">→</span>
            <span className="text-blue-400 font-semibold">PREPROCESSING</span>
            <span className="text-slate-600">→</span>
            <span className="text-indigo-400 font-semibold">REGRESSION + iFOREST</span>
            <span className="text-slate-600">→</span>
            <span className="text-amber-400 font-semibold">ANOMALY ASSESSMENT</span>
            <span className="text-slate-600">→</span>
            <span className="text-emerald-400 font-semibold">HEALTH SCORING</span>
            <span className="text-slate-600">→</span>
            <span className="text-purple-400 font-semibold">EVIDENCE &amp; ACTION</span>
          </div>

          <div className="flex items-center space-x-4 shrink-0 pl-4">
            <span className="text-slate-400">
              Active: <strong className="text-slate-200">{datasetName}</strong> ({totalRecords.toLocaleString()} rows)
            </span>
            <span className="text-slate-400">
              Plant Health: <strong className={overallHealth >= 80 ? 'text-emerald-400' : overallHealth >= 65 ? 'text-amber-400' : 'text-rose-400'}>{overallHealth}/100</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 py-1 overflow-x-auto" aria-label="Tabs">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => setCurrentTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-md whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-rose-500 text-white' : 'bg-rose-600/90 text-white'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
