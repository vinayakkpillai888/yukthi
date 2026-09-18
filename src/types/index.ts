export interface RawChillerRecord {
  timestamp: string;
  equipment_id: string;
  'Chilled Water Rate (L/sec)': number | string;
  'Cooling Water Temperature (C)': number | string;
  'Building Load (RT)': number | string;
  'Chiller Energy Consumption (kWh)': number | string;
  'Outside Temperature (F)': number | string;
  'Dew Point (F)': number | string;
  'Humidity (%)': number | string;
  'Wind Speed (mph)': number | string;
  'Pressure (in)': number | string;
  [key: string]: any;
}

export interface ProcessedRecord {
  id: string;
  index: number;
  timestamp: string;
  dateObj: Date;
  equipment_id: string;
  
  // Cleaned physical variables
  chilledWaterRate: number;     // L/sec
  coolingWaterTemp: number;     // C
  buildingLoad: number;         // RT (Refrigeration Tons)
  actualEnergy: number;         // kWh
  outsideTemp: number;          // F
  dewPoint: number;             // F
  humidity: number;             // %
  windSpeed: number;            // mph
  pressure: number;             // inHg

  // Derived Temporal Features
  hour: number;
  dayOfWeek: number;
  month: number;
  isNight: boolean;
  laggedEnergy: number;
  rollingMeanEnergy: number;
  rollingStdEnergy: number;
  energyTrend: number;

  // ML Outputs
  expectedEnergy: number;
  energyResidual: number;
  deviationPercent: number;
  multivariateScore: number;     // 0 to 1 (higher = more anomalous)
  persistenceCount: number;      // count of recent consecutive anomalies
  
  // Thermodynamic Efficiency Metrics
  kwPerRT: number;               // Specific power (kW / RT), lower is more efficient (~0.6-0.8)
  cop: number;                   // Coefficient of Performance = 3.517 / (kW/RT), higher is better (~4.5-5.8)
  kwhPerRT: number;              // Specific energy consumption (kWh / RT)
  
  // Sensor & Energy Categorized Alert
  alertType?: 'HIGH_ENERGY' | 'ABNORMAL_TEMP' | 'SENSOR_MISSING' | null;
  alertMessage?: string | null;

  // Combined Assessment
  severity: AnomalySeverity;     // NORMAL | WATCH | WARNING | CRITICAL
  isAnomaly: boolean;
  contributingFactors: ContributingFactor[];
  interpretation: string;
  recommendation: string;
}

export type AnomalySeverity = 'NORMAL' | 'WATCH' | 'WARNING' | 'CRITICAL';

export interface ContributingFactor {
  feature: string;
  displayName: string;
  observedValue: number;
  expectedValue?: number;
  unit: string;
  contributionScore: number; // 0 to 100
  direction: 'higher' | 'lower' | 'nominal';
}

export interface EquipmentSummary {
  equipmentId: string;
  healthScore: number;          // 0 to 100
  healthStatus: 'HEALTHY' | 'WATCH' | 'WARNING' | 'CRITICAL';
  totalObservations: number;
  anomalyCount: number;
  criticalCount: number;
  warningCount: number;
  watchCount: number;
  avgEnergy: number;
  avgExpectedEnergy: number;
  avgLoad: number;
  copEstimate: number;          // Estimated Coefficient of Performance (COP)
  avgKwPerRT: number;           // Average Specific Power (kW/RT)
  excessEnergyKWh: number;      // Accumulated energy waste in kWh
  potentialRupeeSavings: number;// ₹ estimated savings by correcting anomalies
  potentialCo2SavingsKg: number;// CO2 reduction (kg)
  lastDetectedAnomaly: string | null;
  lastObservationTime: string;
  energyTrendDirection: 'increasing' | 'stable' | 'decreasing';
  efficiencyRating: 'Excellent' | 'Good' | 'Fair' | 'Poor';
}

export interface EnergyForecastItem {
  hourOffset: number;           // +1, +2, +3...
  timeLabel: string;            // e.g. "14:00" or "In 1 hr"
  timestamp: string;
  predictedEnergy: number;      // e.g. 185 kWh
  confidenceLower: number;      // e.g. 176 kWh
  confidenceUpper: number;      // e.g. 194 kWh
  expectedLoad: number;         // RT
  expectedCop: number;
  expectedTemp: number;         // °F
  equipmentId: string;
}

export interface SystemAlert {
  id: string;
  timestamp: string;
  equipmentId: string;
  category: 'HIGH_ENERGY' | 'ABNORMAL_TEMP' | 'SENSOR_MISSING';
  severity: 'CRITICAL' | 'WARNING' | 'WATCH';
  title: string;
  message: string;              // e.g. "CH-02 is consuming 18% more energy than its normal pattern."
  metricValue: string;
  thresholdOrExpected: string;
  suggestedAction: string;      // e.g. "Reduce chilled-water flow by 12%"
  rupeeImpactPerHour: number;
}

export interface EnergySavingRecommendation {
  id: string;
  equipmentId: string;
  title: string;
  actionText: string;           // e.g. "Shift 120 RT load to CH-01 (More efficient chiller)"
  category: 'CHILLER_SHIFT' | 'FLOW_OPTIMIZATION' | 'CONDENSER_TEMP' | 'SETPOINT_TUNE';
  kwhSavingsPerDay: number;
  rupeeSavingsPerDay: number;   // In ₹
  co2SavingsKgPerDay: number;   // In kg CO2e
  payoffTime: string;
  evidence: string;
}

export interface ChillerLoadComparisonPoint {
  loadBin: string;              // e.g. "150-200 RT", "200-250 RT", "250-300 RT"
  loadRT: number;
  dataByChiller: Record<string, {
    avgEnergy: number;
    avgKwPerRT: number;
    cop: number;
    sampleCount: number;
  }>;
  mostEfficientChiller: string;
  leastEfficientChiller: string;
  potentialDeltaKWh: number;
}

export interface DataQualityReport {
  totalRecords: number;
  validRows: number;
  invalidRows: number;
  equipmentUnits: string[];
  dateRange: {
    start: string;
    end: string;
    durationDays: number;
  };
  missingValuesByColumn: Record<string, number>;
  totalMissingValues: number;
  duplicateRecords: number;
  timestampGapsCount: number;
  timestampGaps: Array<{
    equipmentId: string;
    gapStart: string;
    gapEnd: string;
    gapDurationMinutes: number;
  }>;
  nominalIntervalMinutes: number;
  samplingConsistency: number; // %
}

export interface MLPipelineMetrics {
  regressionR2: number;
  regressionRMSE: number;
  regressionMAE: number;
  anomalyRatio: number;
  trainTestSplitRatio: number;
  totalTrainedSamples: number;
  modelType: string;
  isolationForestTrees: number;
}

export interface AnalysisResult {
  isDemoData: boolean;
  datasetName: string;
  records: ProcessedRecord[];
  equipmentSummaries: Record<string, EquipmentSummary>;
  dataQuality: DataQualityReport;
  pipelineMetrics: MLPipelineMetrics;
  overallHealthScore: number;
  systemAnomalyRate: number;
  totalAnomalies: number;
  topInsights: string[];
  
  // Newly Added Core Analysis Products
  systemAlerts: SystemAlert[];
  forecastsByChiller: Record<string, EnergyForecastItem[]>;
  plantForecast: EnergyForecastItem[];
  recommendations: EnergySavingRecommendation[];
  loadComparison: ChillerLoadComparisonPoint[];
  totalPotentialRupeeSavingsPerDay: number;
  totalKWhSavingsPerDay: number;
  totalCo2SavingsKgPerDay: number;
}
