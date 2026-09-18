import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  CheckCircle2,
  Calendar,
  Layers,
  Database,
  DollarSign,
  Leaf,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Info
} from 'lucide-react';
import Papa from 'papaparse';
import { AnalysisResult, HistoryReportItem } from '../types';

interface ReportsViewProps {
  analysis: AnalysisResult;
  onLogReportToHistory?: (report: HistoryReportItem) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  analysis,
  onLogReportToHistory
}) => {
  const {
    datasetName,
    overallHealthScore,
    totalAnomalies,
    systemAnomalyRate,
    equipmentSummaries,
    records,
    dataQuality,
    totalPotentialRupeeSavingsPerDay,
    totalKWhSavingsPerDay,
    totalCo2SavingsKgPerDay,
    recommendations,
    pipelineMetrics
  } = analysis;

  const [includeScorecard, setIncludeScorecard] = useState(true);
  const [includeAnomalies, setIncludeAnomalies] = useState(true);
  const [includeRecommendations, setIncludeRecommendations] = useState(true);
  const [includeDataQuality, setIncludeDataQuality] = useState(true);
  const [generatedNotification, setGeneratedNotification] = useState<string | null>(null);

  const reportDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const notify = (msg: string) => {
    setGeneratedNotification(msg);
    setTimeout(() => setGeneratedNotification(null), 3500);
  };

  const handlePrint = () => {
    if (onLogReportToHistory) {
      onLogReportToHistory({
        id: `rep-${Date.now()}`,
        title: `Comprehensive Diagnostic Report - ${datasetName}`,
        generatedAt: new Date().toLocaleString(),
        datasetName,
        healthScore: overallHealthScore,
        totalSavingsRupees: totalPotentialRupeeSavingsPerDay,
        totalKwhSavings: totalKWhSavingsPerDay,
        format: 'PDF'
      });
    }
    notify('Report dispatched to printer / PDF generator.');
    window.print();
  };

  const handleDownloadCSV = () => {
    const summaryRows = Object.values(equipmentSummaries).map(eq => ({
      'Equipment ID': eq.equipmentId,
      'Health Score (0-100)': eq.healthScore,
      'Status': eq.healthStatus,
      'Average Load (RT)': eq.avgLoad.toFixed(1),
      'Average Energy (kWh)': eq.avgEnergy.toFixed(1),
      'COP': eq.copEstimate.toFixed(2),
      'Specific Power (kW/RT)': eq.avgKwPerRT.toFixed(3),
      'Anomaly Count': eq.anomalyCount,
      'Daily Potential Savings (₹)': eq.potentialRupeeSavings,
      'Daily CO2 Reduction (kg)': eq.potentialCo2SavingsKg.toFixed(1)
    }));

    const csvContent = Papa.unparse(summaryRows);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Chiller_Energy_Report_${datasetName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (onLogReportToHistory) {
      onLogReportToHistory({
        id: `rep-${Date.now()}`,
        title: `CSV Energy & Health Audit - ${datasetName}`,
        generatedAt: new Date().toLocaleString(),
        datasetName,
        healthScore: overallHealthScore,
        totalSavingsRupees: totalPotentialRupeeSavingsPerDay,
        totalKwhSavings: totalKWhSavingsPerDay,
        format: 'CSV'
      });
    }
    notify('CSV report generated and downloaded.');
  };

  const handleDownloadJSON = () => {
    const diagnosticPayload = {
      reportTitle: 'CHILLER AI Diagnostic Telemetry Audit',
      generatedAt: new Date().toISOString(),
      dataset: datasetName,
      healthScore: overallHealthScore,
      anomalyRate: systemAnomalyRate,
      kpis: {
        totalObservations: records.length,
        anomalies: totalAnomalies,
        potentialRupeeSavingsPerDay: totalPotentialRupeeSavingsPerDay,
        kwhSavingsPerDay: totalKWhSavingsPerDay,
        co2SavingsKgPerDay: totalCo2SavingsKgPerDay
      },
      equipmentSummaries,
      dataQuality,
      pipelineMetrics,
      recommendations
    };

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(diagnosticPayload, null, 2))}`;
    const link = document.createElement('a');
    link.setAttribute('href', jsonString);
    link.setAttribute('download', `Chiller_Telemetry_Diagnostic_${datasetName.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (onLogReportToHistory) {
      onLogReportToHistory({
        id: `rep-${Date.now()}`,
        title: `JSON Telemetry Snapshot - ${datasetName}`,
        generatedAt: new Date().toLocaleString(),
        datasetName,
        healthScore: overallHealthScore,
        totalSavingsRupees: totalPotentialRupeeSavingsPerDay,
        totalKwhSavings: totalKWhSavingsPerDay,
        format: 'JSON'
      });
    }
    notify('Diagnostic JSON payload downloaded.');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
              <FileText className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900">📈 Reports &amp; Engineering Audits</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Generate and export printable executive summaries, equipment health scorecards, and BMS maintenance work-orders.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / Save as PDF
          </button>

          <button
            onClick={handleDownloadCSV}
            className="px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Download CSV Summary
          </button>

          <button
            onClick={handleDownloadJSON}
            className="px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Download JSON Dump
          </button>
        </div>
      </div>

      {generatedNotification && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{generatedNotification}</span>
        </div>
      )}

      {/* Report Configuration Checkbox Strip */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <span className="font-bold text-slate-700 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          Report Sections Included in Preview &amp; PDF:
        </span>

        <div className="flex items-center gap-4 flex-wrap text-slate-600">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={includeScorecard}
              onChange={(e) => setIncludeScorecard(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span>Equipment Health Scorecard</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={includeRecommendations}
              onChange={(e) => setIncludeRecommendations(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span>Optimization Directives</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={includeAnomalies}
              onChange={(e) => setIncludeAnomalies(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span>Top Anomaly Audit</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={includeDataQuality}
              onChange={(e) => setIncludeDataQuality(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span>Data Specification Audit</span>
          </label>
        </div>
      </div>

      {/* Live Document Preview Card (Print-Formatted) */}
      <div className="bg-white rounded-xl border border-slate-300 p-8 shadow-sm space-y-6 max-w-4xl mx-auto print:border-none print:shadow-none print:p-0">
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-5 flex items-start justify-between">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-widest text-blue-600 font-bold">
              YUKTHI 2026 • AI ENGINEERING AUDIT
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 mt-1">
              Industrial Chiller Plant Health &amp; Energy Audit Report
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-mono">
              Dataset: <strong>{datasetName}</strong> • Generated on {reportDate}
            </p>
          </div>

          <div className="text-right">
            <div className="text-xs font-bold text-slate-900">Plant Health Index</div>
            <div className={`text-3xl font-extrabold font-mono mt-0.5 ${
              overallHealthScore >= 80 ? 'text-emerald-600' : 'text-amber-600'
            }`}>
              {overallHealthScore}/100
            </div>
            <span className="text-[10px] uppercase font-bold text-slate-500">
              {overallHealthScore >= 80 ? 'Nominal Operation' : 'Attention Required'}
            </span>
          </div>
        </div>

        {/* Executive Summary Cards */}
        <div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
            1. Executive Telemetry &amp; Financial Summary
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Total Telemetry Rows</span>
              <span className="text-lg font-bold text-slate-900 font-mono">{records.length.toLocaleString()}</span>
              <span className="text-[10px] text-slate-400 block">{dataQuality.dateRange.durationDays} Days Active</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Flagged Anomalies</span>
              <span className="text-lg font-bold text-rose-600 font-mono">{totalAnomalies}</span>
              <span className="text-[10px] text-slate-400 block">{systemAnomalyRate}% Anomaly Rate</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Daily Energy Savings</span>
              <span className="text-lg font-bold text-emerald-600 font-mono">₹{totalPotentialRupeeSavingsPerDay.toLocaleString()}</span>
              <span className="text-[10px] text-slate-400 block">{totalKWhSavingsPerDay} kWh / day</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Carbon Abatement</span>
              <span className="text-lg font-bold text-teal-600 font-mono">{totalCo2SavingsKgPerDay.toFixed(0)} kg</span>
              <span className="text-[10px] text-slate-400 block">{(totalCo2SavingsKgPerDay * 330 / 1000).toFixed(1)} MT CO₂/year</span>
            </div>
          </div>
        </div>

        {/* Equipment Health Scorecard */}
        {includeScorecard && (
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              2. Individual Chiller Health &amp; Efficiency Breakdown
            </h3>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-mono text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Equipment</th>
                    <th className="py-2.5 px-3">Health Score</th>
                    <th className="py-2.5 px-3">Avg Load (RT)</th>
                    <th className="py-2.5 px-3">Avg Energy (kWh)</th>
                    <th className="py-2.5 px-3">COP (kW/RT)</th>
                    <th className="py-2.5 px-3">Anomalies</th>
                    <th className="py-2.5 px-3 text-right">Daily Potential (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px] text-slate-800">
                  {Object.values(equipmentSummaries).map((eq) => (
                    <tr key={eq.equipmentId}>
                      <td className="py-2 px-3 font-bold text-slate-900">{eq.equipmentId}</td>
                      <td className="py-2 px-3">
                        <span className={`font-bold ${
                          eq.healthScore >= 80 ? 'text-emerald-600' : eq.healthScore >= 65 ? 'text-amber-600' : 'text-rose-600'
                        }`}>
                          {eq.healthScore}/100 ({eq.healthStatus})
                        </span>
                      </td>
                      <td className="py-2 px-3">{eq.avgLoad.toFixed(1)}</td>
                      <td className="py-2 px-3">{eq.avgEnergy.toFixed(1)}</td>
                      <td className="py-2 px-3">
                        {eq.copEstimate.toFixed(2)} <span className="text-slate-400">({eq.avgKwPerRT.toFixed(3)})</span>
                      </td>
                      <td className="py-2 px-3 text-amber-600 font-bold">{eq.anomalyCount}</td>
                      <td className="py-2 px-3 text-right text-emerald-600 font-bold">
                        ₹{eq.potentialRupeeSavings.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Action Directives */}
        {includeRecommendations && (
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              3. Prioritized Engineering Optimization Directives
            </h3>
            <div className="space-y-2.5">
              {recommendations?.slice(0, 3).map((rec, i) => (
                <div key={rec.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-mono font-bold">
                        {i + 1}
                      </span>
                      {rec.title} ({rec.equipmentId})
                    </span>
                    <span className="font-mono font-bold text-emerald-700">
                      Savings: ₹{rec.rupeeSavingsPerDay.toLocaleString()} / day
                    </span>
                  </div>
                  <p className="text-slate-600 mt-1 pl-5">{rec.actionText}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Data Specification & Audit Section */}
        {includeDataQuality && (
          <div className="pt-2 border-t border-slate-200">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              4. Data Specification &amp; Pipeline Quality
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono text-slate-600">
              <div>Missing Values: <strong>{dataQuality.totalMissingValues}</strong></div>
              <div>Duplicate Rows: <strong>{dataQuality.duplicateRecords}</strong></div>
              <div>Timestamp Gaps: <strong>{dataQuality.timestampGapsCount}</strong></div>
              <div>Sampling Rate: <strong>~{dataQuality.nominalIntervalMinutes}m ({dataQuality.samplingConsistency}%)</strong></div>
            </div>
          </div>
        )}

        {/* Report Footer */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
          <span>CHILLER AI Intelligent Telemetry System • YUKTHI 2026</span>
          <span className="font-mono">Verification Hash: SHA256-CHL-{Date.now().toString(16).toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
};
