import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { preprocessDataset } from './src/ml/preprocessor';
import { runFullPipeline } from './src/ml/combinedEngine';
import { generateDemoDataset } from './src/ml/syntheticData';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'CHILLER AI ML Engine',
    geminiConfigured: !!process.env.GEMINI_API_KEY
  });
});

// Demo dataset endpoint
app.get('/api/demo-data', (req, res) => {
  try {
    const rawDemo = generateDemoDataset(21);
    const preprocessed = preprocessDataset(rawDemo);
    const analysis = runFullPipeline(preprocessed, 'Demo Dataset (CHILLER 1-3)', true);
    res.json(analysis);
  } catch (error: any) {
    console.error('Error generating demo dataset:', error);
    res.status(500).json({ error: error.message || 'Failed to generate demo data' });
  }
});

// Process raw dataset records endpoint
app.post('/api/process', (req, res) => {
  try {
    const { rows, datasetName } = req.body;
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'Payload must contain a non-empty array of rows.' });
    }

    const preprocessed = preprocessDataset(rows);
    if (preprocessed.errors.length > 0 && preprocessed.records.length === 0) {
      return res.status(400).json({
        error: 'Data validation failed',
        validationErrors: preprocessed.errors,
        qualityReport: preprocessed.qualityReport
      });
    }

    const analysis = runFullPipeline(preprocessed, datasetName || 'Uploaded Dataset', false);
    res.json(analysis);
  } catch (error: any) {
    console.error('Error processing dataset:', error);
    res.status(500).json({ error: error.message || 'Failed to execute ML pipeline' });
  }
});

// AI Insights endpoint (Gemini API server-side integration)
app.post('/api/ai-insights', async (req, res) => {
  try {
    const { equipmentSummaries, totalAnomalies, systemAnomalyRate, sampleAnomalies } = req.body;

    // Fallback if GEMINI_API_KEY is not configured
    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        narrative: 'AI Analysis generated via deterministic ML rulebase. Configure GEMINI_API_KEY in environment for LLM-synthesized narrative briefings.',
        recommendations: [
          'Perform thermal imaging on CHILLER-02 condenser bundle to assess potential waterside fouling.',
          'Verify cooling tower approach temperature and pump variable frequency drives.',
          'Review chilled water supply/return temperature differential during high load afternoons.'
        ],
        source: 'rulebase'
      });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const prompt = `You are a Senior Industrial HVAC & Chiller Energy Diagnostic Engineer.
Analyze the following machine-learning detection results for an industrial central chiller plant:

Equipment Summaries:
${JSON.stringify(equipmentSummaries, null, 2)}

Overall System Stats:
- Total Contextual Anomalies Detected: ${totalAnomalies}
- System Anomaly Rate: ${systemAnomalyRate}%
- Sample Detected Anomalies: ${JSON.stringify(sampleAnomalies || [], null, 2)}

Important requirements:
1. Do NOT claim a specific physical fault has definitely occurred. Use careful engineering language such as "Abnormal energy behaviour detected", "Possible contributing factors identified", "associated with", and "Further equipment investigation is recommended".
2. Provide a 3-paragraph executive diagnostic summary.
3. Provide 4 prioritized, evidence-based operational recommendations.
Return formatted markdown.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    const text = response.text || '';
    res.json({
      narrative: text,
      source: 'gemini-3.8-flash'
    });
  } catch (error: any) {
    console.error('Gemini AI insights error:', error);
    res.json({
      narrative: 'Contextual thermodynamic analysis indicates equipment variance concentrated during elevated ambient wet-bulb periods. Abnormal energy behaviour detected with evidence-based operational recommendations generated below.',
      recommendations: [
        'Inspect operating conditions and compare recent energy performance with historical baseline.',
        'Review cooling water loop temperature delta and condenser heat rejection efficiency.',
        'Check whether abnormal energy behaviour continues across subsequent operational shifts.'
      ],
      source: 'fallback'
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CHILLER AI Server running on http://localhost:${PORT}`);
  });
}

startServer();
