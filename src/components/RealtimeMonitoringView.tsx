import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  Flame,
  Thermometer,
  Gauge,
  Droplets,
  Zap,
  Play,
  Pause,
  SkipForward,
  CheckCircle2,
  AlertOctagon,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  RefreshCw,
  Search,
  Filter,
  Layers,
  ChevronRight,
  Sliders,
  DollarSign
} from 'lucide-react';
import { AnalysisResult, ProcessedRecord, SystemAlert } from '../types';

interface RealtimeMonitoringViewProps {
  analysis: AnalysisResult;
  onInspectAnomaly: (record: ProcessedRecord) => void;
  onNavigateToSimulation?: () => void;
}

export const RealtimeMonitoringView: React.FC<RealtimeMonitoringViewProps> = ({
  analysis,
  onInspectAnomaly,
  onNavigateToSimulation
}) => {
  const { records, equipmentSummaries, systemAlerts } = analysis;

  // Real-time playback / tick simulator
  const [currentIndex, setCurrentIndex] = useState<number>(() => Math.max(0, records.length - 1));
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1); // 1x, 2x, 5x
  const [alertFilter, setAlertFilter] = useState<'ALL' | 'HIGH_ENERGY' | 'ABNORMAL_TEMP' | 'SENSOR_MISSING'>('ALL');

  useEffect(() => {
    if (!isPlaying || records.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => {
        if (prev >= records.length - 1) {
          return 0; // loop back or pause
        }
        return prev + 1;
      });
    }, 1800 / playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, records.length]);

  const currentRecord = records[currentIndex] || records[records.length - 1];

  // Group latest status per chiller up to current index
  const chillerIds = Object.keys(equipmentSummaries);
  const latestByChiller: Record<string, ProcessedRecord> = {};

  // Look backwards from currentIndex to find the latest record for each chiller
  for (let i = currentIndex; i >= 0; i--) {
    const r = records[i];
    if (r && !latestByChiller[r.equipment_id]) {
      latestByChiller[r.equipment_id] = r;
      if (Object.keys(latestByChiller).length === chillerIds.length) break;
    }
  }

  // Fallback if some chillers don't appear prior to currentIndex
  chillerIds.forEach(id => {
    if (!latestByChiller[id]) {
      latestByChiller[id] = records.find(r => r.equipment_id === id) || currentRecord;
    }
  });

  // Calculate live plant aggregates
  const activeChillerList = Object.values(latestByChiller);
  const plantTotalEnergy = activeChillerList.reduce((s, r) => s + (r?.actualEnergy || 0), 0);
  const plantTotalExpected = activeChillerList.reduce((s, r) => s + (r?.expectedEnergy || 0), 0);
  const plantTotalLoad = activeChillerList.reduce((s, r) => s + (r?.buildingLoad || 0), 0);
  const plantCop = plantTotalEnergy > 0 ? (plantTotalLoad * 3.517) / plantTotalEnergy : 4.8;
  const plantKwPerRT = plantTotalLoad > 0 ? plantTotalEnergy / plantTotalLoad : 0.73;

  // Filter alerts
  const filteredAlerts = systemAlerts.filter(a => {
    if (alertFilter === 'ALL') return true;
    return a.category === alertFilter;
  });

  const highEnergyCount = systemAlerts.filter(a => a.category === 'HIGH_ENERGY').length;
  const abnormalTempCount = systemAlerts.filter(a => a.category === 'ABNORMAL_TEMP').length;
  const sensorMissingCount = systemAlerts.filter(a => a.category === 'SENSOR_MISSING').length;

  return (
    <div className="space-y-6">
      {/* Real-time Telemetry Stream Header & Playback Controller */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 text-white shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isPlaying ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${isPlaying ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              </div>
              <h2 className="text-lg font-bold tracking-wide text-slate-100 flex items-center gap-2">
                Real-Time Telemetry &amp; Live Monitoring
              </h2>
              <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700">
                Live SCADA Simulator
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Observation Interval:{' '}
              <strong className="text-slate-200 font-mono">
                {currentRecord?.timestamp || 'Synchronizing...'}
              </strong>{' '}
              <span className="text-slate-600">•</span> Record #{currentIndex + 1} of {records.length}
            </p>
          </div>

          {/* Interactive Playback Controller */}
          <div className="flex items-center gap-2 bg-slate-950/80 p-2 rounded-lg border border-slate-800">
            <button
              id="btn-play-pause"
              onClick={() => setIsPlaying(!isPlaying)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                isPlaying
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              {isPlaying ? 'Pause Live Stream' : 'Play Live Stream'}
            </button>

            <button
              id="btn-step-forward"
              onClick={() => setCurrentIndex(prev => Math.min(records.length - 1, prev + 1))}
              disabled={isPlaying}
              className="px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 transition-colors disabled:opacity-40 cursor-pointer"
              title="Advance to next historical interval"
            >
              <SkipForward className="w-3.5 h-3.5" />
              Step
            </button>

            {/* Playback speed pills */}
            <div className="flex items-center bg-slate-900 rounded border border-slate-800 p-0.5 text-[11px]">
              {[1, 2, 5].map(speed => (
                <button
                  key={speed}
                  onClick={() => setPlaybackSpeed(speed)}
                  className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                    playbackSpeed === speed
                      ? 'bg-blue-600 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>

            <button
              id="btn-jump-latest"
              onClick={() => setCurrentIndex(records.length - 1)}
              className="px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
              title="Jump to latest operational timestamp"
            >
              Jump to Latest
            </button>
          </div>
        </div>

        {/* Live Plant Aggregates Ribbon */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800/80">
          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              Live Total Power
            </div>
            <div className="text-xl font-bold text-white mt-0.5 flex items-baseline gap-1.5 font-mono">
              {plantTotalEnergy.toFixed(1)} <span className="text-xs text-slate-400 font-sans">kW</span>
              <span className={`text-xs ${plantTotalEnergy > plantTotalExpected ? 'text-rose-400' : 'text-emerald-400'}`}>
                ({plantTotalEnergy > plantTotalExpected ? '+' : ''}{(plantTotalEnergy - plantTotalExpected).toFixed(1)} kW vs ML)
              </span>
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              Plant Cooling Load
            </div>
            <div className="text-xl font-bold text-white mt-0.5 flex items-baseline gap-1.5 font-mono">
              {plantTotalLoad.toFixed(0)} <span className="text-xs text-slate-400 font-sans">RT</span>
              <span className="text-xs text-slate-400 font-sans">
                ({(plantTotalLoad * 3.517).toFixed(0)} kW thermal)
              </span>
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              Instantaneous Plant COP
            </div>
            <div className="text-xl font-bold text-emerald-400 mt-0.5 flex items-baseline gap-1.5 font-mono">
              {plantCop.toFixed(2)}
              <span className="text-xs text-slate-400 font-sans">
                ({plantKwPerRT.toFixed(3)} kW/RT)
              </span>
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              Ambient Weather Condition
            </div>
            <div className="text-sm font-bold text-slate-200 mt-1 font-mono">
              {currentRecord?.outsideTemp}°F DB <span className="text-slate-500">•</span> {currentRecord?.humidity}% RH
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Dew Point: {currentRecord?.dewPoint}°F | {currentRecord?.windSpeed} mph
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Telemetry Cards per Chiller */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <Gauge className="w-4 h-4 text-blue-600" />
            Live Chiller Telemetry &amp; Operational Status
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            3-Chiller Parallel Hydronic Plant
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {chillerIds.map(eqId => {
            const r = latestByChiller[eqId];
            if (!r) return null;

            const summary = equipmentSummaries[eqId];
            const isWarning = r.severity === 'WARNING';
            const isCritical = r.severity === 'CRITICAL';
            const isWatch = r.severity === 'WATCH';

            let statusBadge = (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> NOMINAL
              </span>
            );

            if (isCritical) {
              statusBadge = (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1 animate-pulse">
                  <AlertOctagon className="w-3 h-3" /> CRITICAL
                </span>
              );
            } else if (isWarning) {
              statusBadge = (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> WARNING
                </span>
              );
            } else if (isWatch) {
              statusBadge = (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-1">
                  <Activity className="w-3 h-3" /> WATCH
                </span>
              );
            }

            const isHighDeviation = r.deviationPercent >= 15;

            return (
              <div
                key={eqId}
                className={`bg-white rounded-xl border p-4.5 shadow-xs transition-all ${
                  isCritical
                    ? 'border-rose-300 ring-2 ring-rose-500/20'
                    : isWarning
                    ? 'border-amber-300 ring-2 ring-amber-500/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Chiller Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                      isCritical ? 'bg-rose-100 text-rose-700' : isWarning ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {eqId.replace('CHILLER-', 'CH-').replace('CH-', 'CH')}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{eqId}</h4>
                      <p className="text-[11px] text-slate-500">Centrifugal Water-Cooled</p>
                    </div>
                  </div>
                  {statusBadge}
                </div>

                {/* Live Gauges Grid */}
                <div className="grid grid-cols-2 gap-2.5 my-3.5 text-xs">
                  {/* Energy Consumption */}
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                    <div className="flex items-center justify-between text-slate-500 text-[11px]">
                      <span className="flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 text-amber-500" /> Power
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">Exp: {r.expectedEnergy}</span>
                    </div>
                    <div className="text-lg font-bold text-slate-900 mt-1 font-mono">
                      {r.actualEnergy} <span className="text-[10px] font-sans text-slate-500">kWh</span>
                    </div>
                    <div className={`text-[11px] font-medium flex items-center gap-0.5 mt-0.5 ${
                      r.deviationPercent > 0 ? 'text-rose-600' : 'text-emerald-600'
                    }`}>
                      {r.deviationPercent > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {r.deviationPercent > 0 ? '+' : ''}{r.deviationPercent}% vs ML normal
                    </div>
                  </div>

                  {/* Efficiency / COP */}
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                    <div className="flex items-center justify-between text-slate-500 text-[11px]">
                      <span className="flex items-center gap-1">
                        <Activity className="w-3.5 h-3.5 text-blue-500" /> Efficiency
                      </span>
                      <span className="text-[10px] font-semibold text-slate-600">{r.cop >= 4.8 ? 'High COP' : 'Sub-optimal'}</span>
                    </div>
                    <div className="text-lg font-bold text-blue-600 mt-1 font-mono">
                      {r.cop} <span className="text-[10px] font-sans text-slate-500">COP</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      {r.kwPerRT} kW/RT
                    </div>
                  </div>

                  {/* Building Load */}
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                    <div className="text-slate-500 text-[11px] flex items-center gap-1">
                      <Gauge className="w-3.5 h-3.5 text-indigo-500" /> Building Load
                    </div>
                    <div className="text-lg font-bold text-slate-900 mt-1 font-mono">
                      {r.buildingLoad} <span className="text-[10px] font-sans text-slate-500">RT</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Thermal: {(r.buildingLoad * 3.517).toFixed(0)} kW
                    </div>
                  </div>

                  {/* Cooling Water Temperature */}
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                    <div className="text-slate-500 text-[11px] flex items-center gap-1">
                      <Thermometer className={`w-3.5 h-3.5 ${r.coolingWaterTemp > 31 ? 'text-rose-500' : 'text-emerald-500'}`} />
                      Cooling Water
                    </div>
                    <div className="text-lg font-bold text-slate-900 mt-1 font-mono">
                      {r.coolingWaterTemp}° <span className="text-[10px] font-sans text-slate-500">C</span>
                    </div>
                    <div className={`text-[11px] mt-0.5 ${r.coolingWaterTemp > 30 ? 'text-amber-600 font-semibold' : 'text-slate-500'}`}>
                      {r.coolingWaterTemp > 30 ? 'Elevated Lift' : 'Nominal Head'}
                    </div>
                  </div>
                </div>

                {/* Chilled Water Flow Rate bar */}
                <div className="pt-2 border-t border-slate-150">
                  <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1">
                    <span className="flex items-center gap-1 text-slate-500">
                      <Droplets className="w-3 h-3 text-cyan-600" /> Chilled Water Flow
                    </span>
                    <span className="font-mono font-bold text-slate-900">{r.chilledWaterRate} L/sec</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 rounded-full"
                      style={{ width: `${Math.min(100, (r.chilledWaterRate / 180) * 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => onInspectAnomaly(r)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                  >
                    Inspect Diagnosis <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <span className="text-[11px] font-mono text-slate-500">
                    Health: <strong className={summary?.healthScore >= 80 ? 'text-emerald-600' : summary?.healthScore >= 65 ? 'text-amber-600' : 'text-rose-600'}>{summary?.healthScore}/100</strong>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Visual Alerts Feed Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Automated Anomaly &amp; Diagnostic Alerts
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live AI rule engine categorizing energy surges, thermal condenser elevation, and sensor anomalies
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center flex-wrap gap-1.5 text-xs">
            <button
              onClick={() => setAlertFilter('ALL')}
              className={`px-3 py-1 rounded-full font-medium transition-colors cursor-pointer ${
                alertFilter === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Alerts ({systemAlerts.length})
            </button>

            <button
              onClick={() => setAlertFilter('HIGH_ENERGY')}
              className={`px-3 py-1 rounded-full font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                alertFilter === 'HIGH_ENERGY'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              🔴 High Energy ({highEnergyCount})
            </button>

            <button
              onClick={() => setAlertFilter('ABNORMAL_TEMP')}
              className={`px-3 py-1 rounded-full font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                alertFilter === 'ABNORMAL_TEMP'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              🟠 Abnormal Temp ({abnormalTempCount})
            </button>

            <button
              onClick={() => setAlertFilter('SENSOR_MISSING')}
              className={`px-3 py-1 rounded-full font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                alertFilter === 'SENSOR_MISSING'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-yellow-50 text-yellow-800 hover:bg-yellow-100 border border-yellow-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
              🟡 Sensor Anomaly ({sensorMissingCount})
            </button>
          </div>
        </div>

        {/* Alerts List */}
        <div className="divide-y divide-slate-100 mt-2 max-h-[480px] overflow-y-auto">
          {filteredAlerts.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              No active alerts matching this filter criteria. System parameters operating within normal baseline bounds.
            </div>
          ) : (
            filteredAlerts.map(alert => {
              const isHigh = alert.category === 'HIGH_ENERGY';
              const isTemp = alert.category === 'ABNORMAL_TEMP';
              const isSensor = alert.category === 'SENSOR_MISSING';

              return (
                <div key={alert.id} className="py-3.5 px-2 hover:bg-slate-50/80 rounded-lg transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 w-7 h-7 rounded-lg shrink-0 flex items-center justify-center ${
                      isHigh ? 'bg-rose-100 text-rose-600' : isTemp ? 'bg-amber-100 text-amber-600' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {isHigh ? <Zap className="w-4 h-4" /> : isTemp ? <Thermometer className="w-4 h-4" /> : <Gauge className="w-4 h-4" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{alert.title}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                          {alert.equipmentId}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {alert.timestamp}
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 mt-1 font-medium">
                        {alert.message}
                      </p>

                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500">
                        <span>Observed: <strong className="text-slate-800 font-mono">{alert.metricValue}</strong></span>
                        <span>•</span>
                        <span>Baseline: <strong className="text-slate-800 font-mono">{alert.thresholdOrExpected}</strong></span>
                        {alert.rupeeImpactPerHour > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-rose-600 font-semibold font-mono">
                              +₹{alert.rupeeImpactPerHour}/hr loss
                            </span>
                          </>
                        )}
                      </div>

                      {/* Suggested Action Box */}
                      <div className="mt-2 text-xs bg-slate-100/90 px-3 py-1.5 rounded-md border border-slate-200 text-slate-800 flex items-center gap-2">
                        <span className="font-bold text-blue-700 text-[11px] uppercase tracking-wider shrink-0">Action Directive:</span>
                        <span>{alert.suggestedAction}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex md:flex-col items-center md:items-end gap-2 shrink-0">
                    <button
                      onClick={() => {
                        const rec = records.find(r => r.timestamp === alert.timestamp && r.equipment_id === alert.equipmentId);
                        if (rec) onInspectAnomaly(rec);
                      }}
                      className="px-3 py-1.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      Investigate ML Evidence
                    </button>
                    {onNavigateToSimulation && (
                      <button
                        onClick={onNavigateToSimulation}
                        className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        Simulate Fix
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
