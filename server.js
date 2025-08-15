const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const extractHealthDataFromFile = require('./src/utils/extractor');
const { generatePatientFriendlySummary } = require('./src/utils/llm');
const { generateSummaryHTML } = require('./src/utils/htmlGenerator');

const app = express();
app.use(cors());

const upload = multer({ dest: 'uploads/' });

app.post('/extract-and-summarize/', upload.array('files'), async (req, res) => {
  const files = req.files;
  const results = [];
  for (const file of files) {
    try {
      const buffer = fs.readFileSync(file.path);
      const extractedJson = await extractHealthDataFromFile(file.originalname, buffer);
      const summary = await generatePatientFriendlySummary(extractedJson);
      const htmlFilename = await generateSummaryHTML(file.originalname, summary);
      results.push({ filename: file.originalname, json: extractedJson, summary, html_filename: htmlFilename });
    } catch (e) {
      results.push({ filename: file.originalname, error: e.message });
    }
  }
  res.json({ results });
});

app.get('/download-html/:html_filename', (req, res) => {
  const htmlPath = path.join(__dirname, 'summaries', req.params.html_filename);
  if (!fs.existsSync(htmlPath)) {
    return res.status(404).json({ error: 'HTML not found.' });
  }
  res.download(htmlPath);
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
