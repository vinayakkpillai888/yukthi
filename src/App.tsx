import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { OverviewView } from './components/OverviewView';
import { RealtimeMonitoringView } from './components/RealtimeMonitoringView';
import { ForecastView } from './components/ForecastView';
import { ChillerComparisonView } from './components/ChillerComparisonView';
import { WhatIfSimulationView } from './components/WhatIfSimulationView';
import { SavingsRecommendationsView } from './components/SavingsRecommendationsView';
import { EquipmentMonitoringView } from './components/EquipmentMonitoringView';
import { AnomalyInvestigationView } from './components/AnomalyInvestigationView';
import { EnergyAnalysisView } from './components/EnergyAnalysisView';
import { DataQualityView } from './components/DataQualityView';
import { AIInsightsView } from './components/AIInsightsView';
import { UploadModal } from './components/UploadModal';
import { AnomalyDetailModal } from './components/AnomalyDetailModal';
import { AnalysisResult, ProcessedRecord } from './types';
import { preprocessDataset } from './ml/preprocessor';
import { runFullPipeline } from './ml/combinedEngine';
import { generateDemoDataset } from './ml/syntheticData';
import { AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';

export default function App() {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [currentTab, setCurrentTab] = useState<string>('overview');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('CHILLER-01');
  const [selectedAnomaly, setSelectedAnomaly] = useState<ProcessedRecord | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [uploadError, setUploadError] = useState<string | null>(null);

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
      const result = runFullPipeline(preprocessed, 'Demo Dataset (CHILLER 1-3)', true);
      setAnalysis(result);
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

            {currentTab === 'realtime' && (
              <RealtimeMonitoringView
                analysis={analysis}
                onInspectAnomaly={(rec) => setSelectedAnomaly(rec)}
                onNavigateToSimulation={() => setCurrentTab('simulation')}
              />
            )}

            {currentTab === 'forecast' && (
              <ForecastView analysis={analysis} />
            )}

            {currentTab === 'efficiency' && (
              <ChillerComparisonView
                analysis={analysis}
                onNavigateToSimulation={() => setCurrentTab('simulation')}
              />
            )}

            {currentTab === 'simulation' && (
              <WhatIfSimulationView analysis={analysis} />
            )}

            {currentTab === 'recommendations' && (
              <SavingsRecommendationsView
                analysis={analysis}
                onNavigateToSimulation={() => setCurrentTab('simulation')}
              />
            )}

            {currentTab === 'monitoring' && (
              <EquipmentMonitoringView
                analysis={analysis}
                selectedEquipment={selectedEquipment}
                onSelectEquipment={setSelectedEquipment}
                onInspectAnomaly={(rec) => setSelectedAnomaly(rec)}
              />
            )}

            {currentTab === 'investigation' && (
              <AnomalyInvestigationView
                records={analysis.records}
                onInspectAnomaly={(rec) => setSelectedAnomaly(rec)}
              />
            )}

            {currentTab === 'quality' && (
              <DataQualityView
                dataQuality={analysis.dataQuality}
                records={analysis.records}
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
            <span className="text-blue-400 font-medium">Gemini 3.8 Flash Diagnostic Copilot</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
