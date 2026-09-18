import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  ScatterChart as ScatterIcon,
  PieChart as PieIcon,
  Zap,
  Thermometer,
  Droplets,
  Layers,
  Filter
} from 'lucide-react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import { ProcessedRecord, EquipmentSummary } from '../types';

interface EnergyAnalysisViewProps {
  records: ProcessedRecord[];
  equipmentSummaries: Record<string, EquipmentSummary>;
  onInspectAnomaly: (record: ProcessedRecord) => void;
}

export const EnergyAnalysisView: React.FC<EnergyAnalysisViewProps> = ({
  records,
  equipmentSummaries,
  onInspectAnomaly
}) => {
  const [selectedEquipment, setSelectedEquipment] = useState<string>('all');

  const availableUnits = useMemo(() => Object.keys(equipmentSummaries).sort(), [equipmentSummaries]);

  // Filter records by equipment if selected
  const activeRecords = useMemo(() => {
    if (selectedEquipment === 'all') return records;
    return records.filter(r => r.equipment_id === selectedEquipment);
  }, [records, selectedEquipment]);

  // Prepare scatter data for thermodynamic correlations (subsampled to ~250 points for snappy rendering)
  const scatterSamples = useMemo(() => {
    if (activeRecords.length === 0) return { normal: [], anomaly: [] };
    const step = Math.max(1, Math.floor(activeRecords.length / 280));
    const normal: any[] = [];
    const anomaly: any[] = [];

    for (let i = 0; i < activeRecords.length; i += step) {
      const r = activeRecords[i];
      const item = {
        load: r.buildingLoad,
        energy: r.actualEnergy,
        expectedEnergy: r.expectedEnergy,
        coolingTemp: r.coolingWaterTemp,
        flowRate: r.chilledWaterRate,
        outsideTemp: r.outsideTemp,
        equipment: r.equipment_id,
        timestamp: r.timestamp,
        severity: r.severity,
        multivariateScore: r.multivariateScore,
        rawRecord: r
      };

      if (r.severity === 'WARNING' || r.severity === 'CRITICAL') {
        anomaly.push(item);
      } else {
        normal.push(item);
      }
    }
    return { normal, anomaly };
  }, [activeRecords]);

  // Severity Distribution data
  const severityDistribution = useMemo(() => {
    let normal = 0;
    let watch = 0;
    let warning = 0;
    let critical = 0;

    activeRecords.forEach(r => {
      if (r.severity === 'CRITICAL') critical++;
      else if (r.severity === 'WARNING') warning++;
      else if (r.severity === 'WATCH') watch++;
      else normal++;
    });

    return [
      { name: 'Normal', value: normal, color: '#10b981' },
      { name: 'Watch', value: watch, color: '#3b82f6' },
      { name: 'Warning', value: warning, color: '#f59e0b' },
      { name: 'Critical', value: critical, color: '#f43f5e' }
    ];
  }, [activeRecords]);

  // Residual histogram distribution
  const residualHistogram = useMemo(() => {
    const bins: Record<string, number> = {
      '<-20%': 0,
      '-20% to -10%': 0,
      '-10% to 0%': 0,
      '0% to +10%': 0,
      '+10% to +20%': 0,
      '+20% to +30%': 0,
      '>+30%': 0
    };

    activeRecords.forEach(r => {
      const dev = r.deviationPercent;
      if (dev < -20) bins['<-20%']++;
      else if (dev < -10) bins['-20% to -10%']++;
      else if (dev < 0) bins['-10% to 0%']++;
      else if (dev < 10) bins['0% to +10%']++;
      else if (dev < 20) bins['+10% to +20%']++;
      else if (dev < 30) bins['+20% to +30%']++;
      else bins['>+30%']++;
    });

    return Object.entries(bins).map(([bin, count]) => ({ bin, count }));
  }, [activeRecords]);

  return (
    <div className="space-y-6">
      {/* Header filter strip */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            Thermodynamic Energy Correlations &amp; Residual Distributions
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Bivariate statistical relationships between physical variables, energy consumption, and contextual deviations
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">Filter Equipment:</span>
          <select
            value={selectedEquipment}
            onChange={e => setSelectedEquipment(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 text-xs font-semibold focus:outline-hidden"
          >
            <option value="all">All Equipment</option>
            {availableUnits.map(eq => (
              <option key={eq} value={eq}>{eq}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid of Thermodynamic Scatter Plots */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plot 1: Building Load vs Energy */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Building Load (RT) vs. Chiller Energy Consumption (kWh)
            </h3>
            <span className="text-[11px] text-slate-500">Thermodynamic Demand Curve</span>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Green = Contextually Normal | Red = Flagged Anomaly Excursion
          </p>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" dataKey="load" name="Building Load" unit=" RT" stroke="#94a3b8" fontSize={11} />
                <YAxis type="number" dataKey="energy" name="Actual Energy" unit=" kWh" stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-2.5 rounded-lg shadow-xl text-xs space-y-1">
                          <p className="font-semibold text-blue-300">{d.equipment} ({d.severity})</p>
                          <p>Load: <strong>{d.load} RT</strong></p>
                          <p>Actual Energy: <strong>{d.energy} kWh</strong></p>
                          <p>Expected: <strong>{d.expectedEnergy} kWh</strong></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend verticalAlign="top" height={30} wrapperStyle={{ fontSize: 11 }} />
                <Scatter name="Normal Observation" data={scatterSamples.normal} fill="#10b981" opacity={0.6} />
                <Scatter name="Abnormal Deviation" data={scatterSamples.anomaly} fill="#f43f5e" opacity={0.9} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Plot 2: Cooling Water Temp vs Energy */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-emerald-600" />
              Cooling Water Temp (°C) vs. Energy (kWh)
            </h3>
            <span className="text-[11px] text-slate-500">Condenser Heat Rejection Lift</span>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Shows compressor lift degradation when condenser loop temperature is elevated
          </p>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" dataKey="coolingTemp" name="Cooling Temp" unit=" °C" stroke="#94a3b8" fontSize={11} domain={['auto', 'auto']} />
                <YAxis type="number" dataKey="energy" name="Actual Energy" unit=" kWh" stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-2.5 rounded-lg shadow-xl text-xs space-y-1">
                          <p className="font-semibold text-blue-300">{d.equipment} ({d.severity})</p>
                          <p>Cooling Water: <strong>{d.coolingTemp} °C</strong></p>
                          <p>Energy: <strong>{d.energy} kWh</strong></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend verticalAlign="top" height={30} wrapperStyle={{ fontSize: 11 }} />
                <Scatter name="Normal Observation" data={scatterSamples.normal} fill="#3b82f6" opacity={0.6} />
                <Scatter name="Abnormal Deviation" data={scatterSamples.anomaly} fill="#f43f5e" opacity={0.9} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Plot 3: Chilled Water Rate vs Energy */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Droplets className="w-4 h-4 text-blue-500" />
              Chilled Water Rate (L/sec) vs. Energy (kWh)
            </h3>
            <span className="text-[11px] text-slate-500">Hydronic Evaporator Loop</span>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Evaporator pumping flow correlation against refrigeration energy draw
          </p>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" dataKey="flowRate" name="Flow Rate" unit=" L/s" stroke="#94a3b8" fontSize={11} domain={['auto', 'auto']} />
                <YAxis type="number" dataKey="energy" name="Actual Energy" unit=" kWh" stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-2.5 rounded-lg shadow-xl text-xs space-y-1">
                          <p className="font-semibold text-blue-300">{d.equipment} ({d.severity})</p>
                          <p>Flow Rate: <strong>{d.flowRate} L/s</strong></p>
                          <p>Energy: <strong>{d.energy} kWh</strong></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend verticalAlign="top" height={30} wrapperStyle={{ fontSize: 11 }} />
                <Scatter name="Normal Observation" data={scatterSamples.normal} fill="#0ea5e9" opacity={0.6} />
                <Scatter name="Abnormal Deviation" data={scatterSamples.anomaly} fill="#f43f5e" opacity={0.9} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Plot 4: Anomaly Severity Distribution & Residual Histogram */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-purple-600" />
                Anomaly Severity Breakdown &amp; Residual Deviation Spread
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Distribution of operational intervals across calibrated ML severity states
            </p>

            <div className="grid grid-cols-2 gap-2 items-center">
              {/* Pie Chart */}
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={severityDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {severityDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend stats */}
              <div className="space-y-2 text-xs">
                {severityDistribution.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-1.5 rounded bg-slate-50 border border-slate-100">
                    <span className="flex items-center gap-2 font-medium text-slate-700">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      {item.name}
                    </span>
                    <span className="font-bold font-mono text-slate-900">
                      {item.value.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Histogram bar chart */}
          <div className="mt-4 pt-3 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-700 uppercase block mb-2">
              Residual Deviation % Histogram:
            </span>
            <div className="h-28">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={residualHistogram}>
                  <XAxis dataKey="bin" stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6366f1" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
