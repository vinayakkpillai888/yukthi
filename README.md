# CHILLER AI – Intelligent Energy & Equipment Monitoring
**YUKTHI 2026 National-Level Hackathon Challenge Project**
*Tagline: "Detect. Understand. Assess. Act."*

---

## 1. Executive Summary
Modern central plants and district cooling facilities consume significant percentages of a facility's total energy budget. Traditional threshold-based building management systems (BMS) rely on arbitrary static boundaries (e.g. `Energy > 200 kWh`) that trigger frequent false alarms or completely fail during low-load intervals.

**CHILLER AI** is an intelligent end-to-end energy and equipment monitoring platform that ingests historical operational data, evaluates thermodynamic context, and detects abnormal operational behaviour using a dual-model machine-learning architecture.

```
Operational Data
      ↓
Data Preprocessing & Quality Audit
      ↓
Dual-Model ML Analysis (Expected Energy Regression + Multivariate Isolation Forest)
      ↓
Combined Anomaly & Health Assessment
      ↓
Contextual Interpretation & Evidence Ranking
      ↓
Actionable Operational Recommendations
```

---

## 2. YUKTHI 2026 Data Specification
The system natively ingests CSV files adhering to the 11-field specification:
1. `timestamp` (ISO 8601 or standard datetime)
2. `equipment_id` (Categorical identifier e.g. `CHILLER-01`, `CHILLER-02`, `CHILLER-03`)
3. `Chilled Water Rate (L/sec)` (Evaporator volumetric loop flow)
4. `Cooling Water Temperature (C)` (Condenser water entering temperature)
5. `Building Load (RT)` (Cooling tonnage demanded by facility)
6. `Chiller Energy Consumption (kWh)` (Actual measured electrical draw)
7. `Outside Temperature (F)` (Ambient dry-bulb temperature)
8. `Dew Point (F)` (Psychrometric ambient moisture context)
9. `Humidity (%)` (Relative humidity)
10. `Wind Speed (mph)` (Atmospheric wind speed)
11. `Pressure (in)` (Barometric pressure)

### Data Validation & Quality Pipeline
- **Missing Value Handling:** Equipment-specific linear interpolation for isolated dropouts (1–5 steps), short edge forward/backward filling, and equipment-specific median fallback.
- **Deduplication:** Automatic deduplication of identical `(equipment_id, timestamp)` tuples.
- **Timestamp Gaps:** Time series delta checks flag non-continuous intervals (>45 min for nominal 30 min sampling) without falsely classifying downtime as equipment anomalies.
- **Chronological Split:** 75% train / 25% test chronological train/test split to prevent temporal data leakage.

---

## 3. Dual-Model Machine Learning Engine

### Model 1: Contextual Expected Energy Regression
A contextual thermodynamic estimator predicting the expected energy consumption:
$$P_{expected} = f(\text{Building Load}, \text{Cooling Temp}, \text{Chilled Water Rate}, \text{Outside Temp}, \text{Dew Point}, \text{Humidity}, \text{Diurnal Harmonics}, \text{Lagged Energy})$$

- **Energy Residual:** $\text{Residual} = \text{Actual Energy} - \text{Expected Energy}$
- **Percentage Deviation:** $\text{Deviation \%} = \frac{\text{Actual} - \text{Expected}}{\text{Expected}} \times 100$

### Model 2: Multivariate Anomaly Detection (Isolation Forest)
An unsupervised ensemble of isolation trees partitioning the 9-dimensional operational space:
- Normalizes path length using the standard harmonic expectation:
  $$c(n) = 2 \ln(n - 1) + 0.5772156649 - \frac{2(n-1)}{n}$$
- Computes anomaly score $s(x, n) = 2^{-\frac{E(h(x))}{c(n)}}$.
- Observations with scores $> 0.60$ represent statistically rare multi-parameter operational coordinate excursions.

---

## 4. Combined Anomaly & Equipment Health Scoring

### Severity States
1. **NORMAL:** Energy within nominal variance ($\pm 10\%$) and normal multidimensional density.
2. **WATCH:** Minor deviation ($>12\%$) or isolated transient observation.
3. **WARNING:** Significant residual ($>18\%$) paired with elevated multivariate score ($>0.55$) or 2-step persistence.
4. **CRITICAL:** High residual ($>25\%$), high iForest score ($>0.68$), and multi-step temporal persistence.

### Equipment Health Score (0 – 100)
Calibrated per equipment unit based on anomaly frequency, severity weighting, and recent operational stability:
- `CHILLER-01: 92/100 (HEALTHY)`
- `CHILLER-02: 61/100 (WARNING)`
- `CHILLER-03: 87/100 (HEALTHY)`

*Wording is strictly analytical and evidence-based, avoiding speculative physical fault claims.*

---

## 5. User Interface & Dashboards
1. **Overview:** System KPIs, chiller health cards with trend sparklines, actual vs expected energy timeline, and equipment comparison.
2. **Equipment Monitoring:** Per-chiller telemetry, time series zoom, date range filtering, and abnormal period deep-links.
3. **Anomaly Investigation:** Interactive filterable anomaly table with 4-question investigation panel:
   - *What Happened?*
   - *Why Is It Unusual?*
   - *What Evidence Supports It?*
   - *What Should Be Investigated?*
4. **Energy Analysis:** Bivariate scatter plots (Building Load vs Energy, Cooling Water Temp vs Energy, Flow Rate vs Energy), residual histograms, and severity distribution.
5. **Data Quality:** Validation metrics, missing values by column, timestamp gap audit, and sampling consistency.
6. **AI Insights:** Automatic autonomous findings and Gemini 3.8 Flash Industrial Copilot synthesis.

---

## 6. Running the Project
```bash
# Install dependencies
npm install

# Start development full-stack server (Port 3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start
```
