const Tesseract = require("tesseract.js");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

async function getText(file) {
  const type = file.mimetype || "";
  if (type.includes("pdf")) {
    const parsed = await pdfParse(file.buffer);
    return parsed.text || "";
  }
  if (type.includes("wordprocessingml") || file.originalname.toLowerCase().endsWith(".docx")) {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return result.value || "";
  }
  if (type.startsWith("image/")) {
    const result = await Tesseract.recognize(file.buffer, "eng");
    return result.data.text || "";
  }
  return file.buffer.toString("utf8");
}

exports.runOCR = async (req, res) => {
  const result = await Tesseract.recognize(req.file.buffer, "eng");
  res.json({ success: true, text: result.data.text || "" });
};

exports.summarizeText = async (req, res) => {
  const text = (await getText(req.file)).replace(/\s+/g, " ").trim();
  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  res.json({ success: true, summary: sentences.slice(0, 5).join(" ") || "No readable text found." });
};

exports.extractInvoiceData = async (req, res) => {
  const text = await getText(req.file);
  const invoiceNumber = text.match(/invoice\s*(no|number)?[:#]?\s*([A-Z0-9\-/]+)/i)?.[2] || null;
  const date = text.match(/\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/)?.[1] || null;
  const total = text.match(/\b(total|grand total|amount due)\b[^0-9]*([0-9,]+(?:\.\d{1,2})?)/i)?.[2] || null;
  res.json({ success: true, extracted: { invoiceNumber, date, total }, preview: text.slice(0, 1000) });
};

exports.parseResume = async (req, res) => {
  const text = await getText(req.file);
  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || null;
  const phone = text.match(/(\+?\d[\d\s\-()]{7,}\d)/)?.[0] || null;
  const name = text.split("\n").map((x) => x.trim()).filter(Boolean)[0] || null;
  res.json({ success: true, parsed: { name, email, phone, preview: text.slice(0, 1500) } });
};

exports.extractTextFromImage = async (req, res) => {
  const result = await Tesseract.recognize(req.file.buffer, "eng");
  res.json({ success: true, text: result.data.text || "" });
};
