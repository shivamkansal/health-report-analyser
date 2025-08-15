// HTML generator for health report summaries using LLM
const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateSummaryHTML(filename, summaryObj) {
  const htmlDir = path.join(__dirname, '../../summaries');
  if (!fs.existsSync(htmlDir)) {
    fs.mkdirSync(htmlDir, { recursive: true });
  }
  const htmlFilename = `summary_${path.parse(filename).name}.html`;
  const htmlPath = path.join(htmlDir, htmlFilename);

  // Compose prompt for GPT to generate HTML
  const prompt = `You are an expert front-end developer and UI/UX designer specializing in Canva-style, infographic-rich, patient-friendly health dashboards.\n\nYour task: Generate a complete, modern, mobile-first, responsive HTML5/CSS3/JavaScript web page to visualize a SMARTREPORT health report from the JSON below.\n\nDesign/UX requirements:\n- Use inspiration from Canva, Material Design, and the best dashboards from Mayo Clinic, Cleveland Clinic, ADA, and MedlinePlus.\n- Include a dashboard overview with key metrics as chips/cards.\n- Multi-page navigation (side nav or top nav, hash-based routing), with Next/Prev links between sections.\n- Each section:\n  - Title, summary of findings, table of results (with reference ranges), lifestyle suggestions (no medicines), and doctor referral advice.\n  - Color-coded badges for priority: High (red), Medium (orange/yellow), Low (green).\n- Search bar to filter sections/cards.\n- Expand All button for print view.\n- Print/Save PDF button (with print-optimized CSS).\n- Fully dark theme, modern, clean, and mobile-friendly.\n- Use only semantic HTML5, modern CSS (no frameworks), and vanilla JS.\n- Accessible: semantic roles, aria-labels, keyboard-friendly.\n\nData requirements:\n- Use the provided JSON object directly in a <script> tag.\n- Pre-populate with example patient data: Name: Mr. Subhash Kansal, Age 59, date auto-generated.\n- Sections: Dashboard, Iron & Anemia, Diabetes, Lipids, Liver/Kidney, Urine Examination, Inflammation, Vitamins, Thyroid, CBC, Care Plan.\n- Each section should have realistic, evidence-based ranges and targets.\n\nJSON object to use:\n${JSON.stringify(summaryObj, null, 2)}\n\nOutput: Return a single standalone HTML file (with embedded CSS and JS) ready to run locally. No explanations, no markdown.`;
  // Call OpenAI to get HTML
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: 'You are an expert front-end developer.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.2,
    max_tokens: 4096
  });

  let html = response.choices[0].message.content.trim();
  // Write HTML to file
  fs.writeFileSync(htmlPath, html);
  return htmlFilename;
}

module.exports = { generateSummaryHTML };
