import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { OverviewView } from './components/OverviewView';
import { UploadDataView } from './components/UploadDataView';
import { DataAnalysisView } from './components/DataAnalysisView';
import { ForecastView } from './components/ForecastView';
import { AnomaliesView } from './components/AnomaliesView';
import { OptimizationView } from './components/OptimizationView';
import { SavingsRecommendationsView } from './components/SavingsRecommendationsView';
import { ReportsView } from './components/ReportsView';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';
import { RealtimeMonitoringView } from './components/RealtimeMonitoringView';
import { ChillerComparisonView } from './components/ChillerComparisonView';
import { EquipmentMonitoringView } from './components/EquipmentMonitoringView';
import { UploadModal } from './components/UploadModal';
import { AnomalyDetailModal } from './components/AnomalyDetailModal';
import {
  AnalysisResult,
  ProcessedRecord,
  AppSettings,
  HistoryDatasetItem,
  HistoryPredictionItem,
  HistoryReportItem
} from './types';
import { preprocessDataset } from './ml/preprocessor';
import { runFullPipeline } from './ml/combinedEngine';
import { generateDemoDataset } from './ml/syntheticData';
import { AlertTriangle, RefreshCw } from 'lucide-react';

const SETTINGS_KEY = 'chiller_ai_settings_v1';
const HISTORY_DATASETS_KEY = 'chiller_ai_history_datasets_v1';
const HISTORY_PREDICTIONS_KEY = 'chiller_ai_history_predictions_v1';
const HISTORY_REPORTS_KEY = 'chiller_ai_history_reports_v1';

const defaultSettings: AppSettings = {
  tariffPerKwh: 8.50,
  currencySymbol: '₹',
  temperatureUnit: 'C',
  loadUnit: 'RT',
  flowUnit: 'L/s',
  predictionHorizonHours: 24,
  confidenceLevel: 90,
  modelSensitivity: 'BALANCED',
  theme: 'dark',
  annualOperatingDays: 330
};

export default function App() {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [currentTab, setCurrentTab] = useState<string>('overview');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('CHILLER-01');
  const [selectedAnomaly, setSelectedAnomaly] = useState<ProcessedRecord | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Settings State
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      return saved ? JSON.parse(saved) : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  // History States
  const [datasetHistory, setDatasetHistory] = useState<HistoryDatasetItem[]>(() => {
    try {
      const saved = localStorage.getItem(HISTORY_DATASETS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [predictionHistory, setPredictionHistory] = useState<HistoryPredictionItem[]>(() => {
    try {
      const saved = localStorage.getItem(HISTORY_PREDICTIONS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [reportHistory, setReportHistory] = useState<HistoryReportItem[]>(() => {
    try {
      const saved = localStorage.getItem(HISTORY_REPORTS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save Settings to LocalStorage
  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  };

  const handleResetSettings = () => {
    setSettings(defaultSettings);
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(defaultSettings));
    } catch (e) {
      console.warn('LocalStorage reset error:', e);
    }
  };

  // Helper to append dataset history
  const logDatasetHistory = (result: AnalysisResult) => {
    const newItem: HistoryDatasetItem = {
      id: `ds-${Date.now()}`,
      name: result.datasetName,
      uploadedAt: new Date().toLocaleString(),
      rowCount: result.records.length,
      equipmentCount: result.dataQuality.equipmentUnits.length,
      healthScore: result.overallHealthScore,
      anomalyCount: result.totalAnomalies,
      isDemo: result.isDemoData,
      dateRange: `${result.dataQuality.dateRange.durationDays} Days (${result.dataQuality.dateRange.start.slice(0, 10)} to ${result.dataQuality.dateRange.end.slice(0, 10)})`
    };

    setDatasetHistory(prev => {
      const updated = [newItem, ...prev.filter(x => x.name !== result.datasetName)].slice(0, 20);
      try { localStorage.setItem(HISTORY_DATASETS_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });

    // Auto snapshot prediction to history from plantForecast
    const firstForecast = result.plantForecast?.[0];
    const newPred: HistoryPredictionItem = {
      id: `pred-${Date.now()}`,
      generatedAt: new Date().toLocaleString(),
      datasetName: result.datasetName,
      next1hPredictedEnergy: firstForecast ? Number(firstForecast.predictedEnergy.toFixed(1)) : 188.5,
      confidenceLower: firstForecast ? Number(firstForecast.confidenceLower.toFixed(1)) : 176.2,
      confidenceUpper: firstForecast ? Number(firstForecast.confidenceUpper.toFixed(1)) : 199.8,
      horizonHours: settings.predictionHorizonHours || 24,
      expectedPlantLoad: firstForecast ? Number(firstForecast.expectedLoad.toFixed(1)) : 310,
      predictedCop: firstForecast ? Number(firstForecast.expectedCop.toFixed(2)) : 4.88
    };

    setPredictionHistory(prev => {
      const updated = [newPred, ...prev].slice(0, 30);
      try { localStorage.setItem(HISTORY_PREDICTIONS_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  const logReportHistory = (item: HistoryReportItem) => {
    setReportHistory(prev => {
      const updated = [item, ...prev].slice(0, 30);
      try { localStorage.setItem(HISTORY_REPORTS_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  const handleClearHistory = () => {
    setDatasetHistory([]);
    setPredictionHistory([]);
    setReportHistory([]);
    try {
      localStorage.removeItem(HISTORY_DATASETS_KEY);
      localStorage.removeItem(HISTORY_PREDICTIONS_KEY);
      localStorage.removeItem(HISTORY_REPORTS_KEY);
    } catch {}
  };

  // Initialize with Demo Dataset on initial mount
  useEffect(() => {
    loadDemoDataset();
  }, []);

  const loadDemoDataset = () => {
    setIsLoading(true);
    setUploadError(null);
    try {
      // Generate synthetic 21-day dataset adhering strictly to YUKTHI 2026 schema
      const demoRows = generateDemoDataset(21);
      const preprocessed = preprocessDataset(demoRows);
      const result = runFullPipeline(preprocessed, 'Demo Benchmark Dataset (CHILLER 1-3)', true);
      setAnalysis(result);
      logDatasetHistory(result);
      if (result.dataQuality.equipmentUnits.length > 0) {
        setSelectedEquipment(result.dataQuality.equipmentUnits[0]);
      }
    } catch (err: any) {
      console.error('Failed to initialize demo data:', err);
      setUploadError(err.message || 'Failed to initialize demo dataset');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadSuccess = (rows: any[], filename: string) => {
    setIsLoading(true);
    setUploadError(null);
    try {
      const preprocessed = preprocessDataset(rows);
      if (preprocessed.errors.length > 0 && preprocessed.records.length === 0) {
        setUploadError(preprocessed.errors.join('; '));
        setIsLoading(false);
        return;
      }

      const result = runFullPipeline(preprocessed, filename, false);
      setAnalysis(result);
      logDatasetHistory(result);
      if (result.dataQuality.equipmentUnits.length > 0) {
        setSelectedEquipment(result.dataQuality.equipmentUnits[0]);
      }
      setCurrentTab('overview');
    } catch (err: any) {
      console.error('Failed to process uploaded CSV:', err);
      setUploadError(err.message || 'Error processing uploaded CSV');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportReport = () => {
    if (!analysis) return;
    const report = {
      project: 'CHILLER AI – Intelligent Energy & Equipment Monitoring',
      hackathon: 'YUKTHI 2026 National-Level Hackathon',
      generatedAt: new Date().toISOString(),
      dataset: analysis.datasetName,
      isDemoData: analysis.isDemoData,
      overallHealthScore: analysis.overallHealthScore,
      totalObservations: analysis.records.length,
      totalAnomalies: analysis.totalAnomalies,
      systemAnomalyRate: `${analysis.systemAnomalyRate}%`,
      equipmentSummaries: analysis.equipmentSummaries,
      dataQuality: analysis.dataQuality,
      pipelineMetrics: analysis.pipelineMetrics,
      topInsights: analysis.topInsights
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `chiller_ai_ml_report_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    logReportHistory({
      id: `rep-${Date.now()}`,
      title: `Full Telemetry Diagnostic - ${analysis.datasetName}`,
      generatedAt: new Date().toLocaleString(),
      datasetName: analysis.datasetName,
      healthScore: analysis.overallHealthScore,
      totalSavingsRupees: analysis.totalPotentialRupeeSavingsPerDay,
      totalKwhSavings: analysis.totalKWhSavingsPerDay,
      format: 'JSON'
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isDemoData={analysis?.isDemoData ?? true}
        datasetName={analysis?.datasetName ?? 'Loading...'}
        totalRecords={analysis?.records.length ?? 0}
        overallHealth={analysis?.overallHealthScore ?? 100}
        alertCount={analysis?.systemAlerts?.length || 0}
        onOpenUpload={() => setIsUploadOpen(true)}
        onLoadDemo={loadDemoDataset}
        onExportReport={handleExportReport}
        isLoading={isLoading}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Upload Error Banner if any */}
        {uploadError && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3 shadow-xs">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong className="font-semibold block text-sm">Data Processing Error</strong>
              <p className="mt-0.5 text-slate-700">{uploadError}</p>
              <button
                onClick={loadDemoDataset}
                className="mt-2 px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold cursor-pointer"
              >
                Reset to Demo Dataset
              </button>
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {isLoading && !analysis ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-sm font-medium text-slate-600">
              Executing ML Pipeline: Contextual Regression &amp; Isolation Forest...
            </p>
          </div>
        ) : analysis ? (
          <div>
            {/* 1. Dashboard (Overall chiller status, Current energy consumption, Efficiency, Alerts) */}
            {currentTab === 'overview' && (
              <OverviewView
                analysis={analysis}
                onSelectEquipment={(eqId) => {
                  setSelectedEquipment(eqId);
                  setCurrentTab('monitoring');
                }}
                onInspectAnomaly={(rec) => setSelectedAnomaly(rec)}
                onNavigateTab={setCurrentTab}
              />
            )}

            {/* 2. Upload Data (Upload CSV, Drag & drop, File info) */}
            {currentTab === 'upload' && (
              <UploadDataView
                analysis={analysis}
                onUploadSuccess={handleUploadSuccess}
                onLoadDemo={loadDemoDataset}
                isLoading={isLoading}
              />
            )}

            {/* 3. Data Analysis (Graphs, Missing values, Duplicate records, Timestamp gaps) */}
            {currentTab === 'data-analysis' && (
              <DataAnalysisView
                analysis={analysis}
              />
            )}

            {/* 4. AI Prediction (Predicted energy, Actual vs predicted graph, Future forecast) */}
            {currentTab === 'prediction' && (
              <ForecastView analysis={analysis} />
            )}

            {/* 5. Anomalies (Abnormal chiller behavior, High-energy alerts, Sensor problems) */}
            {currentTab === 'anomalies' && (
              <AnomaliesView
                analysis={analysis}
                onInspectAnomaly={(rec) => setSelectedAnomaly(rec)}
                onNavigateToSimulation={() => setCurrentTab('optimization')}
              />
            )}

            {/* 6. Optimization (AI recommendations, Suggested operating changes, Efficiency improvement) */}
            {currentTab === 'optimization' && (
              <OptimizationView
                analysis={analysis}
                onNavigateToSavings={() => setCurrentTab('savings')}
              />
            )}

            {/* 7. Savings (kWh saved, Estimated ₹ savings, CO₂ reduction) */}
            {currentTab === 'savings' && (
              <SavingsRecommendationsView
                analysis={analysis}
                onNavigateToSimulation={() => setCurrentTab('optimization')}
              />
            )}

            {/* 8. Reports (Generate/download analysis report) */}
            {currentTab === 'reports' && (
              <ReportsView
                analysis={analysis}
                onLogReportToHistory={logReportHistory}
              />
            )}

            {/* 9. History (Previously uploaded datasets, Previous predictions, Previous reports) */}
            {currentTab === 'history' && (
              <HistoryView
                datasetHistory={datasetHistory}
                predictionHistory={predictionHistory}
                reportHistory={reportHistory}
                onClearHistory={handleClearHistory}
              />
            )}

            {/* 10. Settings (Energy tariff, Units, Prediction settings, Theme) */}
            {currentTab === 'settings' && (
              <SettingsView
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                onResetSettings={handleResetSettings}
              />
            )}

            {/* Sub-routing for Equipment Telemetry if selected from cards */}
            {currentTab === 'monitoring' && (
              <EquipmentMonitoringView
                analysis={analysis}
                selectedEquipment={selectedEquipment}
                onSelectEquipment={setSelectedEquipment}
                onInspectAnomaly={(rec) => setSelectedAnomaly(rec)}
              />
            )}
          </div>
        ) : null}
      </main>

      {/* Investigation Details Modal */}
      <AnomalyDetailModal
        record={selectedAnomaly}
        onClose={() => setSelectedAnomaly(null)}
      />

      {/* CSV Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />

      {/* Industrial Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-bold text-slate-200">CHILLER AI</span> – Intelligent Energy &amp; Equipment Monitoring System
            <p className="text-[11px] text-slate-500 mt-0.5">
              Designed for YUKTHI 2026 National-Level Hackathon • Operational Data → Contextual ML → Health Assessment → Evidence-Based Action
            </p>
          </div>
          <div className="flex items-center space-x-4 text-[11px]">
            <span className="text-slate-500">HistGradientBoostingRegressor Proxy</span>
            <span className="text-slate-700">•</span>
            <span className="text-slate-500">Unsupervised Isolation Forest</span>
            <span className="text-slate-700">•</span>
            <span className="text-blue-400 font-medium">Gemini Diagnostic Copilot</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
