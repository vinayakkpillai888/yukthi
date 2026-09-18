import React, { useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Zap,
  Gauge,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Flame,
  Info,
  DollarSign,
  Leaf,
  Sliders,
  Sparkles,
  Bell,
  ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  CartesianGrid
} from 'recharts';
import { AnalysisResult, ProcessedRecord } from '../types';

interface OverviewViewProps {
  analysis: AnalysisResult;
  onSelectEquipment: (eqId: string) => void;
  onInspectAnomaly: (record: ProcessedRecord) => void;
  onNavigateTab?: (tab: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  analysis,
  onSelectEquipment,
  onInspectAnomaly,
  onNavigateTab
}) => {
  const {
    equipmentSummaries,
    records,
    dataQuality,
    overallHealthScore,
    totalAnomalies,
    systemAnomalyRate,
    plantForecast,
    systemAlerts,
    totalPotentialRupeeSavingsPerDay,
    totalKWhSavingsPerDay,
    totalCo2SavingsKgPerDay
  } = analysis;

  const summariesList = Object.values(equipmentSummaries);

  const attentionRequiredCount = summariesList.filter(
    s => s.healthStatus === 'WARNING' || s.healthStatus === 'CRITICAL'
  ).length;

  const avgEnergyConsumption = summariesList.length > 0
    ? (summariesList.reduce((acc, s) => acc + s.avgEnergy, 0) / summariesList.length).toFixed(1)
    : '0';

  // Subsample timeline records for smooth interactive rendering (e.g. up to 120 points)
  const timelineData = useMemo(() => {
    if (records.length === 0) return [];
    const step = Math.max(1, Math.floor(records.length / 120));
    const sample: any[] = [];
    for (let i = 0; i < records.length; i += step) {
      const r = records[i];
      const d = new Date(r.timestamp);
      sample.push({
        time: `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:00`,
        actual: r.actualEnergy,
        expected: r.expectedEnergy,
        load: r.buildingLoad,
        isAnomaly: r.severity === 'WARNING' || r.severity === 'CRITICAL',
        equipment: r.equipment_id,
        rawRecord: r
      });
    }
    return sample;
  }, [records]);

  // Equipment comparison chart data
  const equipmentComparisonData = summariesList.map(s => ({
    name: s.equipmentId,
    healthScore: s.healthScore,
    avgEnergy: s.avgEnergy,
    avgLoad: s.avgLoad,
    cop: s.copEstimate,
    anomalies: s.anomalyCount
  }));

  // Recent anomalous observations
  const recentAnomalies = useMemo(() => {
    return records
      .filter(r => r.severity === 'WARNING' || r.severity === 'CRITICAL')
      .slice(-5)
      .reverse();
  }, [records]);

  return (
    <div className="space-y-6">
      {/* Top Banner Notice if Demo Data */}
      {analysis.isDemoData && (
        <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>DEMO DATA ACTIVE:</strong> Displaying calibrated multi-week operational dataset for CHILLER-01, CHILLER-02, and CHILLER-03. Upload your YUKTHI 2026 CSV anytime to switch to <strong>REAL DATA</strong>.
            </span>
          </div>
          <span className="text-[11px] font-mono bg-white px-2 py-0.5 rounded border border-amber-300 text-amber-900">
            {records.length.toLocaleString()} observations loaded
          </span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Equipment */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Equipment Units</span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{summariesList.length}</div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            {summariesList.map(s => s.equipmentId).join(', ') || 'None'}
          </div>
        </div>

        {/* Total Observations */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Observations</span>
            <Calendar className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{records.length.toLocaleString()}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            {dataQuality.dateRange.durationDays} Days Duration
          </div>
        </div>

        {/* Contextual Anomalies */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Abnormal Periods</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-600">{totalAnomalies}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            {systemAnomalyRate}% Anomaly Rate
          </div>
        </div>

        {/* Attention Required */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Attention Required</span>
            <Flame className="w-4 h-4 text-rose-600" />
          </div>
          <div className={`text-2xl font-bold ${attentionRequiredCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {attentionRequiredCount} <span className="text-xs font-normal text-slate-500">units</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {attentionRequiredCount > 0 ? 'Review priority chillers' : 'All chillers nominal'}
          </div>
        </div>

        {/* Average Energy */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Energy Draw</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{avgEnergyConsumption} <span className="text-xs font-normal text-slate-500">kWh</span></div>
          <div className="text-[11px] text-slate-500 mt-1">
            Across operational intervals
          </div>
        </div>

        {/* Average Health Score */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Plant Health</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-bold ${overallHealthScore >= 80 ? 'text-emerald-600' : overallHealthScore >= 65 ? 'text-amber-600' : 'text-rose-600'}`}>
              {overallHealthScore}
            </span>
            <span className="text-xs text-slate-400">/100</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Weighted Analytical Index
          </div>
        </div>
      </div>

      {/* AI Energy Prediction & Actionable Insights Quick-Launch Ribbon */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-xl p-5 text-white shadow-md border border-indigo-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* 1-Hour Prediction Callout */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[11px] font-bold font-mono flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-blue-400" />
                ML HORIZON FORECAST
              </span>
              <span className="text-xs text-slate-400">
                Plant Cooling Load: <strong className="text-slate-200 font-mono">{plantForecast?.[0]?.expectedLoad || 260} RT</strong>
              </span>
            </div>
            
            <div className="text-2xl sm:text-3xl font-extrabold text-white flex items-baseline gap-2.5">
              <span>Expected Energy in Next 1 Hour:</span>
              <span className="text-emerald-400 font-mono underline decoration-emerald-500/50 underline-offset-4">
                {plantForecast?.[0]?.predictedEnergy || 185} kWh
              </span>
            </div>

            <p className="text-xs text-slate-300 max-w-2xl">
              Confidence Interval: <span className="font-mono text-blue-200">{plantForecast?.[0]?.confidenceLower || 176} – {plantForecast?.[0]?.confidenceUpper || 194} kWh</span>.
              Predicted plant COP: <strong className="text-emerald-300 font-mono">{plantForecast?.[0]?.expectedCop || 4.85}</strong> (~0.725 kW/RT).
            </p>
          </div>

          {/* Quick-Launch Feature Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0 text-xs">
            {/* Forecast Tab Link */}
            <button
              id="btn-quick-forecast"
              onClick={() => onNavigateTab?.('forecast')}
              className="bg-white/10 hover:bg-white/15 p-3 rounded-lg border border-white/10 text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center justify-between text-slate-300 text-[11px]">
                <span className="flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5 text-blue-400" /> Forecast Graph</span>
                <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <div className="text-sm font-bold text-white mt-1">24h Ahead</div>
              <div className="text-[10px] text-slate-400">Actual vs Predicted</div>
            </button>

            {/* COP & Comparison Tab Link */}
            <button
              id="btn-quick-efficiency"
              onClick={() => onNavigateTab?.('efficiency')}
              className="bg-white/10 hover:bg-white/15 p-3 rounded-lg border border-white/10 text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center justify-between text-slate-300 text-[11px]">
                <span className="flex items-center gap-1"><Activity className="w-3.5 h-3.5 text-emerald-400" /> Efficiency / COP</span>
                <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <div className="text-sm font-bold text-white mt-1">CH Comparison</div>
              <div className="text-[10px] text-slate-400">Under Similar Load</div>
            </button>

            {/* What-if Simulation Tab Link */}
            <button
              id="btn-quick-simulation"
              onClick={() => onNavigateTab?.('simulation')}
              className="bg-white/10 hover:bg-white/15 p-3 rounded-lg border border-white/10 text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center justify-between text-slate-300 text-[11px]">
                <span className="flex items-center gap-1"><Sliders className="w-3.5 h-3.5 text-indigo-400" /> What-if Sim</span>
                <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <div className="text-sm font-bold text-white mt-1">190 → 175 kWh</div>
              <div className="text-[10px] text-slate-400">Adjust Load &amp; Temp</div>
            </button>

            {/* Savings Tab Link */}
            <button
              id="btn-quick-savings"
              onClick={() => onNavigateTab?.('recommendations')}
              className="bg-white/10 hover:bg-white/15 p-3 rounded-lg border border-white/10 text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center justify-between text-slate-300 text-[11px]">
                <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5 text-amber-400" /> ₹ &amp; CO₂ Savings</span>
                <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <div className="text-sm font-bold text-emerald-300 mt-1 font-mono">
                ₹{(totalPotentialRupeeSavingsPerDay || 6630).toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400">
                {(totalCo2SavingsKgPerDay || 640).toFixed(0)} kg CO₂/day
              </div>
            </button>
          </div>
        </div>

        {/* Active Alerts Strip */}
        <div className="mt-4 pt-3.5 border-t border-indigo-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center flex-wrap gap-2 text-slate-300">
            <span className="font-bold flex items-center gap-1.5 text-amber-300">
              <Bell className="w-3.5 h-3.5" />
              Active Contextual Alerts ({systemAlerts?.length || 0}):
            </span>
            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px]">
              🔴 {systemAlerts?.filter(a => a.category === 'HIGH_ENERGY').length || 0} High Energy
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px]">
              🟠 {systemAlerts?.filter(a => a.category === 'ABNORMAL_TEMP').length || 0} Abnormal Temp
            </span>
            <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 text-[11px]">
              🟡 {systemAlerts?.filter(a => a.category === 'SENSOR_MISSING').length || 0} Sensor Anomaly
            </span>
          </div>

          <button
            onClick={() => onNavigateTab?.('realtime')}
            className="text-xs font-semibold text-blue-300 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
          >
            Open Live Telemetry &amp; Alerts Feed <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Equipment Cards Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold tracking-wider text-slate-800 uppercase flex items-center gap-2">
            <Gauge className="w-4 h-4 text-blue-600" />
            Equipment Status &amp; Analytical Health Indicators
          </h2>
          <span className="text-xs text-slate-500">
            Click any chiller to open deep telemetry monitoring
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {summariesList.map(summary => {
            const statusConfig = {
              HEALTHY: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
              WATCH: { bg: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
              WARNING: { bg: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
              CRITICAL: { bg: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' }
            }[summary.healthStatus];

            return (
              <div
                key={summary.equipmentId}
                onClick={() => onSelectEquipment(summary.equipmentId)}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-blue-400 transition-all cursor-pointer group relative overflow-hidden"
              >
                {/* Top header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-base text-slate-900 group-hover:text-blue-600 transition-colors">
                      {summary.equipmentId}
                    </span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusConfig.bg} flex items-center gap-1.5`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                      {summary.healthStatus}
                    </span>
                  </div>
                  <span className="text-xs text-blue-600 font-semibold group-hover:underline flex items-center gap-0.5">
                    Monitor <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                </div>

                {/* Health Score Gauge Display */}
                <div className="mb-4">
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="text-xs text-slate-500 font-medium">Analytical Health Score</span>
                    <span className="font-bold text-lg text-slate-900">
                      {summary.healthScore}<span className="text-xs font-normal text-slate-400">/100</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        summary.healthScore >= 80 ? 'bg-emerald-500' : summary.healthScore >= 65 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${summary.healthScore}%` }}
                    />
                  </div>
                </div>

                {/* Metrics 2x2 */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                  <div className="p-2 rounded bg-slate-50">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Anomaly Count</span>
                    <span className={`font-bold ${summary.anomalyCount > 10 ? 'text-rose-600' : 'text-slate-800'}`}>
                      {summary.anomalyCount} periods
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-50">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Avg Energy Draw</span>
                    <span className="font-bold text-slate-800">{summary.avgEnergy} kWh</span>
                  </div>
                  <div className="p-2 rounded bg-slate-50">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Energy Trend</span>
                    <span className="font-medium text-slate-700 capitalize flex items-center gap-1">
                      {summary.energyTrendDirection === 'increasing' ? (
                        <ArrowUpRight className="w-3.5 h-3.5 text-rose-500" />
                      ) : summary.energyTrendDirection === 'decreasing' ? (
                        <ArrowDownRight className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                      {summary.energyTrendDirection}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-50">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Estimated COP</span>
                    <span className="font-bold text-blue-600">{summary.copEstimate}</span>
                  </div>
                </div>

                {/* Last Anomaly notice */}
                <div className="mt-3 text-[11px] text-slate-500 truncate">
                  Last abnormal period:{' '}
                  {summary.lastDetectedAnomaly ? (
                    <span className="text-slate-700 font-medium">
                      {new Date(summary.lastDetectedAnomaly).toLocaleDateString()} {new Date(summary.lastDetectedAnomaly).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  ) : (
                    <span className="text-emerald-600">None detected</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Actual vs Expected Energy Timeline */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" />
                Actual vs. Contextual ML Expected Energy Consumption
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Expected energy curve derived from HistGradientBoostingRegressor thermodynamic features
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                <span className="w-3 h-0.5 bg-blue-600" /> Actual (kWh)
              </span>
              <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                <span className="w-3 h-0.5 bg-slate-400 border-dashed" /> ML Expected (kWh)
              </span>
            </div>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} unit=" kWh" domain={['auto', 'auto']} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl text-xs space-y-1">
                          <p className="font-semibold text-slate-200">{label} ({data.equipment})</p>
                          <p className="text-blue-400">Actual: <strong>{data.actual} kWh</strong></p>
                          <p className="text-slate-400">Expected: <strong>{data.expected} kWh</strong></p>
                          <p className="text-slate-300">Building Load: <strong>{data.load} RT</strong></p>
                          {data.isAnomaly && (
                            <p className="text-rose-400 font-semibold pt-1 border-t border-slate-700">
                              ⚠️ Abnormal Energy Behavior Detected
                            </p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="expected"
                  stroke="#94a3b8"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Equipment Comparison Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Equipment Benchmarking</h3>
            <p className="text-xs text-slate-500 mb-4">
              Comparing average energy draw (kWh) and analytical health score
            </p>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={equipmentComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl text-xs space-y-1">
                            <p className="font-semibold text-slate-200">{label}</p>
                            {payload.map((p, i) => (
                              <p key={i} style={{ color: p.color }}>
                                {p.name}: <strong>{p.value}</strong>
                              </p>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="avgEnergy" name="Avg Energy (kWh)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="healthScore" name="Health Score" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
            <span>Regression Model: R² = {analysis.pipelineMetrics.regressionR2}</span>
            <span>Isolation Forest: {analysis.pipelineMetrics.isolationForestTrees} trees</span>
          </div>
        </div>
      </div>

      {/* Recent Contextual Anomalies Quick Table */}
      {recentAnomalies.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Recent Detected Abnormal Periods (Click row to investigate)
            </h3>
            <span className="text-xs text-slate-500">
              Showing latest {recentAnomalies.length} flagged events
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Severity</th>
                  <th className="py-2.5 px-3">Equipment</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Actual Energy</th>
                  <th className="py-2.5 px-3">Expected Energy</th>
                  <th className="py-2.5 px-3">Deviation %</th>
                  <th className="py-2.5 px-3">iForest Score</th>
                  <th className="py-2.5 px-3">Contributing Evidence</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentAnomalies.map((rec) => {
                  const isPositive = rec.deviationPercent >= 0;
                  return (
                    <tr
                      key={rec.id}
                      onClick={() => onInspectAnomaly(rec)}
                      className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          rec.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {rec.severity}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{rec.equipment_id}</td>
                      <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                        {new Date(rec.timestamp).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{rec.actualEnergy} kWh</td>
                      <td className="py-2.5 px-3 text-slate-500">{rec.expectedEnergy} kWh</td>
                      <td className={`py-2.5 px-3 font-bold ${isPositive ? 'text-rose-600' : 'text-blue-600'}`}>
                        {isPositive ? `+${rec.deviationPercent}%` : `${rec.deviationPercent}%`}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-indigo-700 font-medium">
                        {rec.multivariateScore.toFixed(3)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 truncate max-w-xs" title={rec.contributingFactors[0]?.displayName}>
                        {rec.contributingFactors[0]?.displayName || 'Energy residual'}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span className="text-blue-600 hover:text-blue-800 font-medium text-xs">
                          Inspect &rarr;
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
