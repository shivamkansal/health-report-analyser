const pdfParse = require('pdf-parse');
const Tesseract = require('tesseract.js');
const path = require('path');

async function extractTextFromPDF(buffer) {
  const data = await pdfParse(buffer);
  console.log(data,"pdf parsed")
  return data.text;
}

async function extractTextFromImage(buffer) {
  const { data: { text } } = await Tesseract.recognize(buffer, 'eng');
  return text;
}


module.exports = async function extractHealthDataFromFile(filename, buffer) {
  const ext = path.extname(filename).toLowerCase();
  console.log(ext,"ext")
  let text = '';
  if (ext === '.pdf') {
    text = await extractTextFromPDF(buffer);
  } else if (['.jpg', '.jpeg', '.png', '.bmp', '.tiff'].includes(ext)) {
    text = await extractTextFromImage(buffer);
  } else {
    return { error: 'Unsupported file type', filename };
  }
  return text;
};
