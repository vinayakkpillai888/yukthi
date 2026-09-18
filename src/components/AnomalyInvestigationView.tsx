import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  AlertTriangle,
  ArrowUpDown,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Download,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { ProcessedRecord, AnomalySeverity } from '../types';

interface AnomalyInvestigationViewProps {
  records: ProcessedRecord[];
  onInspectAnomaly: (record: ProcessedRecord) => void;
}

export const AnomalyInvestigationView: React.FC<AnomalyInvestigationViewProps> = ({
  records,
  onInspectAnomaly
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all_anomalies');
  const [equipmentFilter, setEquipmentFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Extract unique equipments
  const equipmentList = useMemo(() => {
    return Array.from(new Set(records.map(r => r.equipment_id))).sort();
  }, [records]);

  // Filter records
  const filteredList = useMemo(() => {
    return records.filter(r => {
      // Severity filter
      if (severityFilter === 'all_anomalies') {
        if (r.severity === 'NORMAL') return false;
      } else if (severityFilter === 'CRITICAL' && r.severity !== 'CRITICAL') {
        return false;
      } else if (severityFilter === 'WARNING' && r.severity !== 'WARNING') {
        return false;
      } else if (severityFilter === 'WATCH' && r.severity !== 'WATCH') {
        return false;
      }

      // Equipment filter
      if (equipmentFilter !== 'all' && r.equipment_id !== equipmentFilter) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchEq = r.equipment_id.toLowerCase().includes(q);
        const matchTs = r.timestamp.toLowerCase().includes(q);
        const matchInterp = r.interpretation.toLowerCase().includes(q);
        if (!matchEq && !matchTs && !matchInterp) return false;
      }

      return true;
    });
  }, [records, severityFilter, equipmentFilter, searchQuery]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredList.length / pageSize));
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredList.slice(start, start + pageSize);
  }, [filteredList, currentPage]);

  const severityStats = useMemo(() => {
    let critical = 0;
    let warning = 0;
    let watch = 0;
    records.forEach(r => {
      if (r.severity === 'CRITICAL') critical++;
      else if (r.severity === 'WARNING') warning++;
      else if (r.severity === 'WATCH') watch++;
    });
    return { critical, warning, watch, total: critical + warning + watch };
  }, [records]);

  const exportTableCSV = () => {
    const header = [
      'Equipment',
      'Timestamp',
      'Severity',
      'Actual Energy (kWh)',
      'Expected Energy (kWh)',
      'Deviation %',
      'iForest Score',
      'Persistence',
      'Building Load (RT)',
      'Cooling Water Temp (C)',
      'Recommendation'
    ];

    const rows = filteredList.map(r => [
      r.equipment_id,
      r.timestamp,
      r.severity,
      r.actualEnergy,
      r.expectedEnergy,
      r.deviationPercent,
      r.multivariateScore,
      r.persistenceCount,
      r.buildingLoad,
      r.coolingWaterTemp,
      `"${r.recommendation.replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [header.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `chiller_anomalies_investigation_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Investigation Metric Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => { setSeverityFilter('CRITICAL'); setCurrentPage(1); }}
          className={`bg-white p-3.5 rounded-xl border cursor-pointer transition-all ${
            severityFilter === 'CRITICAL' ? 'border-rose-500 ring-2 ring-rose-200' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-rose-600">
            <span className="text-[11px] font-bold uppercase tracking-wider">Critical Anomalies</span>
            <span className="w-2 h-2 rounded-full bg-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-700 mt-1">{severityStats.critical}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">High deviation + persistent</div>
        </div>

        <div
          onClick={() => { setSeverityFilter('WARNING'); setCurrentPage(1); }}
          className={`bg-white p-3.5 rounded-xl border cursor-pointer transition-all ${
            severityFilter === 'WARNING' ? 'border-amber-500 ring-2 ring-amber-200' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-amber-600">
            <span className="text-[11px] font-bold uppercase tracking-wider">Warning Events</span>
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-1">{severityStats.warning}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Contextual deviation flagged</div>
        </div>

        <div
          onClick={() => { setSeverityFilter('WATCH'); setCurrentPage(1); }}
          className={`bg-white p-3.5 rounded-xl border cursor-pointer transition-all ${
            severityFilter === 'WATCH' ? 'border-blue-500 ring-2 ring-blue-200' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-blue-600">
            <span className="text-[11px] font-bold uppercase tracking-wider">Watch Condition</span>
            <span className="w-2 h-2 rounded-full bg-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-700 mt-1">{severityStats.watch}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Early deviation / transient</div>
        </div>

        <div
          onClick={() => { setSeverityFilter('all_anomalies'); setCurrentPage(1); }}
          className={`bg-white p-3.5 rounded-xl border cursor-pointer transition-all ${
            severityFilter === 'all_anomalies' ? 'border-slate-600 ring-2 ring-slate-200' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-700">
            <span className="text-[11px] font-bold uppercase tracking-wider">All Flagged Events</span>
            <span className="w-2 h-2 rounded-full bg-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-800 mt-1">{severityStats.total}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Total unusual periods</div>
        </div>
      </div>

      {/* Table Filter & Controls Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search box */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by equipment, timestamp..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:border-blue-500 bg-slate-50/50"
            />
          </div>

          {/* Equipment filter */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-500 font-medium">Unit:</span>
            <select
              value={equipmentFilter}
              onChange={e => { setEquipmentFilter(e.target.value); setCurrentPage(1); }}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs focus:outline-hidden"
            >
              <option value="all">All Units ({records.length > 0 ? equipmentList.length : 0})</option>
              {equipmentList.map(eq => (
                <option key={eq} value={eq}>{eq}</option>
              ))}
            </select>
          </div>

          {/* Severity filter dropdown */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-500 font-medium">Severity:</span>
            <select
              value={severityFilter}
              onChange={e => { setSeverityFilter(e.target.value); setCurrentPage(1); }}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs focus:outline-hidden"
            >
              <option value="all_anomalies">All Flagged (Watch + Warn + Crit)</option>
              <option value="CRITICAL">Critical Only</option>
              <option value="WARNING">Warning Only</option>
              <option value="WATCH">Watch Only</option>
              <option value="all">All (Including Normal)</option>
            </select>
          </div>
        </div>

        {/* Export Button */}
        <button
          onClick={exportTableCSV}
          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          Export CSV ({filteredList.length})
        </button>
      </div>

      {/* Main Anomaly Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3.5">Severity</th>
                <th className="py-3 px-3.5">Equipment</th>
                <th className="py-3 px-3.5">Timestamp</th>
                <th className="py-3 px-3.5">Actual Energy</th>
                <th className="py-3 px-3.5">Expected Energy</th>
                <th className="py-3 px-3.5">Deviation %</th>
                <th className="py-3 px-3.5">iForest Score</th>
                <th className="py-3 px-3.5">Persistence</th>
                <th className="py-3 px-3.5">Status</th>
                <th className="py-3 px-3.5 text-right">Investigation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400 text-xs">
                    No observations matched the selected filters.
                  </td>
                </tr>
              ) : (
                paginatedRecords.map(rec => {
                  const isPositive = rec.deviationPercent >= 0;
                  const severityBadgeClass = {
                    CRITICAL: 'bg-rose-100 text-rose-800 border-rose-200',
                    WARNING: 'bg-amber-100 text-amber-800 border-amber-200',
                    WATCH: 'bg-blue-100 text-blue-800 border-blue-200',
                    NORMAL: 'bg-slate-100 text-slate-600 border-slate-200'
                  }[rec.severity];

                  return (
                    <tr
                      key={rec.id}
                      onClick={() => onInspectAnomaly(rec)}
                      className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${severityBadgeClass}`}>
                          {rec.severity}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 font-bold text-slate-900">{rec.equipment_id}</td>
                      <td className="py-3 px-3.5 font-mono text-slate-600 text-[11px]">
                        {new Date(rec.timestamp).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-3 px-3.5 font-bold text-slate-900">{rec.actualEnergy} kWh</td>
                      <td className="py-3 px-3.5 text-slate-500">{rec.expectedEnergy} kWh</td>
                      <td className={`py-3 px-3.5 font-bold ${isPositive ? 'text-rose-600' : 'text-blue-600'}`}>
                        {isPositive ? `+${rec.deviationPercent}%` : `${rec.deviationPercent}%`}
                      </td>
                      <td className="py-3 px-3.5 font-mono text-indigo-700 font-semibold">
                        {rec.multivariateScore.toFixed(3)}
                      </td>
                      <td className="py-3 px-3.5 text-slate-700">
                        {rec.persistenceCount > 1 ? (
                          <span className="font-semibold text-rose-600">{rec.persistenceCount} consecutive</span>
                        ) : (
                          <span className="text-slate-400">1 step</span>
                        )}
                      </td>
                      <td className="py-3 px-3.5">
                        <span className="text-[11px] text-slate-600">
                          {rec.severity === 'CRITICAL' ? 'Investigate' : rec.severity === 'WARNING' ? 'Monitor' : 'Nominal'}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); onInspectAnomaly(rec); }}
                          className="px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          Deep Inspect &rarr;
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <strong>{Math.min(filteredList.length, (currentPage - 1) * pageSize + 1)}</strong> to{' '}
            <strong>{Math.min(filteredList.length, currentPage * pageSize)}</strong> of{' '}
            <strong>{filteredList.length.toLocaleString()}</strong> events
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded border border-slate-200 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded border border-slate-200 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
