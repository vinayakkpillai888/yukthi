import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Database,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  Calendar,
  Info,
  TrendingUp,
  Activity,
  FileCheck,
  RefreshCw,
  Search
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ScatterChart,
  Scatter,
  LineChart,
  Line,
  Cell
} from 'recharts';
import { AnalysisResult, ProcessedRecord } from '../types';

interface DataAnalysisViewProps {
  analysis: AnalysisResult;
}

export const DataAnalysisView: React.FC<DataAnalysisViewProps> = ({ analysis }) => {
  const { dataQuality, records, equipmentSummaries } = analysis;
  const [activeGraphTab, setActiveGraphTab] = useState<'load' | 'diurnal' | 'temp' | 'flow'>('load');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('ALL');

  // Filter records by equipment if selected
  const filteredRecords = useMemo(() => {
    if (selectedEquipment === 'ALL') return records;
    return records.filter(r => r.equipment_id === selectedEquipment);
  }, [records, selectedEquipment]);

  // Missing values chart data
  const missingValuesChartData = useMemo(() => {
    return Object.entries(dataQuality.missingValuesByColumn).map(([col, count]) => {
      const shortName = col.replace(/\(.*\)/, '').trim();
      return {
        fullName: col,
        name: shortName,
        missing: count,
        valid: dataQuality.totalRecords - count,
        pctMissing: ((count / Math.max(1, dataQuality.totalRecords)) * 100).toFixed(1)
      };
    });
  }, [dataQuality]);

  // Sample records for Scatter Chart (Energy vs Load) to keep Recharts snappy
  const loadScatterData = useMemo(() => {
    const step = Math.max(1, Math.floor(filteredRecords.length / 180));
    const points: any[] = [];
    for (let i = 0; i < filteredRecords.length; i += step) {
      const r = filteredRecords[i];
      points.push({
        load: Math.round(r.buildingLoad),
        actualEnergy: Math.round(r.actualEnergy),
        expectedEnergy: Math.round(r.expectedEnergy),
        equipment: r.equipment_id,
        isAnomaly: r.severity === 'WARNING' || r.severity === 'CRITICAL'
      });
    }
    return points;
  }, [filteredRecords]);

  // Diurnal 24-Hour Profile (Average Energy & Load by Hour of Day)
  const diurnalProfileData = useMemo(() => {
    const hourMap: Record<number, { sumEnergy: number; sumLoad: number; count: number }> = {};
    for (let h = 0; h < 24; h++) {
      hourMap[h] = { sumEnergy: 0, sumLoad: 0, count: 0 };
    }

    filteredRecords.forEach(r => {
      const h = r.hour;
      if (hourMap[h]) {
        hourMap[h].sumEnergy += r.actualEnergy;
        hourMap[h].sumLoad += r.buildingLoad;
        hourMap[h].count += 1;
      }
    });

    return Object.entries(hourMap).map(([hour, data]) => {
      const hNum = Number(hour);
      const label = `${hNum.toString().padStart(2, '0')}:00`;
      const avgEnergy = data.count > 0 ? Math.round(data.sumEnergy / data.count) : 0;
      const avgLoad = data.count > 0 ? Math.round(data.sumLoad / data.count) : 0;
      return {
        hour: hNum,
        label,
        avgEnergy,
        avgLoad
      };
    });
  }, [filteredRecords]);

  // Cooling Water Temp vs Energy correlation points
  const tempCorrelationData = useMemo(() => {
    const step = Math.max(1, Math.floor(filteredRecords.length / 150));
    const points: any[] = [];
    for (let i = 0; i < filteredRecords.length; i += step) {
      const r = filteredRecords[i];
      points.push({
        cwTemp: Number(r.coolingWaterTemp.toFixed(1)),
        energy: Math.round(r.actualEnergy),
        equipment: r.equipment_id,
        cop: Number(r.cop.toFixed(2))
      });
    }
    return points;
  }, [filteredRecords]);

  // Flow Rate vs Specific Power (kW/RT)
  const flowEfficiencyData = useMemo(() => {
    const step = Math.max(1, Math.floor(filteredRecords.length / 150));
    const points: any[] = [];
    for (let i = 0; i < filteredRecords.length; i += step) {
      const r = filteredRecords[i];
      points.push({
        flow: Math.round(r.chilledWaterRate),
        kwPerRT: Number(r.kwPerRT.toFixed(3)),
        equipment: r.equipment_id
      });
    }
    return points;
  }, [filteredRecords]);

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900">📊 Data Analysis &amp; Quality Audit</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Statistical distribution graphs, missing value imputation analysis, duplicate record verification, and temporal continuity gap checks.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <label className="text-xs font-semibold text-slate-600">Filter Equipment:</label>
          <select
            value={selectedEquipment}
            onChange={(e) => setSelectedEquipment(e.target.value)}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">All Chillers ({dataQuality.equipmentUnits.length})</option>
            {dataQuality.equipmentUnits.map(unit => (
              <option key={unit} value={unit}>{unit}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 4 Core Data KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Missing Values</span>
            <Database className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 font-mono">
            {dataQuality.totalMissingValues}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Imputed via linear interpolation
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Duplicate Records</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {dataQuality.duplicateRecords}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Filtered at ingestion boundary
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Timestamp Gaps</span>
            <Clock className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-indigo-600 font-mono">
            {dataQuality.timestampGapsCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Gaps &gt;45 minutes interval
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Sampling Consistency</span>
            <Activity className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 font-mono">
            {dataQuality.samplingConsistency}%
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Nominal ~{dataQuality.nominalIntervalMinutes} min cadence
          </div>
        </div>
      </div>

      {/* Graphs Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Operational Telemetry &amp; Energy Graphs
            </h2>
            <p className="text-xs text-slate-500">
              Correlations, diurnal cycles, and thermodynamic load profiles
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold text-slate-600 self-start sm:self-auto">
            <button
              onClick={() => setActiveGraphTab('load')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                activeGraphTab === 'load' ? 'bg-white text-blue-600 shadow-xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              Energy vs Load
            </button>
            <button
              onClick={() => setActiveGraphTab('diurnal')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                activeGraphTab === 'diurnal' ? 'bg-white text-blue-600 shadow-xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              24h Diurnal Profile
            </button>
            <button
              onClick={() => setActiveGraphTab('temp')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                activeGraphTab === 'temp' ? 'bg-white text-blue-600 shadow-xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              Cooling Temp vs Energy
            </button>
            <button
              onClick={() => setActiveGraphTab('flow')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                activeGraphTab === 'flow' ? 'bg-white text-blue-600 shadow-xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              Flow vs kW/RT
            </button>
          </div>
        </div>

        {/* Graph Render */}
        <div className="h-80 w-full pt-2">
          {activeGraphTab === 'load' && (
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  type="number"
                  dataKey="load"
                  name="Building Load"
                  unit=" RT"
                  stroke="#64748b"
                  fontSize={11}
                  label={{ value: 'Building Cooling Load (RT)', position: 'insideBottom', offset: -10, fontSize: 11, fill: '#64748b' }}
                />
                <YAxis
                  type="number"
                  dataKey="actualEnergy"
                  name="Energy"
                  unit=" kWh"
                  stroke="#64748b"
                  fontSize={11}
                  label={{ value: 'Chiller Energy (kWh)', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#64748b' }}
                />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  formatter={(value: any, name: any) => [`${value} ${String(name || '').includes('Load') ? 'RT' : 'kWh'}`, String(name || '')]}
                />
                <Legend verticalAlign="top" height={36} />
                <Scatter name="Observed Energy" data={loadScatterData} fill="#3b82f6" fillOpacity={0.6} />
              </ScatterChart>
            </ResponsiveContainer>
          )}

          {activeGraphTab === 'diurnal' && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={diurnalProfileData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="label"
                  stroke="#64748b"
                  fontSize={11}
                  label={{ value: 'Hour of the Day (24-Hour Cycle)', position: 'insideBottom', offset: -10, fontSize: 11, fill: '#64748b' }}
                />
                <YAxis
                  yAxisId="left"
                  stroke="#3b82f6"
                  fontSize={11}
                  label={{ value: 'Average Energy (kWh)', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#3b82f6' }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#10b981"
                  fontSize={11}
                  label={{ value: 'Average Load (RT)', angle: 90, position: 'insideRight', fontSize: 11, fill: '#10b981' }}
                />
                <Tooltip formatter={(value: any, name: any) => [`${value} ${String(name || '').includes('Energy') ? 'kWh' : 'RT'}`, String(name || '')]} />
                <Legend verticalAlign="top" height={36} />
                <Line yAxisId="left" type="monotone" dataKey="avgEnergy" name="Avg Energy (kWh)" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line yAxisId="right" type="monotone" dataKey="avgLoad" name="Avg Load (RT)" stroke="#10b981" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}

          {activeGraphTab === 'temp' && (
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  type="number"
                  dataKey="cwTemp"
                  name="Cooling Water Temp"
                  unit="°C"
                  domain={['auto', 'auto']}
                  stroke="#64748b"
                  fontSize={11}
                  label={{ value: 'Cooling Water Entering Temp (°C)', position: 'insideBottom', offset: -10, fontSize: 11, fill: '#64748b' }}
                />
                <YAxis
                  type="number"
                  dataKey="energy"
                  name="Energy"
                  unit=" kWh"
                  stroke="#64748b"
                  fontSize={11}
                  label={{ value: 'Chiller Energy (kWh)', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#64748b' }}
                />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Legend verticalAlign="top" height={36} />
                <Scatter name="Cooling Temp Impact" data={tempCorrelationData} fill="#f59e0b" fillOpacity={0.7} />
              </ScatterChart>
            </ResponsiveContainer>
          )}

          {activeGraphTab === 'flow' && (
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  type="number"
                  dataKey="flow"
                  name="Flow Rate"
                  unit=" L/s"
                  stroke="#64748b"
                  fontSize={11}
                  label={{ value: 'Chilled Water Rate (L/sec)', position: 'insideBottom', offset: -10, fontSize: 11, fill: '#64748b' }}
                />
                <YAxis
                  type="number"
                  dataKey="kwPerRT"
                  name="Specific Power"
                  unit=" kW/RT"
                  stroke="#64748b"
                  fontSize={11}
                  label={{ value: 'Specific Power (kW/RT)', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#64748b' }}
                />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Legend verticalAlign="top" height={36} />
                <Scatter name="Flow Efficiency Curve" data={flowEfficiencyData} fill="#8b5cf6" fillOpacity={0.6} />
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Missing Values & Duplicate Records Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Missing Values Table & Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-amber-600" />
              Missing Values Audit by Column
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
              {dataQuality.totalMissingValues} total missing
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Total missing values per column automatically repaired via forward-fill and linear time-series interpolation.
          </p>

          <div className="h-48 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={missingValuesChartData} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" stroke="#94a3b8" fontSize={10} />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} width={90} />
                <Tooltip formatter={(val: any) => [`${val} missing`, 'Count']} />
                <Bar dataKey="missing" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 sticky top-0 text-[11px]">
                <tr>
                  <th className="py-2 px-3">Column Name</th>
                  <th className="py-2 px-3 text-right">Missing</th>
                  <th className="py-2 px-3 text-right">% Missing</th>
                  <th className="py-2 px-3 text-right">Repair Strategy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px] text-slate-700">
                {missingValuesChartData.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70">
                    <td className="py-1.5 px-3 font-sans text-slate-900">{item.fullName}</td>
                    <td className={`py-1.5 px-3 text-right font-bold ${item.missing > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                      {item.missing}
                    </td>
                    <td className="py-1.5 px-3 text-right text-slate-500">{item.pctMissing}%</td>
                    <td className="py-1.5 px-3 text-right text-emerald-600 font-sans text-[10px]">
                      Linear Interpolation
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Duplicate Records & Timestamp Continuity */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                Duplicate Records &amp; Ingestion Cleaning
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                {dataQuality.duplicateRecords} Deduplicated
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Ingestion pipeline verifies uniqueness of compound key: <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px] font-mono">[equipment_id, timestamp]</code>.
            </p>

            <div className="space-y-3 mb-6">
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Deterministic De-Duplication</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {dataQuality.duplicateRecords > 0
                      ? `Found and safely consolidated ${dataQuality.duplicateRecords} duplicate records without data loss.`
                      : 'Zero duplicate rows found. The incoming telemetry demonstrates high ingestion integrity.'}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-3">
                <Layers className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Multi-Chiller Equipment Isolation</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Records independently verified for: <strong>{dataQuality.equipmentUnits.join(', ')}</strong> across all operational timestamps.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Timestamp Gaps Subsection */}
          <div className="pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                Timestamp Gaps (&gt;45 min delta)
              </h4>
              <span className="text-xs font-mono text-indigo-600 font-bold">
                {dataQuality.timestampGapsCount} detected
              </span>
            </div>

            {dataQuality.timestampGaps.length > 0 ? (
              <div className="border border-slate-200 rounded-lg overflow-hidden max-h-36 overflow-y-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 sticky top-0 text-[10px]">
                    <tr>
                      <th className="py-1.5 px-2">Equipment</th>
                      <th className="py-1.5 px-2">Gap Start</th>
                      <th className="py-1.5 px-2">Gap End</th>
                      <th className="py-1.5 px-2 text-right">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[10px] text-slate-700">
                    {dataQuality.timestampGaps.slice(0, 5).map((gap, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70">
                        <td className="py-1 px-2 font-bold text-slate-900">{gap.equipmentId}</td>
                        <td className="py-1 px-2 text-slate-500">{gap.gapStart}</td>
                        <td className="py-1 px-2 text-slate-500">{gap.gapEnd}</td>
                        <td className="py-1 px-2 text-right font-bold text-indigo-600">{gap.gapDurationMinutes}m</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Continuous unbroken time-series telemetry. No gaps &gt;45 minutes.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
