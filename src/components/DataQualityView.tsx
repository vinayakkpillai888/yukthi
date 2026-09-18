import React, { useMemo } from 'react';
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Calendar,
  Layers,
  Clock,
  BarChart2,
  Info
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
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { DataQualityReport, ProcessedRecord } from '../types';

interface DataQualityViewProps {
  dataQuality: DataQualityReport;
  records: ProcessedRecord[];
}

export const DataQualityView: React.FC<DataQualityViewProps> = ({
  dataQuality,
  records
}) => {
  // Bar chart data for missing values by column
  const missingValuesChartData = useMemo(() => {
    return Object.entries(dataQuality.missingValuesByColumn).map(([col, count]) => {
      // Shorten label for clean axis display
      const shortName = col.replace(/\(.*\)/, '').trim();
      return {
        fullName: col,
        name: shortName,
        missing: count,
        valid: dataQuality.totalRecords - count
      };
    });
  }, [dataQuality]);

  // Records by equipment chart data
  const equipmentDistributionData = useMemo(() => {
    const counts: Record<string, number> = {};
    records.forEach(r => {
      counts[r.equipment_id] = (counts[r.equipment_id] || 0) + 1;
    });
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
    return Object.entries(counts).map(([name, value], i) => ({
      name,
      value,
      color: colors[i % colors.length]
    }));
  }, [records]);

  // Observations volume over time (grouped by day)
  const observationsOverTimeData = useMemo(() => {
    const dayMap: Record<string, number> = {};
    records.forEach(r => {
      const day = new Date(r.timestamp).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' });
      dayMap[day] = (dayMap[day] || 0) + 1;
    });
    return Object.entries(dayMap).map(([day, count]) => ({ day, count }));
  }, [records]);

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            YUKTHI 2026 Data Specification &amp; Quality Audit
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Verification of 11 physical &amp; meteorological fields, temporal continuity, duplicate filtering, and robust imputation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Sampling Consistency: {dataQuality.samplingConsistency}%
          </span>
        </div>
      </div>

      {/* Quality KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Total Ingested</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {dataQuality.totalRecords.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Raw rows received</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Valid Observations</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {dataQuality.validRows.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Cleaned &amp; processed</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Equipment Units</span>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            {dataQuality.equipmentUnits.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {dataQuality.equipmentUnits.join(', ') || 'None'}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Missing Values</span>
          <div className={`text-2xl font-bold mt-1 ${dataQuality.totalMissingValues > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
            {dataQuality.totalMissingValues}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Imputed via interpolation</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Duplicate Rows</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {dataQuality.duplicateRecords}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Deduplicated at ingestion</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Timestamp Gaps</span>
          <div className="text-2xl font-bold text-indigo-600 mt-1">
            {dataQuality.timestampGapsCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">&gt;45 min delta detected</div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Missing Values by Field */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-blue-600" />
            Missing Values Distribution by Expected Field
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Total missing measurements per column (automatically repaired via linear interpolation / median fallback)
          </p>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={missingValuesChartData} layout="vertical" margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} tickLine={false} width={100} />
                <Tooltip
                  formatter={(val, name, item) => [`${val} missing`, item.payload.fullName]}
                />
                <Bar dataKey="missing" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Observations Volume Over Time */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            Observation Density Over Time
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Daily observation counts spanning {dataQuality.dateRange.durationDays} operational days
          </p>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={observationsOverTimeData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Equipment Distribution & Temporal Gaps Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Equipment distribution card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            Records by Equipment Unit
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            Proportional share across identified equipment identifiers
          </p>

          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={equipmentDistributionData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={65}
                >
                  {equipmentDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 mt-2">
            {equipmentDistributionData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs p-1.5 rounded bg-slate-50">
                <span className="flex items-center gap-2 font-medium text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name}
                </span>
                <span className="font-mono font-bold text-slate-800">
                  {item.value.toLocaleString()} records
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Timestamp Gaps Table */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              Detected Timestamp Gaps (Non-continuous intervals)
            </h3>
            <span className="text-xs text-slate-500">
              Nominal interval: 30 min | Threshold: &gt;45 min
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Note: As per specification, temporal gaps are logged for data quality but are <strong>not automatically classified as anomalies</strong>.
          </p>

          <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold sticky top-0 border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3">Equipment</th>
                  <th className="py-2 px-3">Gap Start</th>
                  <th className="py-2 px-3">Gap End</th>
                  <th className="py-2 px-3 text-right">Duration (Minutes)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dataQuality.timestampGaps.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400 text-xs">
                      No significant timestamp gaps detected across the series.
                    </td>
                  </tr>
                ) : (
                  dataQuality.timestampGaps.map((gap, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-semibold text-slate-800">{gap.equipmentId}</td>
                      <td className="py-2 px-3 font-mono text-slate-600 text-[11px]">{new Date(gap.gapStart).toLocaleString()}</td>
                      <td className="py-2 px-3 font-mono text-slate-600 text-[11px]">{new Date(gap.gapEnd).toLocaleString()}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-indigo-600">
                        {gap.gapDurationMinutes} min
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
