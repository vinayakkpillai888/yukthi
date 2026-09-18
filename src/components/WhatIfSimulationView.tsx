import React, { useState, useMemo } from 'react';
import {
  Sliders,
  Zap,
  Thermometer,
  Gauge,
  Droplets,
  DollarSign,
  TrendingDown,
  ArrowRight,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Leaf,
  Layers,
  Info
} from 'lucide-react';
import { AnalysisResult } from '../types';

interface WhatIfSimulationViewProps {
  analysis: AnalysisResult;
}

export const WhatIfSimulationView: React.FC<WhatIfSimulationViewProps> = ({ analysis }) => {
  const { equipmentSummaries, records, pipelineMetrics } = analysis;
  const chillerIds = Object.keys(equipmentSummaries);

  // Simulation Sliders State
  const [targetChiller, setTargetChiller] = useState<string>(chillerIds[1] || 'CHILLER-02');
  const [buildingLoadRT, setBuildingLoadRT] = useState<number>(320);
  const [coolingWaterTempC, setCoolingWaterTempC] = useState<number>(29.5);
  const [outsideTempF, setOutsideTempF] = useState<number>(84);
  const [chilledWaterFlowLps, setChilledWaterFlowLps] = useState<number>(135);
  const [optimizedCoolingWaterTempC, setOptimizedCoolingWaterTempC] = useState<number>(27.0);
  const [optimizedFlowLps, setOptimizedFlowLps] = useState<number>(118);
  const [tariffInrPerKwh, setTariffInrPerKwh] = useState<number>(8.50);

  // Quick Presets
  const applyPreset = (preset: 'SUMMER_PEAK' | 'MONSOON_HUMID' | 'MILD_PART_LOAD' | 'LOW_DELTA_T') => {
    if (preset === 'SUMMER_PEAK') {
      setBuildingLoadRT(420);
      setCoolingWaterTempC(32.5);
      setOutsideTempF(98);
      setChilledWaterFlowLps(150);
      setOptimizedCoolingWaterTempC(28.5);
      setOptimizedFlowLps(130);
    } else if (preset === 'MONSOON_HUMID') {
      setBuildingLoadRT(310);
      setCoolingWaterTempC(30.0);
      setOutsideTempF(86);
      setChilledWaterFlowLps(135);
      setOptimizedCoolingWaterTempC(27.0);
      setOptimizedFlowLps(115);
    } else if (preset === 'MILD_PART_LOAD') {
      setBuildingLoadRT(180);
      setCoolingWaterTempC(26.5);
      setOutsideTempF(72);
      setChilledWaterFlowLps(110);
      setOptimizedCoolingWaterTempC(24.5);
      setOptimizedFlowLps(95);
    } else if (preset === 'LOW_DELTA_T') {
      setBuildingLoadRT(220);
      setCoolingWaterTempC(29.0);
      setOutsideTempF(80);
      setChilledWaterFlowLps(155);
      setOptimizedCoolingWaterTempC(26.5);
      setOptimizedFlowLps(110);
    }
  };

  // Thermodynamic Simulation Computation Engine
  const simulationResults = useMemo(() => {
    // Determine base specific power of target unit
    const summary = equipmentSummaries[targetChiller];
    const baseUnitKwPerRT = summary?.avgKwPerRT || 0.76;

    // Thermodynamic penalty factors:
    // 1. Condenser temperature: ~2.5% energy increase per 1°C increase above nominal 27°C
    const cwPenaltyFactor = 1 + (coolingWaterTempC - 27.0) * 0.025;
    // 2. Part-load curve factor: chillers are slightly less efficient below 40% load
    const loadFraction = buildingLoadRT / 450;
    const partLoadFactor = loadFraction < 0.5 ? 1 + (0.5 - loadFraction) * 0.18 : 1.0;
    // 3. Excess flow / low Delta-T pumping & turbulence penalty
    const flowDesign = buildingLoadRT * 0.38; // nominal ~0.38 L/s per RT
    const excessFlowPenalty = Math.max(0, (chilledWaterFlowLps - flowDesign) / flowDesign) * 0.08;

    // Baseline Predicted Energy (Unoptimized)
    const baselineEnergyRaw = buildingLoadRT * baseUnitKwPerRT * cwPenaltyFactor * partLoadFactor * (1 + excessFlowPenalty);
    const baselineEnergy = Number(baselineEnergyRaw.toFixed(1));

    // Optimized Scenario:
    // With lower cooling water temperature, tuned flow rate, and optional staging shift to best chiller
    const bestChillerId = Object.keys(equipmentSummaries).reduce((best, curr) => {
      return (equipmentSummaries[curr]?.copEstimate || 0) > (equipmentSummaries[best]?.copEstimate || 0) ? curr : best;
    }, targetChiller);
    const bestChillerKwPerRT = equipmentSummaries[bestChillerId]?.avgKwPerRT || 0.68;

    const optCwFactor = 1 + (optimizedCoolingWaterTempC - 27.0) * 0.025;
    const optFlowExcess = Math.max(0, (optimizedFlowLps - flowDesign) / flowDesign) * 0.08;

    // If target chiller is degraded and user selects optimization, we also apply load-shifting benefit
    const effectiveKw = targetChiller === bestChillerId ? baseUnitKwPerRT : (baseUnitKwPerRT * 0.4 + bestChillerKwPerRT * 0.6);
    const predictedEnergyRaw = buildingLoadRT * effectiveKw * optCwFactor * partLoadFactor * (1 + optFlowExcess);
    const predictedEnergy = Number(predictedEnergyRaw.toFixed(1));

    // Energy delta
    const deltaEnergy = Number((baselineEnergy - predictedEnergy).toFixed(1));
    const deltaPercent = Number((((baselineEnergy - predictedEnergy) / baselineEnergy) * 100).toFixed(1));

    // COPs
    const baselineCop = Number(((buildingLoadRT * 3.517) / Math.max(5, baselineEnergy)).toFixed(2));
    const simulatedCop = Number(((buildingLoadRT * 3.517) / Math.max(5, predictedEnergy)).toFixed(2));

    const baselineKwPerRT = Number((baselineEnergy / buildingLoadRT).toFixed(3));
    const simulatedKwPerRT = Number((predictedEnergy / buildingLoadRT).toFixed(3));

    // Financial & Carbon Savings
    const hoursPerDay = 12; // typical daytime HVAC operating hours
    const hourlyRupeeSavings = Number((deltaEnergy * tariffInrPerKwh).toFixed(1));
    const dailyRupeeSavings = Number((hourlyRupeeSavings * hoursPerDay).toFixed(0));
    const monthlyRupeeSavings = Number((dailyRupeeSavings * 30).toFixed(0));
    const annualRupeeSavings = Number((dailyRupeeSavings * 365).toFixed(0));

    const dailyKWhSaved = Number((deltaEnergy * hoursPerDay).toFixed(0));
    const dailyCo2ReductionKg = Number((dailyKWhSaved * 0.82).toFixed(1));
    const annualCo2ReductionTonnes = Number(((dailyCo2ReductionKg * 365) / 1000).toFixed(1));

    // AI Contextual Guidance
    let aiRecommendation = `By optimizing condenser water temperature from ${coolingWaterTempC}°C down to ${optimizedCoolingWaterTempC}°C and reducing pumping flow to ${optimizedFlowLps} L/sec, energy consumption drops from ${baselineEnergy} kWh → ${predictedEnergy} kWh (${deltaPercent}% reduction).`;
    if (targetChiller !== bestChillerId) {
      aiRecommendation += ` Shifting base tonnage to ${bestChillerId} unlocks additional thermodynamic savings.`;
    }

    return {
      baselineEnergy,
      predictedEnergy,
      deltaEnergy,
      deltaPercent,
      baselineCop,
      simulatedCop,
      baselineKwPerRT,
      simulatedKwPerRT,
      hourlyRupeeSavings,
      dailyRupeeSavings,
      monthlyRupeeSavings,
      annualRupeeSavings,
      dailyKWhSaved,
      dailyCo2ReductionKg,
      annualCo2ReductionTonnes,
      aiRecommendation,
      bestChillerId
    };
  }, [
    targetChiller,
    buildingLoadRT,
    coolingWaterTempC,
    outsideTempF,
    chilledWaterFlowLps,
    optimizedCoolingWaterTempC,
    optimizedFlowLps,
    tariffInrPerKwh,
    equipmentSummaries
  ]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold uppercase tracking-wider">
                Interactive What-If Sandbox
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Thermodynamic Digital Twin Simulation
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">
              Building Load &amp; Environmental Sensitivity Simulator
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl">
              Dynamically manipulate building cooling demand, entering cooling-water temperature, and pump flow rates.
              Observe the immediate ML-predicted energy transformation, thermodynamic COP shift, and operational cost savings.
            </p>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 shrink-0">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Presets:</span>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => applyPreset('SUMMER_PEAK')}
                className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium cursor-pointer transition-colors"
              >
                Summer Peak (420 RT)
              </button>
              <button
                onClick={() => applyPreset('MONSOON_HUMID')}
                className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium cursor-pointer transition-colors"
              >
                Monsoon (310 RT)
              </button>
              <button
                onClick={() => applyPreset('MILD_PART_LOAD')}
                className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium cursor-pointer transition-colors"
              >
                Part Load (180 RT)
              </button>
              <button
                onClick={() => applyPreset('LOW_DELTA_T')}
                className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium cursor-pointer transition-colors"
              >
                Low Delta-T
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* The Core Demonstration Result Banner (As explicitly required by user: "190 kWh → 175 kWh") */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-xl p-6 text-white shadow-xl border border-indigo-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-indigo-800/80">
          <div>
            <div className="text-xs text-indigo-300 font-bold uppercase tracking-wider font-mono flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              SIMULATION ENERGY PREDICTION OUTCOME
            </div>
            
            {/* The Famous 190 kWh -> 175 kWh Display */}
            <div className="flex items-center flex-wrap gap-3 sm:gap-6 mt-2">
              <div className="text-left">
                <span className="text-xs text-slate-400">Baseline Energy</span>
                <div className="text-3xl sm:text-4xl font-extrabold text-slate-300 font-mono">
                  {simulationResults.baselineEnergy} <span className="text-sm font-sans text-slate-400">kWh</span>
                </div>
              </div>

              <div className="text-indigo-400 text-2xl font-bold flex items-center">
                <ArrowRight className="w-8 h-8 stroke-[2.5]" />
              </div>

              <div className="text-left">
                <span className="text-xs text-emerald-400 font-bold">Optimized Predicted Energy</span>
                <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400 font-mono">
                  {simulationResults.predictedEnergy} <span className="text-sm font-sans text-emerald-300">kWh</span>
                </div>
              </div>

              <div className="bg-emerald-500/20 border border-emerald-400/30 px-3.5 py-1.5 rounded-lg text-emerald-300 text-sm font-bold font-mono">
                -{simulationResults.deltaEnergy} kWh/hr (-{simulationResults.deltaPercent}%)
              </div>
            </div>
          </div>

          {/* COP & Specific Power Impact */}
          <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-indigo-900/60 shrink-0">
            <div>
              <span className="text-[11px] text-slate-400">COP Efficiency Shift</span>
              <div className="text-xl font-bold text-white font-mono mt-0.5">
                {simulationResults.baselineCop} <span className="text-indigo-400">→</span> <span className="text-emerald-400">{simulationResults.simulatedCop}</span>
              </div>
              <span className="text-[10px] text-emerald-400">
                +{(((simulationResults.simulatedCop - simulationResults.baselineCop) / simulationResults.baselineCop) * 100).toFixed(1)}% improvement
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400">Specific Power</span>
              <div className="text-xl font-bold text-white font-mono mt-0.5">
                {simulationResults.baselineKwPerRT} <span className="text-indigo-400">→</span> <span className="text-emerald-400">{simulationResults.simulatedKwPerRT}</span>
              </div>
              <span className="text-[10px] text-slate-400">kW per RT</span>
            </div>
          </div>
        </div>

        {/* Cost & Carbon Savings Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
          <div className="bg-white/5 backdrop-blur-xs p-3.5 rounded-lg border border-white/10">
            <div className="text-xs text-slate-400 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-amber-400" /> Hourly Cost Savings
            </div>
            <div className="text-2xl font-bold text-amber-300 font-mono mt-1">
              ₹{simulationResults.hourlyRupeeSavings} <span className="text-xs font-sans text-slate-400">/hr</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Tariff: ₹{tariffInrPerKwh.toFixed(2)}/kWh
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xs p-3.5 rounded-lg border border-white/10">
            <div className="text-xs text-slate-400 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Daily Projected Savings
            </div>
            <div className="text-2xl font-bold text-emerald-300 font-mono mt-1">
              ₹{simulationResults.dailyRupeeSavings.toLocaleString()} <span className="text-xs font-sans text-slate-400">/day</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {simulationResults.dailyKWhSaved.toLocaleString()} kWh saved daily
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xs p-3.5 rounded-lg border border-white/10">
            <div className="text-xs text-slate-400 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-cyan-400" /> Monthly Savings (30d)
            </div>
            <div className="text-2xl font-bold text-cyan-300 font-mono mt-1">
              ₹{simulationResults.monthlyRupeeSavings.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              ₹{(simulationResults.annualRupeeSavings / 100000).toFixed(2)} Lakhs/yr
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xs p-3.5 rounded-lg border border-white/10">
            <div className="text-xs text-slate-400 flex items-center gap-1">
              <Leaf className="w-3.5 h-3.5 text-emerald-400" /> CO₂ Emissions Avoided
            </div>
            <div className="text-2xl font-bold text-emerald-300 font-mono mt-1">
              {simulationResults.dailyCo2ReductionKg} <span className="text-xs font-sans text-slate-400">kg/day</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {simulationResults.annualCo2ReductionTonnes} Tonnes CO₂e/yr
            </div>
          </div>
        </div>

        {/* AI Action Directive */}
        <div className="mt-4 p-3 rounded-lg bg-indigo-900/60 border border-indigo-700/50 text-xs text-indigo-100 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>
            <strong>AI Operational Directive:</strong> {simulationResults.aiRecommendation}
          </span>
        </div>
      </div>

      {/* Interactive Controls & Parameter Sliders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Baseline / Current Operational Conditions */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Gauge className="w-4 h-4 text-blue-600" />
              1. Input Conditions (Baseline State)
            </h3>
            <span className="text-xs text-slate-500 font-medium">Drag to adjust inputs</span>
          </div>

          {/* Chiller Unit Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 flex justify-between">
              <span>Target Chiller Unit</span>
              <span className="text-blue-600 font-mono">{targetChiller}</span>
            </label>
            <div className="grid grid-cols-3 gap-2 mt-1.5">
              {chillerIds.map(id => (
                <button
                  key={id}
                  onClick={() => setTargetChiller(id)}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
                    targetChiller === id
                      ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {id}
                </button>
              ))}
            </div>
          </div>

          {/* Building Cooling Load Slider */}
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1">
                <Gauge className="w-3.5 h-3.5 text-indigo-600" /> Building Cooling Load
              </span>
              <span className="font-mono text-blue-600 text-sm">{buildingLoadRT} RT</span>
            </div>
            <input
              type="range"
              min={100}
              max={500}
              step={5}
              value={buildingLoadRT}
              onChange={e => setBuildingLoadRT(Number(e.target.value))}
              className="w-full mt-2 accent-blue-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
              <span>100 RT (Low)</span>
              <span>300 RT (Design)</span>
              <span>500 RT (Max Surge)</span>
            </div>
          </div>

          {/* Entering Cooling Water Temperature Slider */}
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1">
                <Thermometer className="w-3.5 h-3.5 text-rose-500" /> Cooling Water Entering Temp (C)
              </span>
              <span className="font-mono text-rose-600 text-sm">{coolingWaterTempC}°C</span>
            </div>
            <input
              type="range"
              min={22.0}
              max={34.0}
              step={0.5}
              value={coolingWaterTempC}
              onChange={e => setCoolingWaterTempC(Number(e.target.value))}
              className="w-full mt-2 accent-rose-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
              <span>22°C (Cool Basin)</span>
              <span>28°C (Nominal)</span>
              <span>34°C (Fouled / High Lift)</span>
            </div>
          </div>

          {/* Chilled Water Flow Rate Slider */}
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-cyan-600" /> Chilled Water Flow Rate
              </span>
              <span className="font-mono text-cyan-600 text-sm">{chilledWaterFlowLps} L/sec</span>
            </div>
            <input
              type="range"
              min={80}
              max={180}
              step={5}
              value={chilledWaterFlowLps}
              onChange={e => setChilledWaterFlowLps(Number(e.target.value))}
              className="w-full mt-2 accent-cyan-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
              <span>80 L/s (Minimum)</span>
              <span>125 L/s (Design)</span>
              <span>180 L/s (Overflow Low-Delta T)</span>
            </div>
          </div>
        </div>

        {/* Optimized Setpoints & Tariff Configuration */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-600" />
              2. Target Optimization Strategy
            </h3>
            <span className="text-xs text-emerald-600 font-bold">AI Recommended Actions</span>
          </div>

          {/* Optimized Cooling Water Temp Slider */}
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1">
                <Thermometer className="w-3.5 h-3.5 text-emerald-600" /> Target Cooling Water Temp
              </span>
              <span className="font-mono text-emerald-600 text-sm">{optimizedCoolingWaterTempC}°C</span>
            </div>
            <input
              type="range"
              min={22.0}
              max={30.0}
              step={0.5}
              value={optimizedCoolingWaterTempC}
              onChange={e => setOptimizedCoolingWaterTempC(Number(e.target.value))}
              className="w-full mt-2 accent-emerald-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Achieved by optimizing cooling tower fan speed and staging basin cells.
            </p>
          </div>

          {/* Optimized Chilled Water Flow Slider */}
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-emerald-600" /> Target Chilled Water Flow Rate
              </span>
              <span className="font-mono text-emerald-600 text-sm">{optimizedFlowLps} L/sec</span>
            </div>
            <input
              type="range"
              min={80}
              max={150}
              step={5}
              value={optimizedFlowLps}
              onChange={e => setOptimizedFlowLps(Number(e.target.value))}
              className="w-full mt-2 accent-emerald-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Eliminates low Delta-T syndrome and parasitic secondary pumping power.
            </p>
          </div>

          {/* Commercial Electricity Tariff Configuration */}
          <div className="pt-2 border-t border-slate-200">
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-amber-600" /> Electricity Tariff (INR ₹ / kWh)
              </span>
              <span className="font-mono text-amber-600 text-sm">₹{tariffInrPerKwh.toFixed(2)} / kWh</span>
            </div>
            <input
              type="range"
              min={6.0}
              max={14.0}
              step={0.25}
              value={tariffInrPerKwh}
              onChange={e => setTariffInrPerKwh(Number(e.target.value))}
              className="w-full mt-2 accent-amber-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
              <span>₹6.00 (Off-peak)</span>
              <span>₹8.50 (Standard Commercial)</span>
              <span>₹14.00 (Peak Demand)</span>
            </div>
          </div>

          {/* Staging Optimization Callout */}
          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-900">
            <div className="flex items-center gap-1.5 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Optimal Equipment Staging Pairing
            </div>
            <p className="mt-1 text-emerald-800">
              For {buildingLoadRT} RT demand, optimal plant efficiency is reached by prioritizing{' '}
              <strong>{simulationResults.bestChillerId}</strong> as the lead machine due to its superior baseline COP.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
