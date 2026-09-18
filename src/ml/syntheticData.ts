import { RawChillerRecord } from '../types';

/**
 * Generates a realistic synthetic dataset adhering strictly to the YUKTHI 2026 Data Specification.
 * Contains 3 equipment units: CHILLER-01, CHILLER-02, and CHILLER-03.
 * Sampling interval: 30 minutes with realistic diurnal patterns and contextual anomalies.
 */
export function generateDemoDataset(days: number = 21): RawChillerRecord[] {
  const records: RawChillerRecord[] = [];
  const equipmentUnits = ['CHILLER-01', 'CHILLER-02', 'CHILLER-03'];

  // Start 21 days ago
  const startTime = new Date(Date.now() - days * 24 * 3600 * 1000);
  // Round to nearest 30 min
  startTime.setMinutes(startTime.getMinutes() >= 30 ? 30 : 0, 0, 0);

  const totalSteps = days * 48; // 48 intervals per day

  for (let step = 0; step < totalSteps; step++) {
    // Occasional temporal gap simulation (e.g. at step 120 and 340) to showcase data quality gap detection
    if (step === 120 || step === 340) {
      continue;
    }

    const currentTs = new Date(startTime.getTime() + step * 30 * 60 * 1000);
    const tsIso = currentTs.toISOString();

    const hour = currentTs.getHours() + currentTs.getMinutes() / 60;
    const dayOfWeek = currentTs.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Environmental simulation (diurnal temperature curve)
    // Night minimum ~65F, afternoon peak ~88F
    const tempDiurnal = Math.sin(((hour - 9) / 24) * 2 * Math.PI);
    const outsideTemp = 74 + 14 * tempDiurnal + (Math.random() - 0.5) * 3;
    const humidity = Math.max(30, Math.min(95, 68 - 22 * tempDiurnal + (Math.random() - 0.5) * 6));
    const dewPoint = outsideTemp - ((100 - humidity) / 5);
    const windSpeed = Math.max(0.5, 6 + 4 * Math.sin(hour / 4) + (Math.random() - 0.5) * 2);
    const pressure = 29.85 + 0.15 * Math.cos(hour / 6) + (Math.random() - 0.5) * 0.04;

    // Base building cooling demand (RT)
    // Low at night (120-180 RT), high during business day (400-550 RT, lower on weekends)
    const occupancyFactor = isWeekend ? 0.45 : (hour >= 8 && hour <= 18 ? 1.0 : 0.35);
    const weatherLoad = Math.max(0, (outsideTemp - 65) * 8);
    const baseTotalLoad = 160 + occupancyFactor * 320 + weatherLoad + (Math.random() - 0.5) * 20;

    equipmentUnits.forEach((eqId, eqIdx) => {
      // Occasional missing value simulation (1 in 400 chance) to test robust imputation
      const hasMissingField = Math.random() < 0.003;

      // Equipment load allocation
      let unitLoad = baseTotalLoad / 3;
      if (eqId === 'CHILLER-01') unitLoad *= 1.05;
      if (eqId === 'CHILLER-02') unitLoad *= 1.0;
      if (eqId === 'CHILLER-03') unitLoad *= 0.95;

      unitLoad = Math.max(40, unitLoad);

      // Chilled water flow rate (L/sec) roughly scales with load
      const chilledWaterRate = unitLoad * 0.35 + (Math.random() - 0.5) * 4;

      // Cooling water entering temperature (C)
      // Affected by ambient wet-bulb/dew-point and cooling tower heat rejection
      let coolingWaterTemp = 24 + (dewPoint / 10) * 0.7 + (Math.random() - 0.5) * 0.8;

      // Thermodynamic expected power:
      // Base Chiller efficiency ~ 0.55 - 0.65 kW/RT
      const baselineKwPerRt = 0.58;
      let expectedKw = unitLoad * baselineKwPerRt + (coolingWaterTemp - 26) * 2.5;

      let actualKw = expectedKw + (Math.random() - 0.5) * 6; // normal statistical noise

      // Inject realistic contextual anomalies for testing:
      // CHILLER-02 exhibits recurrent contextual degradation (fouling / low heat rejection)
      // during high-ambient afternoons on days 5-8 and 14-17
      if (eqId === 'CHILLER-02') {
        const dayNum = Math.floor(step / 48);
        if ((dayNum >= 5 && dayNum <= 8 && hour >= 12 && hour <= 17) ||
            (dayNum >= 14 && dayNum <= 17 && hour >= 13 && hour <= 18)) {
          // Actual energy surges 28% to 38% above context expectation
          actualKw = expectedKw * 1.32 + Math.random() * 8;
          coolingWaterTemp += 2.8; // elevated condenser loop temperature
        }
      }

      // CHILLER-03 exhibits a transient watch excursion on day 11
      if (eqId === 'CHILLER-03') {
        const dayNum = Math.floor(step / 48);
        if (dayNum === 11 && hour >= 14 && hour <= 16) {
          actualKw = expectedKw * 1.18 + Math.random() * 4;
        }
      }

      records.push({
        timestamp: tsIso,
        equipment_id: eqId,
        'Chilled Water Rate (L/sec)': hasMissingField ? '' : Number(chilledWaterRate.toFixed(2)),
        'Cooling Water Temperature (C)': Number(coolingWaterTemp.toFixed(2)),
        'Building Load (RT)': Number(unitLoad.toFixed(2)),
        'Chiller Energy Consumption (kWh)': Number(actualKw.toFixed(2)),
        'Outside Temperature (F)': Number(outsideTemp.toFixed(2)),
        'Dew Point (F)': Number(dewPoint.toFixed(2)),
        'Humidity (%)': Number(humidity.toFixed(2)),
        'Wind Speed (mph)': Number(windSpeed.toFixed(2)),
        'Pressure (in)': Number(pressure.toFixed(2))
      });
    });
  }

  return records;
}
