import React from 'react';
import {
  X,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Activity,
  HelpCircle,
  Wrench,
  Gauge,
  Thermometer,
  Zap,
  Clock,
  ShieldAlert
} from 'lucide-react';
import { ProcessedRecord } from '../types';

interface AnomalyDetailModalProps {
  record: ProcessedRecord | null;
  onClose: () => void;
}

export const AnomalyDetailModal: React.FC<AnomalyDetailModalProps> = ({
  record,
  onClose
}) => {
  if (!record) return null;

  const severityColors = {
    CRITICAL: 'bg-rose-50 border-rose-200 text-rose-700',
    WARNING: 'bg-amber-50 border-amber-200 text-amber-700',
    WATCH: 'bg-blue-50 border-blue-200 text-blue-700',
    NORMAL: 'bg-emerald-50 border-emerald-200 text-emerald-700'
  };

  const severityBadges = {
    CRITICAL: 'bg-rose-600 text-white',
    WARNING: 'bg-amber-500 text-white',
    WATCH: 'bg-blue-600 text-white',
    NORMAL: 'bg-emerald-600 text-white'
  };

  const isDeviationPositive = record.deviationPercent >= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-1 rounded text-xs font-bold tracking-wider uppercase ${severityBadges[record.severity]}`}>
              {record.severity}
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Contextual Anomaly Investigation: <span className="text-blue-600">{record.equipment_id}</span>
              </h3>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5 font-mono">
                <Clock className="w-3.5 h-3.5" />
                {new Date(record.timestamp).toLocaleString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-medium text-slate-500 block uppercase">Actual Energy</span>
              <span className="text-lg font-bold text-slate-900">{record.actualEnergy} <span className="text-xs font-normal text-slate-500">kWh</span></span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-medium text-slate-500 block uppercase">Expected Energy</span>
              <span className="text-lg font-bold text-slate-600">{record.expectedEnergy} <span className="text-xs font-normal text-slate-500">kWh</span></span>
            </div>
            <div className={`p-3 rounded-lg border ${record.deviationPercent > 15 ? 'bg-rose-50/70 border-rose-200 text-rose-800' : 'bg-slate-50 border-slate-200'}`}>
              <span className="text-[11px] font-medium text-slate-500 block uppercase">Context Deviation</span>
              <span className={`text-lg font-bold ${record.deviationPercent > 15 ? 'text-rose-700' : 'text-slate-900'}`}>
                {isDeviationPositive ? `+${record.deviationPercent}%` : `${record.deviationPercent}%`}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-medium text-slate-500 block uppercase">iForest Anomaly Score</span>
              <span className="text-lg font-bold text-indigo-700 font-mono">
                {record.multivariateScore.toFixed(3)}
              </span>
            </div>
          </div>

          {/* Section 1: WHAT HAPPENED? */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <h4 className="text-xs font-bold tracking-wider text-slate-700 uppercase flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-blue-600" />
              1. What Happened?
            </h4>
            <p className="text-xs text-slate-700 leading-relaxed">
              At <span className="font-semibold text-slate-900">{new Date(record.timestamp).toLocaleTimeString()}</span>, {record.equipment_id} drew{' '}
              <strong className="text-slate-900">{record.actualEnergy} kWh</strong> while serving a building cooling load of{' '}
              <strong className="text-slate-900">{record.buildingLoad} RT</strong>. The machine-learning regression baseline anticipated an energy draw of{' '}
              <strong className="text-slate-900">{record.expectedEnergy} kWh</strong> under these specific ambient and thermal parameters, creating an energy residual of{' '}
              <strong className={record.energyResidual > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                {record.energyResidual > 0 ? `+${record.energyResidual}` : record.energyResidual} kWh ({isDeviationPositive ? '+' : ''}{record.deviationPercent}%)
              </strong>.
            </p>
          </div>

          {/* Section 2: WHY IS IT UNUSUAL? */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <h4 className="text-xs font-bold tracking-wider text-slate-700 uppercase flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-indigo-600" />
              2. Why Is It Unusual?
            </h4>
            <p className="text-xs text-slate-700 leading-relaxed">
              The dual-model ML pipeline evaluated contextual thermodynamics rather than simple fixed wattage boundaries:
            </p>
            <ul className="text-xs text-slate-600 space-y-1.5 pl-4 list-disc">
              <li>
                <strong>Contextual Expectation:</strong> Operating at {record.buildingLoad} RT under {record.outsideTemp}°F outside dry-bulb and {record.humidity}% relative humidity normally commands ~{record.expectedEnergy} kWh in historical training benchmarks.
              </li>
              <li>
                <strong>Condenser Loop Divergence:</strong> Cooling water entered at <strong className="text-slate-800">{record.coolingWaterTemp}°C</strong>. The thermal lift required of the refrigeration compressor was significantly elevated relative to flow rate ({record.chilledWaterRate} L/s).
              </li>
              <li>
                <strong>Multivariate Density:</strong> Unsupervised Isolation Forest detected an uncommon multidimensional coordinate (Score: <strong className="text-indigo-700 font-mono">{record.multivariateScore.toFixed(3)}</strong>), indicating joint parameter divergence.
              </li>
            </ul>
          </div>

          {/* Section 3: WHAT EVIDENCE SUPPORTS IT? */}
          <div className="p-4 rounded-lg bg-blue-50/50 border border-blue-200 space-y-3">
            <h4 className="text-xs font-bold tracking-wider text-blue-900 uppercase flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-blue-700" />
              3. What Evidence Supports It?
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded bg-white border border-blue-100 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-800 block">Energy Residual Deviation</strong>
                  Observed energy is {Math.abs(record.deviationPercent)}% {record.deviationPercent >= 0 ? 'above' : 'below'} the ML expected baseline.
                </span>
              </div>

              <div className="p-2.5 rounded bg-white border border-blue-100 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-800 block">Multivariate Anomaly Score</strong>
                  Isolation Forest score {record.multivariateScore.toFixed(2)} exceeds normal empirical calibration envelope (threshold: ~0.55).
                </span>
              </div>

              <div className="p-2.5 rounded bg-white border border-blue-100 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-800 block">Temporal Persistence</strong>
                  {record.persistenceCount > 1
                    ? `Deviation is persistent across ${record.persistenceCount} consecutive 30-minute operational intervals.`
                    : 'Transient occurrence within recent rolling window.'}
                </span>
              </div>

              <div className="p-2.5 rounded bg-white border border-blue-100 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-800 block">Rolling Window Momentum</strong>
                  Rolling 3-hour mean energy: {record.rollingMeanEnergy} kWh (Std Dev: {record.rollingStdEnergy} kWh).
                </span>
              </div>
            </div>

            {/* Contributing factors ranking */}
            <div className="mt-3 pt-3 border-t border-blue-200/60">
              <span className="text-[11px] font-bold text-slate-700 uppercase block mb-2">
                Top Contributing Variables (Evidence Ranking):
              </span>
              <div className="space-y-1.5">
                {record.contributingFactors.map((factor, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs bg-white px-3 py-1.5 rounded border border-blue-100">
                    <span className="text-slate-700 font-medium">
                      <span className="text-slate-400 font-mono mr-1.5">#{idx + 1}</span>
                      {factor.displayName}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500 text-[11px]">
                        Observed: <strong className="text-slate-800">{factor.observedValue} {factor.unit}</strong>
                      </span>
                      <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full ${factor.contributionScore > 60 ? 'bg-rose-500' : 'bg-blue-500'}`}
                          style={{ width: `${factor.contributionScore}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-mono text-slate-600 w-8 text-right">
                        {factor.contributionScore}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 4: WHAT SHOULD BE INVESTIGATED? */}
          <div className="p-4 rounded-lg bg-amber-50/60 border border-amber-200 space-y-2">
            <h4 className="text-xs font-bold tracking-wider text-amber-900 uppercase flex items-center gap-1.5">
              <Wrench className="w-4 h-4 text-amber-700" />
              4. What Should Be Investigated? (Actionable Recommendation)
            </h4>
            <div className="p-3 bg-white rounded border border-amber-200 text-xs text-slate-800 leading-relaxed font-medium">
              {record.recommendation}
            </div>
            <div className="text-[11px] text-amber-800/90 pl-1 space-y-1">
              <p>• Compare {record.equipment_id} with its own historical baseline under similar load and ambient wet-bulb conditions.</p>
              <p>• Inspect condenser loop approach temperature and cooling tower fan/pump speeds.</p>
              <p>• Verify chilled water delta-T across the evaporator bundle to rule out low delta-T syndrome.</p>
              <p>• Confirm whether abnormal energy behaviour continues across subsequent operational shifts.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 italic">
            * Analytical assessment based on contextual ML evidence; not a guaranteed physical diagnosis.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Close Investigation
          </button>
        </div>
      </div>
    </div>
  );
};
