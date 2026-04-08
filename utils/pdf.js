const { PDFDocument, degrees, rgb, StandardFonts } = require("pdf-lib");
const pdfParse = require("pdf-parse");
const PDFKit = require("pdfkit");
const mammoth = require("mammoth");
const { Document, Packer, Paragraph } = require("docx");

function parseRanges(input, maxPages) {
  if (!input) return [];
  const pages = new Set();
  for (const item of String(input).split(",")) {
    const part = item.trim();
    if (!part) continue;
    if (part.includes("-")) {
      const [a, b] = part.split("-").map((x) => Number(x.trim()));
      if (Number.isInteger(a) && Number.isInteger(b)) {
        const start = Math.max(1, Math.min(a, b));
        const end = Math.min(maxPages, Math.max(a, b));
        for (let i = start; i <= end; i++) pages.add(i - 1);
      }
    } else {
      const n = Number(part);
      if (Number.isInteger(n) && n >= 1 && n <= maxPages) pages.add(n - 1);
    }
  }
  return [...pages].sort((a, b) => a - b);
}

function setDownload(res, type, name) {
  res.setHeader("Content-Type", type);
  res.setHeader("Content-Disposition", `attachment; filename="${name}"`);
}

exports.mergePDF = async (req, res) => {
  const out = await PDFDocument.create();
  for (const file of req.files || []) {
    const pdf = await PDFDocument.load(file.buffer);
    const copied = await out.copyPages(pdf, pdf.getPageIndices());
    copied.forEach((p) => out.addPage(p));
  }
  const bytes = await out.save();
  setDownload(res, "application/pdf", "merged.pdf");
  res.send(Buffer.from(bytes));
};

exports.splitPDF = async (req, res) => {
  const pdf = await PDFDocument.load(req.file.buffer);
  const indexes = parseRanges(req.body.pages, pdf.getPageCount());
  if (!indexes.length) {
    return res.status(400).json({ success: false, message: "body.pages required, e.g. 1,3-5" });
  }
  const out = await PDFDocument.create();
  const copied = await out.copyPages(pdf, indexes);
  copied.forEach((p) => out.addPage(p));
  const bytes = await out.save();
  setDownload(res, "application/pdf", "split.pdf");
  res.send(Buffer.from(bytes));
};

exports.compressPDF = async (req, res) => {
  const pdf = await PDFDocument.load(req.file.buffer);
  const bytes = await pdf.save({ useObjectStreams: true, objectsPerTick: 50 });
  setDownload(res, "application/pdf", "compressed.pdf");
  res.send(Buffer.from(bytes));
};

exports.pdfToWord = async (req, res) => {
  const parsed = await pdfParse(req.file.buffer);
  const lines = (parsed.text || "").split(/\n+/).map((x) => x.trim()).filter(Boolean);
  const doc = new Document({ sections: [{ children: lines.map((x) => new Paragraph(x)) }] });
  const buffer = await Packer.toBuffer(doc);
  setDownload(res, "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "converted.docx");
  res.send(buffer);
};

exports.wordToPDF = async (req, res) => {
  const result = await mammoth.extractRawText({ buffer: req.file.buffer });
  const doc = new PDFKit({ margin: 40 });
  const chunks = [];
  doc.on("data", (c) => chunks.push(c));
  doc.on("end", () => {
    setDownload(res, "application/pdf", "converted.pdf");
    res.send(Buffer.concat(chunks));
  });
  doc.fontSize(12).text(result.value || "", { width: 520, align: "left" });
  doc.end();
};

exports.pdfToJpg = async (req, res) => {
  const parsed = await pdfParse(req.file.buffer);
  res.json({
    success: true,
    note: "Render-friendly fallback: extracted text because raster PDF-to-image requires server binaries not bundled here.",
    textPreview: (parsed.text || "").slice(0, 2000)
  });
};

exports.jpgToPDF = async (req, res) => {
  const out = await PDFDocument.create();
  for (const file of req.files || []) {
    const image = await out.embedJpg(file.buffer);
    const page = out.addPage([image.width, image.height]);
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
  }
  const bytes = await out.save();
  setDownload(res, "application/pdf", "images.pdf");
  res.send(Buffer.from(bytes));
};

exports.rotatePDF = async (req, res) => {
  const angle = Number(req.body.angle || 90);
  const pdf = await PDFDocument.load(req.file.buffer);
  pdf.getPages().forEach((page) => page.setRotation(degrees(angle)));
  const bytes = await pdf.save();
  setDownload(res, "application/pdf", "rotated.pdf");
  res.send(Buffer.from(bytes));
};

exports.addPdfWatermark = async (req, res) => {
  const text = req.body.text || "WATERMARK";
  const pdf = await PDFDocument.load(req.file.buffer);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  for (const page of pdf.getPages()) {
    const { width, height } = page.getSize();
    page.drawText(text, {
      x: width / 5,
      y: height / 2,
      size: 40,
      font,
      rotate: degrees(45),
      color: rgb(0.7, 0.7, 0.7),
      opacity: 0.4
    });
  }
  const bytes = await pdf.save();
  setDownload(res, "application/pdf", "watermarked.pdf");
  res.send(Buffer.from(bytes));
};

exports.removePdfPages = async (req, res) => {
  const pdf = await PDFDocument.load(req.file.buffer);
  const remove = new Set(parseRanges(req.body.pages, pdf.getPageCount()));
  const keep = [];
  for (let i = 0; i < pdf.getPageCount(); i++) if (!remove.has(i)) keep.push(i);
  const out = await PDFDocument.create();
  const copied = await out.copyPages(pdf, keep);
  copied.forEach((p) => out.addPage(p));
  const bytes = await out.save();
  setDownload(res, "application/pdf", "pages-removed.pdf");
  res.send(Buffer.from(bytes));
};
