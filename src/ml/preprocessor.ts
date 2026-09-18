import { RawChillerRecord, DataQualityReport } from '../types';

export const REQUIRED_COLUMNS = [
  'timestamp',
  'equipment_id',
  'Chilled Water Rate (L/sec)',
  'Cooling Water Temperature (C)',
  'Building Load (RT)',
  'Chiller Energy Consumption (kWh)',
  'Outside Temperature (F)',
  'Dew Point (F)',
  'Humidity (%)',
  'Wind Speed (mph)',
  'Pressure (in)'
];

// Column normalization map for tolerant CSV header matching
export function normalizeKey(key: string): string {
  const clean = key.trim().toLowerCase().replace(/[\s_\-\(\)\/]/g, '');
  if (clean === 'timestamp' || clean === 'time' || clean === 'datetime') return 'timestamp';
  if (clean === 'equipmentid' || clean === 'equipment' || clean === 'chiller' || clean === 'chillerid') return 'equipment_id';
  if (clean.includes('chilledwater') || clean.includes('chwrate') || clean.includes('chwlsec')) return 'Chilled Water Rate (L/sec)';
  if (clean.includes('coolingwater') || clean.includes('cwtemp') || clean.includes('cwtemperature')) return 'Cooling Water Temperature (C)';
  if (clean.includes('buildingload') || clean.includes('loadrt') || clean.includes('coolingload')) return 'Building Load (RT)';
  if (clean.includes('energy') || clean.includes('chillerenergy') || clean.includes('consumptionkwh') || clean.includes('powerkwh')) return 'Chiller Energy Consumption (kWh)';
  if (clean.includes('outsidetemp') || clean.includes('ambienttemp') || clean.includes('oat')) return 'Outside Temperature (F)';
  if (clean.includes('dewpoint') || clean.includes('dewpt')) return 'Dew Point (F)';
  if (clean.includes('humidity') || clean.includes('rh')) return 'Humidity (%)';
  if (clean.includes('windspeed') || clean.includes('wind')) return 'Wind Speed (mph)';
  if (clean.includes('pressure') || clean.includes('barometer')) return 'Pressure (in)';
  return key.trim();
}

export interface PreprocessingResult {
  records: Array<{
    timestamp: string;
    dateObj: Date;
    equipment_id: string;
    chilledWaterRate: number;
    coolingWaterTemp: number;
    buildingLoad: number;
    actualEnergy: number;
    outsideTemp: number;
    dewPoint: number;
    humidity: number;
    windSpeed: number;
    pressure: number;
    hour: number;
    dayOfWeek: number;
    month: number;
    isNight: boolean;
    laggedEnergy: number;
    rollingMeanEnergy: number;
    rollingStdEnergy: number;
    energyTrend: number;
  }>;
  qualityReport: DataQualityReport;
  errors: string[];
}

export function preprocessDataset(rawRows: any[]): PreprocessingResult {
  const errors: string[] = [];

  if (!rawRows || rawRows.length === 0) {
    return {
      records: [],
      qualityReport: {
        totalRecords: 0,
        validRows: 0,
        invalidRows: 0,
        equipmentUnits: [],
        dateRange: { start: '', end: '', durationDays: 0 },
        missingValuesByColumn: {},
        totalMissingValues: 0,
        duplicateRecords: 0,
        timestampGapsCount: 0,
        timestampGaps: [],
        nominalIntervalMinutes: 30,
        samplingConsistency: 100
      },
      errors: ['The uploaded file contains no data rows.']
    };
  }

  // Header mapping
  const firstRow = rawRows[0] || {};
  const headerMap: Record<string, string> = {};
  Object.keys(firstRow).forEach(key => {
    const norm = normalizeKey(key);
    headerMap[norm] = key;
  });

  // Check required columns
  const missingColumns: string[] = [];
  REQUIRED_COLUMNS.forEach(col => {
    if (!headerMap[col]) {
      missingColumns.push(col);
    }
  });

  if (missingColumns.length > 0) {
    errors.push(`Missing required column(s): ${missingColumns.join(', ')}`);
  }

  const missingValuesByCol: Record<string, number> = {};
  REQUIRED_COLUMNS.forEach(c => (missingValuesByCol[c] = 0));

  // Parse raw items with equipment and timestamp validation
  type IntermediateRow = {
    originalIndex: number;
    timestamp: string;
    dateObj: Date;
    equipment_id: string;
    chilledWaterRate: number | null;
    coolingWaterTemp: number | null;
    buildingLoad: number | null;
    actualEnergy: number | null;
    outsideTemp: number | null;
    dewPoint: number | null;
    humidity: number | null;
    windSpeed: number | null;
    pressure: number | null;
    isValid: boolean;
  };

  const parsedRows: IntermediateRow[] = [];
  const seenPair = new Set<string>();
  let duplicateCount = 0;
  let invalidRowsCount = 0;

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    const rawTs = row[headerMap['timestamp'] || 'timestamp'];
    const rawEq = row[headerMap['equipment_id'] || 'equipment_id'];

    if (!rawTs || !rawEq) {
      invalidRowsCount++;
      continue;
    }

    const dateObj = new Date(rawTs);
    if (isNaN(dateObj.getTime())) {
      invalidRowsCount++;
      continue;
    }

    const eqId = String(rawEq).trim().toUpperCase();
    const pairKey = `${eqId}__${dateObj.toISOString()}`;
    if (seenPair.has(pairKey)) {
      duplicateCount++;
      // Keep only first occurrence of duplicate observation
      continue;
    }
    seenPair.add(pairKey);

    const parseNum = (colName: string): number | null => {
      const origKey = headerMap[colName] || colName;
      const val = row[origKey];
      if (val === undefined || val === null || val === '' || isNaN(Number(val))) {
        missingValuesByCol[colName] = (missingValuesByCol[colName] || 0) + 1;
        return null;
      }
      return Number(val);
    };

    parsedRows.push({
      originalIndex: i,
      timestamp: dateObj.toISOString(),
      dateObj,
      equipment_id: eqId,
      chilledWaterRate: parseNum('Chilled Water Rate (L/sec)'),
      coolingWaterTemp: parseNum('Cooling Water Temperature (C)'),
      buildingLoad: parseNum('Building Load (RT)'),
      actualEnergy: parseNum('Chiller Energy Consumption (kWh)'),
      outsideTemp: parseNum('Outside Temperature (F)'),
      dewPoint: parseNum('Dew Point (F)'),
      humidity: parseNum('Humidity (%)'),
      windSpeed: parseNum('Wind Speed (mph)'),
      pressure: parseNum('Pressure (in)'),
      isValid: true
    });
  }

  // Group by equipment_id and sort chronologically
  const equipmentGroups: Record<string, IntermediateRow[]> = {};
  parsedRows.forEach(r => {
    if (!equipmentGroups[r.equipment_id]) {
      equipmentGroups[r.equipment_id] = [];
    }
    equipmentGroups[r.equipment_id].push(r);
  });

  const timestampGaps: DataQualityReport['timestampGaps'] = [];
  const processedRecords: PreprocessingResult['records'] = [];

  // Preprocess each equipment time series independently
  Object.keys(equipmentGroups).forEach(eqId => {
    const group = equipmentGroups[eqId];
    group.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

    // Calculate medians for fallback imputation
    const getMedian = (getter: (r: IntermediateRow) => number | null, fallback: number): number => {
      const vals = group.map(getter).filter((v): v is number => v !== null && !isNaN(v));
      if (vals.length === 0) return fallback;
      vals.sort((a, b) => a - b);
      const mid = Math.floor(vals.length / 2);
      return vals.length % 2 !== 0 ? vals[mid] : (vals[mid - 1] + vals[mid]) / 2;
    };

    const medians = {
      chilledWaterRate: getMedian(r => r.chilledWaterRate, 120),
      coolingWaterTemp: getMedian(r => r.coolingWaterTemp, 28),
      buildingLoad: getMedian(r => r.buildingLoad, 350),
      actualEnergy: getMedian(r => r.actualEnergy, 180),
      outsideTemp: getMedian(r => r.outsideTemp, 78),
      dewPoint: getMedian(r => r.dewPoint, 62),
      humidity: getMedian(r => r.humidity, 60),
      windSpeed: getMedian(r => r.windSpeed, 5),
      pressure: getMedian(r => r.pressure, 29.92)
    };

    // Impute missing values per column with linear interpolation and median fallback
    const numericCols = [
      'chilledWaterRate',
      'coolingWaterTemp',
      'buildingLoad',
      'actualEnergy',
      'outsideTemp',
      'dewPoint',
      'humidity',
      'windSpeed',
      'pressure'
    ] as const;

    numericCols.forEach(col => {
      for (let i = 0; i < group.length; i++) {
        if (group[i][col] === null) {
          // Look ahead for next valid
          let nextIdx = -1;
          for (let j = i + 1; j < Math.min(group.length, i + 6); j++) {
            if (group[j][col] !== null) {
              nextIdx = j;
              break;
            }
          }

          const prevVal = i > 0 ? group[i - 1][col] : null;
          const nextVal = nextIdx !== -1 ? group[nextIdx][col] : null;

          if (prevVal !== null && nextVal !== null) {
            // Linear interpolation
            const ratio = 1 / (nextIdx - (i - 1));
            group[i][col] = prevVal + (nextVal - prevVal) * ratio;
          } else if (prevVal !== null) {
            group[i][col] = prevVal; // Forward fill
          } else if (nextVal !== null) {
            group[i][col] = nextVal; // Backward fill
          } else {
            group[i][col] = medians[col]; // Median fallback
          }
        }
      }
    });

    // Detect timestamp gaps and create temporal features
    for (let i = 0; i < group.length; i++) {
      const current = group[i];

      // Check gap with previous observation
      if (i > 0) {
        const prev = group[i - 1];
        const diffMinutes = (current.dateObj.getTime() - prev.dateObj.getTime()) / (1000 * 60);
        // Nominal interval is 30 mins; flag if gap > 45 mins
        if (diffMinutes > 45) {
          timestampGaps.push({
            equipmentId: eqId,
            gapStart: prev.timestamp,
            gapEnd: current.timestamp,
            gapDurationMinutes: Math.round(diffMinutes)
          });
        }
      }

      // Feature engineering
      const hour = current.dateObj.getHours();
      const dayOfWeek = current.dateObj.getDay();
      const month = current.dateObj.getMonth() + 1;
      const isNight = hour < 6 || hour >= 20;

      const laggedEnergy = i > 0 ? (group[i - 1].actualEnergy as number) : (current.actualEnergy as number);

      // Rolling 6-step (3 hours) window
      const winStart = Math.max(0, i - 5);
      const energyWindow: number[] = [];
      for (let w = winStart; w <= i; w++) {
        energyWindow.push(group[w].actualEnergy as number);
      }
      const mean = energyWindow.reduce((a, b) => a + b, 0) / energyWindow.length;
      const variance = energyWindow.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / energyWindow.length;
      const std = Math.sqrt(variance);

      // Recent trend: difference between current and 2-step prior
      const trend = i >= 2 ? (current.actualEnergy as number) - (group[i - 2].actualEnergy as number) : 0;

      processedRecords.push({
        timestamp: current.timestamp,
        dateObj: current.dateObj,
        equipment_id: eqId,
        chilledWaterRate: current.chilledWaterRate as number,
        coolingWaterTemp: current.coolingWaterTemp as number,
        buildingLoad: current.buildingLoad as number,
        actualEnergy: current.actualEnergy as number,
        outsideTemp: current.outsideTemp as number,
        dewPoint: current.dewPoint as number,
        humidity: current.humidity as number,
        windSpeed: current.windSpeed as number,
        pressure: current.pressure as number,
        hour,
        dayOfWeek,
        month,
        isNight,
        laggedEnergy,
        rollingMeanEnergy: Number(mean.toFixed(2)),
        rollingStdEnergy: Number(std.toFixed(2)),
        energyTrend: Number(trend.toFixed(2))
      });
    }
  });

  // Calculate overall date range
  const allDates = processedRecords.map(r => r.dateObj.getTime());
  const minDate = allDates.length > 0 ? new Date(Math.min(...allDates)) : new Date();
  const maxDate = allDates.length > 0 ? new Date(Math.max(...allDates)) : new Date();
  const durationDays = allDates.length > 0 ? Math.max(1, Math.round((maxDate.getTime() - minDate.getTime()) / (1000 * 3600 * 24))) : 0;

  const totalMissing = Object.values(missingValuesByCol).reduce((a, b) => a + b, 0);

  const qualityReport: DataQualityReport = {
    totalRecords: rawRows.length,
    validRows: processedRecords.length,
    invalidRows: invalidRowsCount,
    equipmentUnits: Object.keys(equipmentGroups).sort(),
    dateRange: {
      start: minDate.toISOString(),
      end: maxDate.toISOString(),
      durationDays
    },
    missingValuesByColumn: missingValuesByCol,
    totalMissingValues: totalMissing,
    duplicateRecords: duplicateCount,
    timestampGapsCount: timestampGaps.length,
    timestampGaps: timestampGaps.slice(0, 100), // Keep top 100 for responsive UI
    nominalIntervalMinutes: 30,
    samplingConsistency: rawRows.length > 0 ? Number(((1 - (timestampGaps.length * 2) / Math.max(1, rawRows.length)) * 100).toFixed(1)) : 100
  };

  return {
    records: processedRecords,
    qualityReport,
    errors
  };
}
