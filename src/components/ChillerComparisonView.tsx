import React, { useState } from 'react';
import {
  Activity,
  Layers,
  Zap,
  TrendingDown,
  TrendingUp,
  Award,
  AlertTriangle,
  ArrowRight,
  Info,
  CheckCircle2,
  Gauge,
  Sliders
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { AnalysisResult, ChillerLoadComparisonPoint } from '../types';

interface ChillerComparisonViewProps {
  analysis: AnalysisResult;
  onNavigateToSimulation?: () => void;
}

export const ChillerComparisonView: React.FC<ChillerComparisonViewProps> = ({
  analysis,
  onNavigateToSimulation
}) => {
  const { equipmentSummaries, loadComparison, records } = analysis;
  const summariesList = Object.values(equipmentSummaries);
  const chillerIds = Object.keys(equipmentSummaries);

  const [selectedLoadBin, setSelectedLoadBin] = useState<string>(
    loadComparison[1]?.loadBin || loadComparison[0]?.loadBin || ''
  );

  const activeBin = loadComparison.find(b => b.loadBin === selectedLoadBin) || loadComparison[0];

  // Chart data: kW/RT across different load bins for all chillers
  const kwPerRTChartData = loadComparison.map(bin => {
    const row: any = { loadBin: bin.loadBin.split(' ')[0] + ' RT' };
    chillerIds.forEach(id => {
      row[id] = bin.dataByChiller[id]?.avgKwPerRT || null;
    });
    return row;
  });

  // COP Chart data
  const copChartData = loadComparison.map(bin => {
    const row: any = { loadBin: bin.loadBin.split(' ')[0] + ' RT' };
    chillerIds.forEach(id => {
      row[id] = bin.dataByChiller[id]?.cop || null;
    });
    return row;
  });

  // Sort chillers by overall efficiency (COP descending)
  const rankedChillers = [...summariesList].sort((a, b) => b.copEstimate - a.copEstimate);
  const mostEfficientOverall = rankedChillers[0];
  const leastEfficientOverall = rankedChillers[rankedChillers.length - 1];

  return (
    <div className="space-y-6">
      {/* Top Banner: Overall Plant Efficiency & COP Summary */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-150">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                Thermodynamic Efficiency Benchmark
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Formula: COP = (Load [RT] × 3.517) / Energy [kW]
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">
              Chiller Energy Efficiency &amp; Head-to-Head Comparison
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Benchmarking chillers operating under matching thermal refrigeration tonnages reveals hidden machine degradation,
              tube fouling, and mechanical friction that simple total energy sums mask.
            </p>
          </div>

          {/* Quick Comparison Highlights */}
          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 shrink-0">
            <div>
              <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                Most Efficient Unit
              </div>
              <div className="text-lg font-bold text-emerald-600 flex items-center gap-1.5 mt-0.5">
                <Award className="w-5 h-5 text-emerald-500" />
                {mostEfficientOverall?.equipmentId}
              </div>
              <div className="text-xs text-slate-600 font-mono">
                COP: {mostEfficientOverall?.copEstimate} ({mostEfficientOverall?.avgKwPerRT} kW/RT)
              </div>
            </div>

            <div className="h-10 w-px bg-slate-300"></div>

            <div>
              <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                Degraded / High Energy Unit
              </div>
              <div className="text-lg font-bold text-rose-600 flex items-center gap-1.5 mt-0.5">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                {leastEfficientOverall?.equipmentId}
              </div>
              <div className="text-xs text-slate-600 font-mono">
                COP: {leastEfficientOverall?.copEstimate} ({leastEfficientOverall?.avgKwPerRT} kW/RT)
              </div>
            </div>
          </div>
        </div>

        {/* Chiller Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {summariesList.map(s => {
            const isBest = s.equipmentId === mostEfficientOverall?.equipmentId;
            const isWorst = s.equipmentId === leastEfficientOverall?.equipmentId;

            return (
              <div
                key={s.equipmentId}
                className={`p-4 rounded-xl border transition-all ${
                  isBest
                    ? 'bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-500/20'
                    : isWorst
                    ? 'bg-rose-50/40 border-rose-300 ring-1 ring-rose-500/20'
                    : 'bg-slate-50/60 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-slate-900">{s.equipmentId}</span>
                    {isBest && (
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        ★ TOP COP
                      </span>
                    )}
                    {isWorst && (
                      <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold">
                        ⚠ HIGH PENALTY
                      </span>
                    )}
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    s.healthScore >= 80 ? 'bg-emerald-100 text-emerald-800' : s.healthScore >= 65 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    Health: {s.healthScore}/100
                  </span>
                </div>

                {/* Main KPIs */}
                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-500 text-[11px]">Average COP:</span>
                    <div className="text-xl font-extrabold text-blue-600 font-mono mt-0.5">
                      {s.copEstimate}
                    </div>
                    <span className="text-[10px] text-slate-500">Rating: {s.efficiencyRating}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 text-[11px]">Specific Power:</span>
                    <div className="text-xl font-extrabold text-slate-900 font-mono mt-0.5">
                      {s.avgKwPerRT} <span className="text-[10px] font-sans font-normal text-slate-500">kW/RT</span>
                    </div>
                    <span className="text-[10px] text-slate-500">Lower is better</span>
                  </div>
                </div>

                {/* Additional operational details */}
                <div className="mt-3 pt-2.5 border-t border-slate-200 text-[11px] text-slate-600 space-y-1">
                  <div className="flex justify-between">
                    <span>Avg Energy per Hour:</span>
                    <strong className="font-mono text-slate-900">{s.avgEnergy} kWh</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Cooling Delivered:</span>
                    <strong className="font-mono text-slate-900">{s.avgLoad} RT</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Excess Energy Wasted:</span>
                    <strong className="font-mono text-rose-600">+{s.excessEnergyKWh.toLocaleString()} kWh</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Head-to-Head Benchmarking under Similar Load (The Core Hackathon Requirement) */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-150 gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              Head-to-Head Benchmarking Under Similar Thermal Load
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select a load operating band to directly compare performance when all units carry equivalent cooling demand
            </p>
          </div>

          {/* Load Bin Selector Pills */}
          <div className="flex items-center flex-wrap gap-1.5 text-xs">
            {loadComparison.map(bin => (
              <button
                key={bin.loadBin}
                onClick={() => setSelectedLoadBin(bin.loadBin)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  selectedLoadBin === bin.loadBin
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {bin.loadBin.split(' (')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Load Bin Deep Comparison Card */}
        {activeBin && (
          <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div>
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wider font-mono">
                  Operating Scenario: {activeBin.loadBin} (~{activeBin.loadRT} RT Average Load)
                </span>
                <p className="text-xs text-slate-600 mt-0.5">
                  Comparison below shows empirical energy consumed and efficiency delivered by each chiller under this specific load.
                </p>
              </div>

              {activeBin.potentialDeltaKWh > 0 && (
                <div className="text-right bg-white px-3.5 py-1.5 rounded-lg border border-slate-200">
                  <div className="text-[11px] text-slate-500">Inefficiency Penalty Gap:</div>
                  <div className="text-sm font-bold text-rose-600 font-mono">
                    +{activeBin.potentialDeltaKWh} kWh/hr ({leastEfficientOverall?.equipmentId} vs {mostEfficientOverall?.equipmentId})
                  </div>
                </div>
              )}
            </div>

            {/* Table of Chillers for this Bin */}
            <div className="overflow-x-auto mt-3">
              <table className="min-w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                    <th className="py-2 px-3 font-semibold">Chiller Unit</th>
                    <th className="py-2 px-3 font-semibold">Energy Consumption</th>
                    <th className="py-2 px-3 font-semibold">Specific Power (kW/RT)</th>
                    <th className="py-2 px-3 font-semibold">Thermodynamic COP</th>
                    <th className="py-2 px-3 font-semibold">Observations Count</th>
                    <th className="py-2 px-3 font-semibold">Comparative Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {chillerIds.map(id => {
                    const data = activeBin.dataByChiller[id];
                    const isBestInBin = activeBin.mostEfficientChiller === id;
                    const isWorstInBin = activeBin.leastEfficientChiller === id;

                    if (!data || data.sampleCount === 0) {
                      return (
                        <tr key={id} className="text-slate-400">
                          <td className="py-2.5 px-3 font-bold">{id}</td>
                          <td className="py-2.5 px-3" colSpan={5}>No operational records in this load bracket</td>
                        </tr>
                      );
                    }

                    return (
                      <tr
                        key={id}
                        className={`hover:bg-white transition-colors ${
                          isBestInBin ? 'bg-emerald-50/50' : isWorstInBin ? 'bg-rose-50/50' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3 font-bold text-slate-900 flex items-center gap-1.5">
                          {id}
                          {isBestInBin && <span className="text-[10px] text-emerald-600 font-semibold">(Best)</span>}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                          {data.avgEnergy} kWh
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-600">
                          {data.avgKwPerRT} kW/RT
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-emerald-600">
                          {data.cop}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 font-mono">
                          {data.sampleCount} intervals
                        </td>
                        <td className="py-2.5 px-3">
                          {isBestInBin ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              OPTIMAL CHOICE
                            </span>
                          ) : isWorstInBin ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                              +{(((data.avgEnergy - activeBin.dataByChiller[activeBin.mostEfficientChiller].avgEnergy) / Math.max(1, activeBin.dataByChiller[activeBin.mostEfficientChiller].avgEnergy)) * 100).toFixed(1)}% MORE ENERGY
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                              NOMINAL
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Direct Action Callout */}
            <div className="mt-3 pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-700 gap-2">
              <div>
                <strong>Operational Strategy:</strong> Under ~{activeBin.loadRT} RT cooling demand, always stage{' '}
                <strong className="text-emerald-700">{activeBin.mostEfficientChiller}</strong> first before loading{' '}
                <strong className="text-rose-700">{activeBin.leastEfficientChiller}</strong> to prevent unnecessary energy waste.
              </div>
              {onNavigateToSimulation && (
                <button
                  onClick={onNavigateToSimulation}
                  className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1 text-xs shrink-0 cursor-pointer shadow-xs"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  Simulate This Load
                </button>
              )}
            </div>
          </div>
        )}

        {/* Charts: Specific Energy Consumption (kW/RT) Curves */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 pt-6 border-t border-slate-150">
          {/* kW/RT Comparison Chart */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500" />
                Specific Power vs. Load (kW/RT) — Lower is Better
              </h4>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={kwPerRTChartData} margin={{ top: 10, right: 20, left: -10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="loadBin" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} domain={[0.5, 1.1]} unit=" kW/RT" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Line type="monotone" dataKey={chillerIds[0] || 'CH-01'} stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey={chillerIds[1] || 'CH-02'} stroke="#e11d48" strokeWidth={2} dot={{ r: 3 }} />
                  {chillerIds[2] && (
                    <Line type="monotone" dataKey={chillerIds[2]} stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* COP Comparison Chart */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-500" />
                Coefficient of Performance (COP) — Higher is Better
              </h4>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={copChartData} margin={{ top: 10, right: 20, left: -10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="loadBin" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} domain={[2.5, 6.0]} unit=" COP" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey={chillerIds[0] || 'CH-01'} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey={chillerIds[1] || 'CH-02'} fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  {chillerIds[2] && (
                    <Bar dataKey={chillerIds[2]} fill="#10b981" radius={[4, 4, 0, 0]} />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
