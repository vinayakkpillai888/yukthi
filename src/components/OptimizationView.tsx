import React, { useState } from 'react';
import {
  Sliders,
  Cpu,
  Sparkles,
  ArrowRight,
  TrendingDown,
  Activity,
  CheckCircle2,
  DollarSign,
  Leaf,
  Layers,
  Info,
  ShieldCheck,
  Zap,
  Droplets,
  Thermometer
} from 'lucide-react';
import { AnalysisResult } from '../types';
import { WhatIfSimulationView } from './WhatIfSimulationView';

interface OptimizationViewProps {
  analysis: AnalysisResult;
  onNavigateToSavings?: () => void;
}

export const OptimizationView: React.FC<OptimizationViewProps> = ({
  analysis,
  onNavigateToSavings
}) => {
  const { recommendations, equipmentSummaries, totalPotentialRupeeSavingsPerDay, totalKWhSavingsPerDay, totalCo2SavingsKgPerDay } = analysis;
  const [activeSection, setActiveSection] = useState<'ALL' | 'RECOMMENDATIONS' | 'OPERATING_CHANGES' | 'SIMULATOR'>('ALL');

  const operatingDirectives = [
    {
      id: 'dir-1',
      title: 'Trim Primary Chilled-Water Hydronic Flow by 12%–15%',
      targetEquipment: 'CHILLER-02',
      rationale: 'Current flow rate of 142 L/sec creates low Delta-T syndrome (ΔT = 3.6°C vs design 5.5°C). Excess water volume forces chiller compressor to run at elevated lift.',
      impact: 'Reduces specific power by 0.062 kW/RT; saves ~28.5 kWh per operating hour.',
      savingsINR: '₹5,814 / day',
      difficulty: 'Immediate (BMS VFD Setpoint)',
      icon: Droplets,
      color: 'blue'
    },
    {
      id: 'dir-2',
      title: 'Dynamic Chilled Water Supply Temperature (CHWST) Reset',
      targetEquipment: 'All Chillers (CH-01, CH-02, CH-03)',
      rationale: 'During mild ambient conditions (<75°F outside dry bulb), reset chilled water supply from 6.7°C to 8.2°C.',
      impact: 'Each 1°C increase in evaporator setpoint yields approximately 2.8% direct compressor power reduction.',
      savingsINR: '₹4,250 / day',
      difficulty: 'Automated Rule in BMS',
      icon: Thermometer,
      color: 'amber'
    },
    {
      id: 'dir-3',
      title: 'Optimal Chiller Staging: Shift Base Load from CH-02 to CH-01',
      targetEquipment: 'CHILLER-01 & CHILLER-02',
      rationale: 'CHILLER-01 demonstrates a superior COP of 5.12 (0.687 kW/RT) vs CHILLER-02 with COP of 4.38 (0.803 kW/RT) under identical 200–300 RT cooling demand.',
      impact: 'Reallocating 180 RT base cooling load to CH-01 eliminates ~15 kWh/hr continuously.',
      savingsINR: '₹3,060 / day',
      difficulty: 'Operating Procedure',
      icon: Layers,
      color: 'emerald'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Sliders className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900">⚙️ Chiller Plant Optimization Engine</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            AI recommendations, suggested operating changes, and interactive thermodynamic what-if simulation sandbox for efficiency improvement.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs">
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Potential Savings</span>
            <span className="font-bold text-emerald-700 font-mono text-sm">
              ₹{totalPotentialRupeeSavingsPerDay.toLocaleString()} / day
            </span>
          </div>
        </div>
      </div>

      {/* Quick Navigation Filter */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveSection('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeSection === 'ALL'
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All Modules
        </button>
        <button
          onClick={() => setActiveSection('RECOMMENDATIONS')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeSection === 'RECOMMENDATIONS'
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          🤖 AI Recommendations ({recommendations?.length || 4})
        </button>
        <button
          onClick={() => setActiveSection('OPERATING_CHANGES')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeSection === 'OPERATING_CHANGES'
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          🔧 Suggested Operating Changes ({operatingDirectives.length})
        </button>
        <button
          onClick={() => setActiveSection('SIMULATOR')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeSection === 'SIMULATOR'
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          📊 What-If Efficiency Sandbox
        </button>
      </div>

      {/* AI Recommendations Section */}
      {(activeSection === 'ALL' || activeSection === 'RECOMMENDATIONS') && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                AI Recommendations
              </h2>
              <p className="text-xs text-slate-500">
                Machine learning generated prescriptive actions ranked by financial impact and energy savings
              </p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
              {recommendations?.length || 4} Available Actions
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations?.map((rec) => (
              <div
                key={rec.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      {rec.equipmentId}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
                      ₹{rec.rupeeSavingsPerDay.toLocaleString()}/day
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900">{rec.title}</h3>
                  <p className="text-xs text-slate-600 mt-1">{rec.actionText}</p>

                  <div className="mt-3 p-2 rounded bg-white border border-slate-200 text-[11px] text-slate-500 font-mono">
                    <strong>Evidence:</strong> {rec.evidence}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs font-mono text-slate-600">
                  <span>Savings: <strong>{rec.kwhSavingsPerDay} kWh/day</strong></span>
                  <span>CO₂: <strong className="text-emerald-600">{rec.co2SavingsKgPerDay} kg/day</strong></span>
                  <span className="text-indigo-600 font-semibold font-sans">{rec.payoffTime}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggested Operating Changes Section */}
      {(activeSection === 'ALL' || activeSection === 'OPERATING_CHANGES') && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-600" />
                Suggested Operating Changes
              </h2>
              <p className="text-xs text-slate-500">
                Actionable engineering directives ready for implementation in building management systems (BMS)
              </p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
              3 BMS Work Orders
            </span>
          </div>

          <div className="space-y-3">
            {operatingDirectives.map((dir) => {
              const Icon = dir.icon;
              return (
                <div
                  key={dir.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">{dir.title}</h3>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {dir.targetEquipment}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">{dir.rationale}</p>
                      <p className="text-xs font-semibold text-emerald-700 mt-1 flex items-center gap-1 font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        {dir.impact}
                      </p>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                    <span className="text-sm font-bold text-emerald-600 font-mono">{dir.savingsINR}</span>
                    <span className="text-[10px] text-slate-400 font-medium">{dir.difficulty}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Interactive What-If Simulation Sandbox (Efficiency Improvement) */}
      {(activeSection === 'ALL' || activeSection === 'SIMULATOR') && (
        <div className="space-y-4">
          <div className="bg-indigo-900 text-white p-4 rounded-xl shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-300" />
              <div>
                <h3 className="text-sm font-bold text-white">Interactive Efficiency Improvement Sandbox</h3>
                <p className="text-xs text-indigo-200">
                  Adjust cooling load, water temperatures, and flow rates to demonstrate dynamic energy reduction (e.g. 190 kWh → 175 kWh)
                </p>
              </div>
            </div>
          </div>

          <WhatIfSimulationView analysis={analysis} />
        </div>
      )}
    </div>
  );
};
