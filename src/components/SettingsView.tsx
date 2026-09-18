import React, { useState } from 'react';
import {
  Settings,
  DollarSign,
  Gauge,
  Sliders,
  Palette,
  CheckCircle2,
  RefreshCw,
  Info,
  Sparkles,
  Zap,
  Layers,
  Thermometer
} from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onResetSettings: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onResetSettings
}) => {
  const [tariff, setTariff] = useState<number>(settings.tariffPerKwh);
  const [tempUnit, setTempUnit] = useState<'C' | 'F'>(settings.temperatureUnit);
  const [loadUnit, setLoadUnit] = useState<'RT' | 'kW'>(settings.loadUnit);
  const [flowUnit, setFlowUnit] = useState<'L/s' | 'GPM'>(settings.flowUnit);
  const [horizon, setHorizon] = useState<number>(settings.predictionHorizonHours);
  const [confidence, setConfidence] = useState<number>(settings.confidenceLevel);
  const [sensitivity, setSensitivity] = useState<'HIGH' | 'BALANCED' | 'CONSERVATIVE'>(settings.modelSensitivity);
  const [theme, setTheme] = useState<'dark' | 'light' | 'high-contrast'>(settings.theme);
  const [operatingDays, setOperatingDays] = useState<number>(settings.annualOperatingDays);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleSave = () => {
    onUpdateSettings({
      tariffPerKwh: tariff,
      currencySymbol: '₹',
      temperatureUnit: tempUnit,
      loadUnit: loadUnit,
      flowUnit: flowUnit,
      predictionHorizonHours: horizon,
      confidenceLevel: confidence,
      modelSensitivity: sensitivity,
      theme: theme,
      annualOperatingDays: operatingDays
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleReset = () => {
    onResetSettings();
    setTariff(8.50);
    setTempUnit('C');
    setLoadUnit('RT');
    setFlowUnit('L/s');
    setHorizon(24);
    setConfidence(90);
    setSensitivity('BALANCED');
    setTheme('dark');
    setOperatingDays(330);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
              <Settings className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900">⚙️ Application &amp; Model Settings</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Configure commercial energy tariffs, engineering measurement units, ML prediction horizon, and visual interface themes.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleReset}
            className="px-3 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            Reset Defaults
          </button>

          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            Save &amp; Apply
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Settings saved successfully and applied across all views and calculations!</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Energy Tariff Configuration */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-amber-600" />
              1. Energy Tariff &amp; Financial Settings
            </h2>
            <span className="text-xs font-mono font-bold text-amber-600">₹{tariff.toFixed(2)}/kWh</span>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Commercial Electricity Grid Tariff (₹ per kWh)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="4.0"
                  max="16.0"
                  step="0.25"
                  value={tariff}
                  onChange={(e) => setTariff(parseFloat(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <div className="flex items-center gap-1 shrink-0 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg font-mono font-bold text-slate-800">
                  <span>₹</span>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    step="0.1"
                    value={tariff}
                    onChange={(e) => setTariff(parseFloat(e.target.value) || 0)}
                    className="w-14 bg-transparent text-right focus:outline-none"
                  />
                </div>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Standard industrial state grid tariff rate (typically ₹7.50 to ₹10.50/kWh).
              </span>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Annual Operating Days (Plant Duty Schedule)
              </label>
              <input
                type="number"
                min="200"
                max="365"
                value={operatingDays}
                onChange={(e) => setOperatingDays(parseInt(e.target.value) || 330)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Used to project annualized cost and carbon emission abatement.
              </span>
            </div>
          </div>
        </div>

        {/* 2. Engineering Units Configuration */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Gauge className="w-4 h-4 text-blue-600" />
              2. Engineering Measurement Units
            </h2>
            <span className="text-xs font-mono text-slate-500">{tempUnit} • {loadUnit} • {flowUnit}</span>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1.5">
                Temperature Unit Display
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTempUnit('C')}
                  className={`p-2 rounded-lg border text-center font-semibold transition-colors cursor-pointer ${
                    tempUnit === 'C'
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Celsius (°C) [Metric]
                </button>
                <button
                  type="button"
                  onClick={() => setTempUnit('F')}
                  className={`p-2 rounded-lg border text-center font-semibold transition-colors cursor-pointer ${
                    tempUnit === 'F'
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Fahrenheit (°F) [Imperial]
                </button>
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1.5">
                Cooling Load Unit
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLoadUnit('RT')}
                  className={`p-2 rounded-lg border text-center font-semibold transition-colors cursor-pointer ${
                    loadUnit === 'RT'
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Refrigeration Tons (RT)
                </button>
                <button
                  type="button"
                  onClick={() => setLoadUnit('kW')}
                  className={`p-2 rounded-lg border text-center font-semibold transition-colors cursor-pointer ${
                    loadUnit === 'kW'
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Thermal Kilowatts (kW th)
                </button>
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1.5">
                Chilled Water Hydronic Flow Unit
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFlowUnit('L/s')}
                  className={`p-2 rounded-lg border text-center font-semibold transition-colors cursor-pointer ${
                    flowUnit === 'L/s'
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Litres per second (L/sec)
                </button>
                <button
                  type="button"
                  onClick={() => setFlowUnit('GPM')}
                  className={`p-2 rounded-lg border text-center font-semibold transition-colors cursor-pointer ${
                    flowUnit === 'GPM'
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Gallons per minute (GPM)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Prediction Settings */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              3. Machine Learning &amp; Prediction Settings
            </h2>
            <span className="text-xs font-mono text-indigo-600 font-bold">{horizon}h • {confidence}% CI</span>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Forecast Horizon (Hours Ahead)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[12, 24, 48].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setHorizon(h)}
                    className={`py-2 px-3 rounded-lg border font-mono font-semibold transition-colors cursor-pointer ${
                      horizon === h
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    +{h} Hours
                  </button>
                ))}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Standard operational day-ahead planning uses 24-hour horizon.
              </span>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Statistical Confidence Interval Band
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[90, 95, 99].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setConfidence(c)}
                    className={`py-2 px-3 rounded-lg border font-mono font-semibold transition-colors cursor-pointer ${
                      confidence === c
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {c}% CI
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Anomaly Sensitivity Threshold
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['HIGH', 'BALANCED', 'CONSERVATIVE'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSensitivity(s)}
                    className={`py-2 px-2 rounded-lg border text-center font-semibold transition-colors cursor-pointer ${
                      sensitivity === s
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 4. Theme Configuration */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Palette className="w-4 h-4 text-purple-600" />
              4. Visual Theme
            </h2>
            <span className="text-xs font-mono uppercase text-slate-500">{theme}</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-1 gap-2.5">
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition-colors cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-slate-900 text-white border-slate-700 ring-2 ring-blue-500'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div>
                  <div className="font-bold">Dark Slate (Default Industrial)</div>
                  <div className="text-[11px] opacity-75">Optimized for plant control room monitors and low eye-strain.</div>
                </div>
                {theme === 'dark' && <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />}
              </button>

              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition-colors cursor-pointer ${
                  theme === 'light'
                    ? 'bg-blue-50/80 border-blue-500 text-slate-900 ring-2 ring-blue-500'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div>
                  <div className="font-bold text-slate-900">Clean Light</div>
                  <div className="text-[11px] text-slate-500">High-clarity off-white aesthetic with clean contrast.</div>
                </div>
                {theme === 'light' && <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />}
              </button>

              <button
                type="button"
                onClick={() => setTheme('high-contrast')}
                className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition-colors cursor-pointer ${
                  theme === 'high-contrast'
                    ? 'bg-black text-amber-300 border-amber-400 ring-2 ring-amber-400'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div>
                  <div className="font-bold">High Contrast Industrial</div>
                  <div className="text-[11px] opacity-75">Maximum visibility for safety-critical telemetry audits.</div>
                </div>
                {theme === 'high-contrast' && <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
