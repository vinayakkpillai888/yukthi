import React, { useState, useMemo } from 'react';
import {
  Activity,
  Calendar,
  AlertTriangle,
  ZoomIn,
  Filter,
  Gauge,
  Thermometer,
  Droplets,
  Wind,
  Zap,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Brush,
  ReferenceDot
} from 'recharts';
import { AnalysisResult, ProcessedRecord } from '../types';

interface EquipmentMonitoringViewProps {
  analysis: AnalysisResult;
  selectedEquipment: string;
  onSelectEquipment: (eqId: string) => void;
  onInspectAnomaly: (record: ProcessedRecord) => void;
}

export const EquipmentMonitoringView: React.FC<EquipmentMonitoringViewProps> = ({
  analysis,
  selectedEquipment,
  onSelectEquipment,
  onInspectAnomaly
}) => {
  const { records, equipmentSummaries } = analysis;
  const [timeRange, setTimeRange] = useState<'all' | '7d' | '14d' | 'anomalies_only'>('all');
  const [focusedAnomalyTime, setFocusedAnomalyTime] = useState<string | null>(null);

  const availableUnits = Object.keys(equipmentSummaries).sort();
  const currentUnit = selectedEquipment || availableUnits[0] || 'CHILLER-01';
  const summary = equipmentSummaries[currentUnit];

  // Filter records by selected equipment
  const unitRecords = useMemo(() => {
    return records.filter(r => r.equipment_id === currentUnit);
  }, [records, currentUnit]);

  // Apply time / anomaly filter
  const filteredRecords = useMemo(() => {
    if (unitRecords.length === 0) return [];

    let result = [...unitRecords];
    const latestTime = unitRecords[unitRecords.length - 1]?.dateObj.getTime() || Date.now();

    if (timeRange === '7d') {
      const cutoff = latestTime - 7 * 24 * 3600 * 1000;
      result = result.filter(r => r.dateObj.getTime() >= cutoff);
    } else if (timeRange === '14d') {
      const cutoff = latestTime - 14 * 24 * 3600 * 1000;
      result = result.filter(r => r.dateObj.getTime() >= cutoff);
    } else if (timeRange === 'anomalies_only') {
      // Show abnormal records + surrounding context
      const anomalyIndices = new Set<number>();
      unitRecords.forEach((r, idx) => {
        if (r.severity === 'WARNING' || r.severity === 'CRITICAL') {
          for (let offset = -3; offset <= 3; offset++) {
            const target = idx + offset;
            if (target >= 0 && target < unitRecords.length) {
              anomalyIndices.add(target);
            }
          }
        }
      });
      result = Array.from(anomalyIndices).sort((a, b) => a - b).map(i => unitRecords[i]);
    }

    return result;
  }, [unitRecords, timeRange]);

  // Downsample if huge (> 200 points) for chart rendering responsiveness
  const chartData = useMemo(() => {
    if (filteredRecords.length <= 200) {
      return filteredRecords.map(r => ({
        timestamp: r.timestamp,
        timeFormatted: `${new Date(r.timestamp).getMonth() + 1}/${new Date(r.timestamp).getDate()} ${new Date(r.timestamp).getHours()}:00`,
        actualEnergy: r.actualEnergy,
        expectedEnergy: r.expectedEnergy,
        buildingLoad: r.buildingLoad,
        coolingWaterTemp: r.coolingWaterTemp,
        chilledWaterRate: r.chilledWaterRate,
        outsideTemp: r.outsideTemp,
        humidity: r.humidity,
        multivariateScore: r.multivariateScore,
        severity: r.severity,
        isAnomaly: r.severity === 'WARNING' || r.severity === 'CRITICAL',
        rawRecord: r
      }));
    }

    const step = Math.ceil(filteredRecords.length / 180);
    const sampled: any[] = [];
    for (let i = 0; i < filteredRecords.length; i += step) {
      const r = filteredRecords[i];
      sampled.push({
        timestamp: r.timestamp,
        timeFormatted: `${new Date(r.timestamp).getMonth() + 1}/${new Date(r.timestamp).getDate()} ${new Date(r.timestamp).getHours()}:00`,
        actualEnergy: r.actualEnergy,
        expectedEnergy: r.expectedEnergy,
        buildingLoad: r.buildingLoad,
        coolingWaterTemp: r.coolingWaterTemp,
        chilledWaterRate: r.chilledWaterRate,
        outsideTemp: r.outsideTemp,
        humidity: r.humidity,
        multivariateScore: r.multivariateScore,
        severity: r.severity,
        isAnomaly: r.severity === 'WARNING' || r.severity === 'CRITICAL',
        rawRecord: r
      });
    }
    return sampled;
  }, [filteredRecords]);

  // Quick zoom into abnormal period
  const handleZoomToAnomaly = (anomalyRecord: ProcessedRecord) => {
    setFocusedAnomalyTime(anomalyRecord.timestamp);
    onInspectAnomaly(anomalyRecord);
  };

  const unitAnomalies = useMemo(() => {
    return unitRecords.filter(r => r.severity === 'WARNING' || r.severity === 'CRITICAL');
  }, [unitRecords]);

  return (
    <div className="space-y-6">
      {/* Equipment Selector Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Unit tabs */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">Select Unit:</span>
          {availableUnits.map(eqId => {
            const eqSum = equipmentSummaries[eqId];
            const isSelected = currentUnit === eqId;
            return (
              <button
                key={eqId}
                id={`btn-select-${eqId}`}
                onClick={() => onSelectEquipment(eqId)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <span>{eqId}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                  isSelected ? 'bg-blue-700 text-blue-100' : 'bg-slate-200 text-slate-600'
                }`}>
                  {eqSum?.healthScore || 0}/100
                </span>
              </button>
            );
          })}
        </div>

        {/* Date Filter */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
          <button
            onClick={() => setTimeRange('all')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
              timeRange === 'all' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Dates
          </button>
          <button
            onClick={() => setTimeRange('14d')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
              timeRange === '14d' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Last 14 Days
          </button>
          <button
            onClick={() => setTimeRange('7d')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
              timeRange === '7d' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setTimeRange('anomalies_only')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 ${
              timeRange === 'anomalies_only' ? 'bg-amber-500 text-white shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            Abnormal Intervals Only
          </button>
        </div>
      </div>

      {/* Selected Unit Telemetry Summary Strip */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Health Indicator</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className={`text-xl font-bold ${
                summary.healthScore >= 80 ? 'text-emerald-600' : summary.healthScore >= 65 ? 'text-amber-600' : 'text-rose-600'
              }`}>
                {summary.healthScore}/100
              </span>
              <span className="text-[11px] font-semibold uppercase text-slate-600">({summary.healthStatus})</span>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Total Anomalies</span>
            <div className="text-xl font-bold text-slate-900 mt-1">
              {summary.anomalyCount} <span className="text-xs font-normal text-slate-500">periods</span>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Avg Energy</span>
            <div className="text-xl font-bold text-blue-600 mt-1">
              {summary.avgEnergy} <span className="text-xs font-normal text-slate-500">kWh</span>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Avg Load</span>
            <div className="text-xl font-bold text-slate-800 mt-1">
              {summary.avgLoad} <span className="text-xs font-normal text-slate-500">RT</span>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Efficiency (COP)</span>
            <div className="text-xl font-bold text-emerald-600 mt-1">
              {summary.copEstimate}
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Energy Trend</span>
            <div className="text-sm font-bold text-slate-800 capitalize mt-1.5 flex items-center gap-1">
              {summary.energyTrendDirection}
            </div>
          </div>
        </div>
      )}

      {/* Chart 1: Actual vs Expected Energy Time Series */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              {currentUnit}: Energy Consumption vs. ML Expected Profile
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Blue = Actual observed kWh, Dashed grey = ML expected baseline. Divergences indicate contextual anomalies.
            </p>
          </div>
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="timeFormatted" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} unit=" kWh" />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl text-xs space-y-1">
                        <p className="font-semibold text-slate-200">{d.timestamp}</p>
                        <p className="text-blue-400">Actual: <strong>{d.actualEnergy} kWh</strong></p>
                        <p className="text-slate-400">Expected: <strong>{d.expectedEnergy} kWh</strong></p>
                        <p className="text-slate-300">Load: <strong>{d.buildingLoad} RT</strong></p>
                        <p className="text-slate-300">Cooling Water: <strong>{d.coolingWaterTemp} °C</strong></p>
                        <p className="text-indigo-300">iForest Score: <strong>{d.multivariateScore}</strong></p>
                        {d.isAnomaly && (
                          <div className="pt-1 mt-1 border-t border-slate-700 text-amber-400 font-semibold flex items-center gap-1">
                            ⚠️ Anomaly Flagged ({d.severity})
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="actualEnergy" name="Actual Energy (kWh)" stroke="#2563eb" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="expectedEnergy" name="Expected Energy (kWh)" stroke="#94a3b8" strokeDasharray="4 4" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Anomaly Score Timeline & Operating Lift */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Anomaly Score */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-600" />
            Multivariate Isolation Forest Anomaly Score Timeline
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Unsupervised multidimensional isolation score (0 = nominal, &gt; 0.6 = abnormal context)
          </p>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="timeFormatted" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} domain={[0, 1]} tickLine={false} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="multivariateScore"
                  name="iForest Score"
                  stroke="#6366f1"
                  strokeWidth={1.8}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cooling Water & Ambient Temperature */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-emerald-600" />
            Thermal &amp; Environmental Conditions
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Cooling water entering temperature (°C) vs. Outside ambient dry bulb (°F)
          </p>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="timeFormatted" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis yAxisId="left" stroke="#10b981" fontSize={10} tickLine={false} unit=" °C" />
                <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" fontSize={10} tickLine={false} unit=" °F" />
                <Tooltip />
                <Legend verticalAlign="top" height={30} wrapperStyle={{ fontSize: 11 }} />
                <Line yAxisId="left" type="monotone" dataKey="coolingWaterTemp" name="Cooling Water (°C)" stroke="#10b981" strokeWidth={1.8} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="outsideTemp" name="Outside Temp (°F)" stroke="#f59e0b" strokeWidth={1.5} dot={false} strokeDasharray="3 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Abnormal Periods Zoom List */}
      {unitAnomalies.length > 0 && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ZoomIn className="w-4 h-4 text-blue-600" />
              Zoom into Abnormal Periods for {currentUnit} ({unitAnomalies.length} Flagged)
            </h3>
            <span className="text-xs text-slate-500">
              Click any period to open contextual root-cause evidence
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {unitAnomalies.slice(0, 9).map(anomaly => (
              <div
                key={anomaly.id}
                onClick={() => handleZoomToAnomaly(anomaly)}
                className="p-3 rounded-lg border border-slate-200 hover:border-blue-400 bg-slate-50/70 hover:bg-blue-50/40 transition-all cursor-pointer group text-xs"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    anomaly.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {anomaly.severity}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {new Date(anomaly.timestamp).toLocaleDateString()} {new Date(anomaly.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="text-slate-800 font-medium">
                  Actual: <strong className="text-slate-900">{anomaly.actualEnergy} kWh</strong> vs Exp: {anomaly.expectedEnergy} kWh ({anomaly.deviationPercent > 0 ? '+' : ''}{anomaly.deviationPercent}%)
                </div>
                <div className="text-[11px] text-slate-500 mt-1 truncate">
                  Evidence: {anomaly.contributingFactors[0]?.displayName}
                </div>
                <div className="mt-2 text-right text-blue-600 font-semibold text-[11px] group-hover:underline flex items-center justify-end gap-1">
                  Inspect Period <ArrowUpRight className="w-3 h-3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
