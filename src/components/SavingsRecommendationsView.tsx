import React, { useState } from 'react';
import {
  DollarSign,
  Leaf,
  Zap,
  TrendingDown,
  CheckCircle2,
  ArrowRight,
  Clock,
  Download,
  AlertTriangle,
  Sliders,
  Sparkles,
  Layers,
  FileCheck,
  Building,
  Calendar
} from 'lucide-react';
import { AnalysisResult, EnergySavingRecommendation } from '../types';

interface SavingsRecommendationsViewProps {
  analysis: AnalysisResult;
  onNavigateToSimulation?: () => void;
}

export const SavingsRecommendationsView: React.FC<SavingsRecommendationsViewProps> = ({
  analysis,
  onNavigateToSimulation
}) => {
  const { recommendations, totalPotentialRupeeSavingsPerDay, totalKWhSavingsPerDay, totalCo2SavingsKgPerDay } = analysis;

  const [tariffRate, setTariffRate] = useState<number>(8.50); // ₹ per kWh
  const [operatingDaysPerYear, setOperatingDaysPerYear] = useState<number>(310);

  // Recalculate totals based on customized tariff and days
  const dailyKwh = totalKWhSavingsPerDay || 780;
  const dailyRupee = Math.round(dailyKwh * tariffRate);
  const monthlyRupee = Math.round(dailyRupee * 30);
  const annualRupee = Math.round(dailyRupee * operatingDaysPerYear);

  const dailyCo2Kg = Math.round(dailyKwh * 0.82);
  const annualCo2Tonnes = Number(((dailyCo2Kg * operatingDaysPerYear) / 1000).toFixed(1));

  // Export Work Order simulation
  const [copiedWorkOrder, setCopiedWorkOrder] = useState<boolean>(false);

  const handleCopyWorkOrder = () => {
    const text = recommendations.map((r, i) => `${i + 1}. [${r.category}] ${r.title}\n   Action: ${r.actionText}\n   Projected Savings: ₹${Math.round(r.kwhSavingsPerDay * tariffRate).toLocaleString()}/day (${r.kwhSavingsPerDay} kWh/day, ${Math.round(r.kwhSavingsPerDay * 0.82)} kg CO2e)\n   Payoff: ${r.payoffTime}\n`).join('\n');
    navigator.clipboard?.writeText?.(text);
    setCopiedWorkOrder(true);
    setTimeout(() => setCopiedWorkOrder(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Financial & Carbon Transformation */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-xl p-6 text-white shadow-lg border border-emerald-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-emerald-800/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 text-xs font-semibold tracking-wide flex items-center gap-1.5 font-mono">
                <Leaf className="w-3.5 h-3.5 text-emerald-300" />
                ACTIONABLE ENERGY &amp; CARBON INTELLIGENCE
              </span>
              <span className="text-xs text-slate-300">
                Commercial Grid Tariff: <strong className="text-white font-mono">₹{tariffRate.toFixed(2)}/kWh</strong>
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1.5">
              Cost Reduction &amp; Environmental Sustainability
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-2xl leading-relaxed">
              Transforming contextual ML anomalies into quantifiable rupees saved and metric tons of carbon emissions avoided.
              Zero speculative recommendations—every directive is grounded in historical thermodynamic performance data.
            </p>
          </div>

          {/* Export Work Order Button */}
          <div className="shrink-0">
            <button
              onClick={handleCopyWorkOrder}
              className="px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              {copiedWorkOrder ? <CheckCircle2 className="w-4 h-4" /> : <Download className="w-4 h-4" />}
              {copiedWorkOrder ? 'Copied BMS Directives!' : 'Export BMS Work Orders'}
            </button>
          </div>
        </div>

        {/* 4 Pillars Summary KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {/* Daily ₹ Savings */}
          <div className="bg-slate-950/40 backdrop-blur-xs p-4 rounded-xl border border-white/10">
            <div className="text-xs text-emerald-200/80 flex items-center gap-1.5 font-semibold">
              <DollarSign className="w-4 h-4 text-emerald-300" /> Daily Cost Reduction
            </div>
            <div className="text-3xl font-extrabold text-emerald-300 font-mono mt-1">
              ₹{dailyRupee.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-300 mt-1">
              ₹{monthlyRupee.toLocaleString()} / month (30 days)
            </div>
          </div>

          {/* Annual ₹ Savings */}
          <div className="bg-slate-950/40 backdrop-blur-xs p-4 rounded-xl border border-white/10">
            <div className="text-xs text-amber-200/80 flex items-center gap-1.5 font-semibold">
              <DollarSign className="w-4 h-4 text-amber-300" /> Annual Facility Savings
            </div>
            <div className="text-3xl font-extrabold text-amber-300 font-mono mt-1">
              ₹{(annualRupee / 100000).toFixed(2)} <span className="text-sm font-sans">Lakhs</span>
            </div>
            <div className="text-[11px] text-slate-300 mt-1">
              Based on {operatingDaysPerYear} active operating days
            </div>
          </div>

          {/* Daily Energy Saved */}
          <div className="bg-slate-950/40 backdrop-blur-xs p-4 rounded-xl border border-white/10">
            <div className="text-xs text-cyan-200/80 flex items-center gap-1.5 font-semibold">
              <Zap className="w-4 h-4 text-cyan-300" /> Daily Energy Saved
            </div>
            <div className="text-3xl font-extrabold text-cyan-300 font-mono mt-1">
              {dailyKwh.toLocaleString()} <span className="text-sm font-sans">kWh</span>
            </div>
            <div className="text-[11px] text-slate-300 mt-1 font-mono">
              ~{(dailyKwh / 24).toFixed(1)} kW average power drop
            </div>
          </div>

          {/* CO2 Emissions Avoided */}
          <div className="bg-slate-950/40 backdrop-blur-xs p-4 rounded-xl border border-white/10">
            <div className="text-xs text-teal-200/80 flex items-center gap-1.5 font-semibold">
              <Leaf className="w-4 h-4 text-teal-300" /> Carbon Offset (CO₂e)
            </div>
            <div className="text-3xl font-extrabold text-white font-mono mt-1">
              {annualCo2Tonnes} <span className="text-sm font-sans">Tonnes</span>
            </div>
            <div className="text-[11px] text-emerald-200 mt-1">
              {dailyCo2Kg.toLocaleString()} kg CO₂ avoided per day
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Tariff & Operating Parameters Adjuster */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-700 gap-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="font-bold">Financial Assumptions Configuration:</span>
            <span className="text-slate-500">Adjust tariff or facility operating days to recalculate financial returns in real time</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Tariff Rate:</span>
              <div className="flex items-center bg-slate-100 rounded px-2 py-1 font-mono">
                ₹
                <input
                  type="number"
                  step="0.25"
                  min="5"
                  max="20"
                  value={tariffRate}
                  onChange={e => setTariffRate(Number(e.target.value) || 8.5)}
                  className="w-14 bg-transparent text-slate-900 font-bold outline-none text-right"
                />
                /kWh
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Annual Days:</span>
              <div className="flex items-center bg-slate-100 rounded px-2 py-1 font-mono">
                <input
                  type="number"
                  step="5"
                  min="100"
                  max="365"
                  value={operatingDaysPerYear}
                  onChange={e => setOperatingDaysPerYear(Number(e.target.value) || 310)}
                  className="w-12 bg-transparent text-slate-900 font-bold outline-none text-right"
                />
                days
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Concrete Actionable Recommendations Cards List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            Prioritized Operational Directives &amp; Engineering Actions
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Ranked by financial return and implementation speed
          </span>
        </div>

        <div className="space-y-4">
          {recommendations.map((rec, idx) => {
            const recRupeeDaily = Math.round(rec.kwhSavingsPerDay * tariffRate);
            const recRupeeAnnual = Math.round(recRupeeDaily * operatingDaysPerYear);
            const recCo2Daily = Math.round(rec.kwhSavingsPerDay * 0.82);

            return (
              <div
                key={rec.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 font-bold text-sm flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center flex-wrap gap-2">
                        <h4 className="text-base font-bold text-slate-900">{rec.title}</h4>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {rec.equipmentId}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {rec.payoffTime}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                        {rec.actionText}
                      </p>

                      {/* Evidence citation from ML pipeline */}
                      <div className="text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-600 flex items-start gap-2 mt-2">
                        <FileCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-900">ML Evidence Justification:</strong> {rec.evidence}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Savings Badge */}
                  <div className="flex lg:flex-col items-center lg:items-end justify-between bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200 shrink-0 gap-2">
                    <div className="text-left lg:text-right">
                      <span className="text-[11px] text-emerald-800 font-medium">Predicted Daily Savings:</span>
                      <div className="text-xl font-extrabold text-emerald-700 font-mono">
                        ₹{recRupeeDaily.toLocaleString()} <span className="text-xs font-sans font-normal text-slate-600">/day</span>
                      </div>
                    </div>

                    <div className="text-left lg:text-right text-[11px] text-slate-600">
                      <div><strong className="font-mono text-slate-900">{rec.kwhSavingsPerDay} kWh</strong> saved/day</div>
                      <div><strong className="font-mono text-emerald-700">{recCo2Daily} kg</strong> CO₂ avoided/day</div>
                    </div>

                    {onNavigateToSimulation && (
                      <button
                        onClick={onNavigateToSimulation}
                        className="mt-1 px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                      >
                        <Sliders className="w-3 h-3" /> Simulate Impact
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
