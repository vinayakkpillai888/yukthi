import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Flame,
  Search,
  Sliders,
  Filter,
  ArrowRight,
  Sparkles,
  Info,
  Calendar,
  CheckCircle2,
  DollarSign,
  Cpu,
  RefreshCw,
  Bell,
  Thermometer,
  Zap,
  Activity
} from 'lucide-react';
import { AnalysisResult, ProcessedRecord, AnomalySeverity } from '../types';

interface AnomaliesViewProps {
  analysis: AnalysisResult;
  onInspectAnomaly: (record: ProcessedRecord) => void;
  onNavigateToSimulation?: () => void;
}

export const AnomaliesView: React.FC<AnomaliesViewProps> = ({
  analysis,
  onInspectAnomaly,
  onNavigateToSimulation
}) => {
  const { records, equipmentSummaries, systemAlerts, dataQuality } = analysis;

  const [activeCategory, setActiveCategory] = useState<'ALL' | 'ABNORMAL_BEHAVIOR' | 'HIGH_ENERGY' | 'SENSOR_PROBLEMS'>('ALL');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Extract all flagged anomaly records
  const allAnomalies = useMemo(() => {
    return records.filter(r => r.isAnomaly || r.severity === 'WARNING' || r.severity === 'CRITICAL');
  }, [records]);

  // Counts by category
  const highEnergyCount = useMemo(() => {
    return records.filter(r => r.alertType === 'HIGH_ENERGY' || r.deviationPercent > 15).length;
  }, [records]);

  const abnormalBehaviorCount = useMemo(() => {
    return records.filter(r =>
      r.isAnomaly &&
      (r.cop < 3.8 || r.kwPerRT > 0.90 || Math.abs(r.energyResidual) > 25)
    ).length;
  }, [records]);

  const sensorProblemsCount = useMemo(() => {
    return records.filter(r =>
      r.alertType === 'SENSOR_MISSING' ||
      r.alertType === 'ABNORMAL_TEMP' ||
      r.coolingWaterTemp > 31 ||
      r.chilledWaterRate < 50
    ).length;
  }, [records]);

  // Filter anomalies based on active category & controls
  const filteredAnomalies = useMemo(() => {
    return allAnomalies.filter(r => {
      // Equipment filter
      if (selectedEquipment !== 'ALL' && r.equipment_id !== selectedEquipment) return false;

      // Severity filter
      if (selectedSeverity !== 'ALL' && r.severity !== selectedSeverity) return false;

      // Category filter
      if (activeCategory === 'HIGH_ENERGY') {
        const isHighEnergy = r.alertType === 'HIGH_ENERGY' || r.deviationPercent > 15;
        if (!isHighEnergy) return false;
      } else if (activeCategory === 'ABNORMAL_BEHAVIOR') {
        const isAbnormal = r.cop < 4.0 || r.kwPerRT > 0.85 || Math.abs(r.energyResidual) > 20;
        if (!isAbnormal) return false;
      } else if (activeCategory === 'SENSOR_PROBLEMS') {
        const isSensor = r.alertType === 'SENSOR_MISSING' || r.alertType === 'ABNORMAL_TEMP' || r.coolingWaterTemp > 31 || r.chilledWaterRate < 60;
        if (!isSensor) return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesEq = r.equipment_id.toLowerCase().includes(term);
        const matchesInterp = r.interpretation.toLowerCase().includes(term);
        const matchesRec = r.recommendation.toLowerCase().includes(term);
        const matchesAlert = r.alertMessage?.toLowerCase().includes(term);
        if (!matchesEq && !matchesInterp && !matchesRec && !matchesAlert) return false;
      }

      return true;
    });
  }, [allAnomalies, selectedEquipment, selectedSeverity, activeCategory, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
              <AlertTriangle className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900">🚨 Anomaly Detection &amp; Root-Cause Analysis</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Multivariate Isolation Forest and regression residual assessment identifying abnormal chiller behavior, excessive power draw, and sensor anomalies.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold font-mono">
            {allAnomalies.length} Flagged Events ({analysis.systemAnomalyRate}% Anomaly Rate)
          </span>
        </div>
      </div>

      {/* 3 Core Category Cards / Quick Filter Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Abnormal Chiller Behavior */}
        <button
          onClick={() => setActiveCategory(activeCategory === 'ABNORMAL_BEHAVIOR' ? 'ALL' : 'ABNORMAL_BEHAVIOR')}
          className={`p-5 rounded-xl border text-left transition-all cursor-pointer ${
            activeCategory === 'ABNORMAL_BEHAVIOR'
              ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-400/20 shadow-sm'
              : 'bg-white border-slate-200 hover:border-amber-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-amber-600" />
              Abnormal Behavior
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold font-mono bg-amber-100 text-amber-800">
              {abnormalBehaviorCount}
            </span>
          </div>
          <div className="text-sm font-semibold text-slate-900">
            Thermodynamic Lift &amp; COP Degradation
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Low delta-T syndrome, compressor surging, or off-design part-load operation.
          </p>
        </button>

        {/* High-Energy Alerts */}
        <button
          onClick={() => setActiveCategory(activeCategory === 'HIGH_ENERGY' ? 'ALL' : 'HIGH_ENERGY')}
          className={`p-5 rounded-xl border text-left transition-all cursor-pointer ${
            activeCategory === 'HIGH_ENERGY'
              ? 'bg-rose-50/80 border-rose-400 ring-2 ring-rose-400/20 shadow-sm'
              : 'bg-white border-slate-200 hover:border-rose-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-rose-600" />
              High-Energy Alerts
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold font-mono bg-rose-100 text-rose-800">
              {highEnergyCount}
            </span>
          </div>
          <div className="text-sm font-semibold text-slate-900">
            Excess Consumption (&gt;15% Residual)
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Chillers consuming significantly more kWh than model expectation for given cooling load.
          </p>
        </button>

        {/* Sensor Problems */}
        <button
          onClick={() => setActiveCategory(activeCategory === 'SENSOR_PROBLEMS' ? 'ALL' : 'SENSOR_PROBLEMS')}
          className={`p-5 rounded-xl border text-left transition-all cursor-pointer ${
            activeCategory === 'SENSOR_PROBLEMS'
              ? 'bg-indigo-50/80 border-indigo-400 ring-2 ring-indigo-400/20 shadow-sm'
              : 'bg-white border-slate-200 hover:border-indigo-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Thermometer className="w-4 h-4 text-indigo-600" />
              Sensor Problems
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold font-mono bg-indigo-100 text-indigo-800">
              {sensorProblemsCount}
            </span>
          </div>
          <div className="text-sm font-semibold text-slate-900">
            Temperature &amp; Flow Telemetry Anomalies
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Abnormal cooling water spikes (&gt;31°C), flow decoupling, and missing data points.
          </p>
        </button>
      </div>

      {/* Active System Alerts Context Bar */}
      {systemAlerts && systemAlerts.length > 0 && (
        <div className="bg-slate-900 text-white rounded-xl p-4 shadow-sm border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
              <Bell className="w-4 h-4" />
              <span>Active Contextual Directives ({systemAlerts.length} urgent notices)</span>
            </div>
            <span className="text-[11px] text-slate-400">
              Real-time operational alerts generated by regression + isolation forest rules
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-2">
            {systemAlerts.map(alert => (
              <div key={alert.id} className="p-3 rounded-lg bg-slate-800/80 border border-slate-700 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1">
                    <span className={alert.category === 'HIGH_ENERGY' ? 'text-rose-400' : alert.category === 'ABNORMAL_TEMP' ? 'text-amber-400' : 'text-yellow-400'}>●</span>
                    {alert.equipmentId}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-700 text-slate-300">
                    +₹{alert.rupeeImpactPerHour}/hr
                  </span>
                </div>
                <p className="text-slate-300 font-medium mt-1 leading-snug">{alert.message}</p>
                <div className="mt-2 text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                  <span>Fix:</span> {alert.suggestedAction}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search anomalies, keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 w-48 sm:w-64"
            />
          </div>

          <select
            value={selectedEquipment}
            onChange={(e) => setSelectedEquipment(e.target.value)}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">All Equipment</option>
            {dataQuality.equipmentUnits.map(unit => (
              <option key={unit} value={unit}>{unit}</option>
            ))}
          </select>

          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="WARNING">Warning &amp; Critical</option>
            <option value="WATCH">Watch Only</option>
          </select>

          {activeCategory !== 'ALL' && (
            <button
              onClick={() => setActiveCategory('ALL')}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold px-2 py-1 rounded bg-blue-50 cursor-pointer"
            >
              Clear Category Filter
            </button>
          )}
        </div>

        <div className="text-xs text-slate-500 font-mono">
          Showing <strong>{filteredAnomalies.length}</strong> of {allAnomalies.length} anomalies
        </div>
      </div>

      {/* Anomalies List / Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-mono text-[11px]">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Equipment</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Load (RT)</th>
                <th className="py-3 px-4">Energy (Obs vs Exp)</th>
                <th className="py-3 px-4">COP / kW/RT</th>
                <th className="py-3 px-4">Category &amp; Interpretation</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px] text-slate-700">
              {filteredAnomalies.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-sans">
                    No anomalies found matching current criteria.
                  </td>
                </tr>
              ) : (
                filteredAnomalies.slice(0, 50).map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">{row.timestamp}</td>
                    <td className="py-2.5 px-4 font-bold text-slate-900">{row.equipment_id}</td>
                    <td className="py-2.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold ${
                        row.severity === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-800'
                          : row.severity === 'WARNING'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {row.severity}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">{row.buildingLoad.toFixed(1)} RT</td>
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <span className="font-bold text-slate-900">{row.actualEnergy.toFixed(1)}</span>
                      <span className="text-slate-400"> vs </span>
                      <span className="text-slate-500">{row.expectedEnergy.toFixed(1)} kWh</span>
                      <span className={`ml-1.5 text-[10px] font-bold ${
                        row.deviationPercent > 0 ? 'text-rose-600' : 'text-emerald-600'
                      }`}>
                        ({row.deviationPercent > 0 ? '+' : ''}{row.deviationPercent.toFixed(1)}%)
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="font-semibold text-slate-800">{row.cop.toFixed(2)}</span>
                      <span className="text-slate-400 text-[10px]"> ({row.kwPerRT.toFixed(3)})</span>
                    </td>
                    <td className="py-2.5 px-4 font-sans text-xs max-w-xs truncate" title={row.interpretation}>
                      {row.alertMessage || row.interpretation}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <button
                        onClick={() => onInspectAnomaly(row)}
                        className="px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold font-sans transition-colors cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredAnomalies.length > 50 && (
          <div className="bg-slate-50 px-4 py-2 text-center text-xs text-slate-500 border-t border-slate-200">
            Showing first 50 of {filteredAnomalies.length} records. Filter above to narrow down results.
          </div>
        )}
      </div>
    </div>
  );
};
