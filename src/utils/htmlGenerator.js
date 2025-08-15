// HTML generator for health report summaries using LLM
const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = process.env.OPENAI_MODEL || 'gpt-5';

async function generateSummaryHTML(filename, summaryObj) {
  const htmlDir = path.join(__dirname, '../../summaries');
  if (!fs.existsSync(htmlDir)) {
    fs.mkdirSync(htmlDir, { recursive: true });
  }
  const htmlFilename = `summary_${path.parse(filename).name}.html`;
  const htmlPath = path.join(htmlDir, htmlFilename);

  // Compose prompt for GPT to generate HTML
  const prompt = `System Role / Instruction:
You are an AI Medical PDF Report Generator. Your task is to read a raw medical lab report and produce a patient-friendly summary in PDF format.
The output must be clear, visually appealing, color-coded, and medically accurate. Avoid making diagnoses; instead, explain findings in simple language.

Output Sections & Requirements:

Header Section

Patient Name, Age, Gender, Report Date

Lab Report Number (if available)

A short title: "Patient-Friendly Health Summary"

Summary Table of Results

Table columns: Parameter, Patient Value, Reference Range, Status (Normal / Low / High)

Use color-coding:

🟢 Green → Normal

🔴 Red → Abnormal

🟡 Yellow → Borderline

If data is missing, write "Not Provided" in gray.

Parameter-Wise Explanation
For each parameter:

Description: Explain what it measures in simple terms.

Your Result: Show value & highlight if it’s out of range.

Possible Causes: List common reasons for abnormality (no diagnosis).

Suggested Next Steps: Suggest consulting a doctor, lifestyle tweaks, or retesting if needed.

Lifestyle & Diet Recommendations

Provide personalized suggestions based on abnormal values.

Include diet tips, exercise habits, and general health advice.

Error Handling Rule

If any parameter has conflicting values, show:
"⚠ Possible discrepancy detected — please retest before making conclusions."

Design & PDF Style

Use clear section headers with bold fonts.

Color-code abnormal/normal/borderline results.

Use a modern clean layout with enough spacing for readability.\n\nJSON object to use:\n${JSON.stringify(summaryObj, null, 2)}\n\nOutput: Return a single standalone HTML file (with embedded CSS and JS) ready to run locally. No explanations, no markdown.`;

  // Call OpenAI to get HTML (prefer Responses API for GPT-5 and newer)
  const maxOutputTokens = Number(process.env.OPENAI_MAX_OUTPUT_TOKENS || 4096);
  let html;
  try {
    const response = await openai.responses.create({
      model: MODEL,
      input: [
        { role: 'system', content: 'You are an expert front-end developer.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      max_output_tokens: maxOutputTokens
    });
    html = (response.output_text || '').trim();
    // Fallback parse in case output_text is not populated
    if (!html && Array.isArray(response.output)) {
      const parts = response.output[0]?.content || [];
      const textPart = parts.find(p => p.type === 'output_text' || p.type === 'text');
      html = (textPart?.text || '').trim();
    }
  } catch (err) {
    // Fallback to Chat Completions for older models or SDKs
    const fallbackModel = MODEL === 'gpt-5' ? 'gpt-4o' : MODEL;
    const response = await openai.chat.completions.create({
      model: fallbackModel,
      messages: [
        { role: 'system', content: 'You are an expert front-end developer.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0,
      max_tokens: maxOutputTokens
    });
    html = response.choices?.[0]?.message?.content?.trim();
  }

  if (!html) {
    throw new Error('Model returned empty HTML output.');
  }
  // Write HTML to file
  fs.writeFileSync(htmlPath, html);
  return htmlFilename;
}

module.exports = { generateSummaryHTML };