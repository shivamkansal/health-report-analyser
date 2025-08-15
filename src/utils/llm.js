// OpenAI LLM integration for generating patient-friendly summaries
require('dotenv').config();
const { OpenAI } = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generatePatientFriendlySummary(extractedJson) {
  // Compose prompt from extracted findings
  // const findings = extractedJson.findings || [];
  console.log(extractedJson,
    "extractedJson")
  let prompt = `Summarize the following health report findings (pathology or radiology report) in non-technical, patient-friendly language. Categorize each finding with description, provide suggested outcomes/inferences in detail, and include factual data only (such as minimum temperature if available):\n`;
  if (extractedJson) {
    prompt += `\n\nRaw report text (for context):\n${extractedJson}`;
  }

  // Enhanced prompt for structured, relevant, and image-enriched output
  prompt += `\n\nReturn the summary in the following structured JSON format:\n{
  \"summary\": \"...\",
  \"sections\": [
    {
      \"title\": \"...\",
      \"description\": \"...\",
      \"relevance\": \"High|Medium|Low\",
      \"image_url\": \"(suggest a relevant public medical image URL or leave blank)\"
    },
    ...
  ]
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: 'You are a medical assistant that explains health reports in structured, patient-friendly language, and returns structured JSON for PDF generation.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.3,
    max_tokens: 3200
  });

  // Try to parse the response as JSON
  let content = response.choices[0].message.content.trim();
  try {
    const json = JSON.parse(content);
    return json;
  } catch (e) {
    // fallback: return raw content
    return { summary: content, sections: [] };
  }
}

module.exports = { generatePatientFriendlySummary };
