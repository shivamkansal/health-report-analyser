// PDF generation for health report summaries
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

async function generateSummaryPDF(filename, extractedJson, summaryObj) {
  const pdfDir = path.join(__dirname, '../../summaries');
  if (!fs.existsSync(pdfDir)) {
    fs.mkdirSync(pdfDir, { recursive: true });
  }
  const pdfFilename = `summary_${path.parse(filename).name}.pdf`;
  const pdfPath = path.join(pdfDir, pdfFilename);
  const doc = new PDFDocument();
  const stream = fs.createWriteStream(pdfPath);
  doc.pipe(stream);

  doc.fontSize(16).text(`Health Report Summary: ${filename}`, { align: 'center' });
  doc.moveDown();
  doc.fontSize(13).text('Extracted Findings:', { underline: true });
  const findings = extractedJson.findings || [];
  if (findings.length > 0) {
    findings.forEach(f => {
      doc.fontSize(11).text(`- ${f.category || 'General'}: ${f.name || ''} = ${f.value || ''} (Ref: ${f.reference_range || ''}) | ${f.interpretation || ''}`);
    });
  } else {
    doc.fontSize(11).text('No structured findings extracted.');
  }
  doc.moveDown();

  // Handle new structured summary format
  doc.fontSize(13).text('Patient-Friendly Summary:', { underline: true });
  if (summaryObj && typeof summaryObj === 'object' && summaryObj.summary && Array.isArray(summaryObj.sections)) {
    doc.fontSize(12).text(summaryObj.summary);
    doc.moveDown();
    summaryObj.sections.forEach(section => {
      doc.fontSize(12).fillColor('black').text(section.title || '', { underline: true });
      doc.fontSize(11).text(section.description || '', { indent: 20 });
      if (section.relevance) {
        doc.fontSize(10).fillColor('gray').text(`Relevance: ${section.relevance}`, { indent: 20 });
      }
      if (section.image_url) {
        try {
          // Only add images if the URL is accessible and PDFKit supports it
          const imageBuffer = require('sync-request')('GET', section.image_url).getBody();
          doc.image(imageBuffer, { fit: [150, 150], align: 'center' });
        } catch (e) {
          doc.fontSize(9).fillColor('red').text('Image could not be loaded.', { indent: 20 });
        }
      }
      doc.moveDown();
    });
  } else {
    doc.fontSize(11).text(typeof summaryObj === 'string' ? summaryObj : 'No summary available.');
  }

  doc.end();
  await new Promise(resolve => stream.on('finish', resolve));
  return pdfFilename;
}

module.exports = { generateSummaryPDF };
