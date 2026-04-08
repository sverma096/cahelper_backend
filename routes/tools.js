const router = require("express").Router();
const multer = require("multer");
const auth = require("../middleware/auth");
const History = require("../models/History");

const pdf = require("../utils/pdf");
const image = require("../utils/image");
const excel = require("../utils/excel");
const ai = require("../utils/ai");
const misc = require("../utils/misc");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }
});

async function saveHistory(userId, tool) {
  try {
    await History.create({ userId, tool });
  } catch (err) {
    console.error("History save failed:", err.message);
  }
}

function withHistory(toolName, handler) {
  return async (req, res, next) => {
    await saveHistory(req.user.id, toolName);
    return handler(req, res, next);
  };
}

// PDF tools 1-10
router.post("/merge-pdf", auth, upload.array("files", 20), withHistory("Merge PDF", pdf.mergePDF));
router.post("/split-pdf", auth, upload.single("file"), withHistory("Split PDF", pdf.splitPDF));
router.post("/compress-pdf", auth, upload.single("file"), withHistory("Compress PDF", pdf.compressPDF));
router.post("/pdf-to-word", auth, upload.single("file"), withHistory("PDF to Word", pdf.pdfToWord));
router.post("/word-to-pdf", auth, upload.single("file"), withHistory("Word to PDF", pdf.wordToPDF));
router.post("/pdf-to-jpg", auth, upload.single("file"), withHistory("PDF to JPG", pdf.pdfToJpg));
router.post("/jpg-to-pdf", auth, upload.array("files", 20), withHistory("JPG to PDF", pdf.jpgToPDF));
router.post("/rotate-pdf", auth, upload.single("file"), withHistory("Rotate PDF", pdf.rotatePDF));
router.post("/pdf-watermark", auth, upload.single("file"), withHistory("PDF Watermark", pdf.addPdfWatermark));
router.post("/remove-pdf-pages", auth, upload.single("file"), withHistory("Remove PDF Pages", pdf.removePdfPages));

// Image tools 11-18
router.post("/resize-image", auth, upload.single("file"), withHistory("Resize Image", image.resizeImage));
router.post("/compress-image", auth, upload.single("file"), withHistory("Compress Image", image.compressImage));
router.post("/jpg-to-png", auth, upload.single("file"), withHistory("JPG to PNG", image.jpgToPng));
router.post("/png-to-jpg", auth, upload.single("file"), withHistory("PNG to JPG", image.pngToJpg));
router.post("/crop-image", auth, upload.single("file"), withHistory("Crop Image", image.cropImage));
router.post("/rotate-image", auth, upload.single("file"), withHistory("Rotate Image", image.rotateImage));
router.post("/image-watermark", auth, upload.single("file"), withHistory("Image Watermark", image.addImageWatermark));
router.post("/image-to-pdf", auth, upload.array("files", 20), withHistory("Image to PDF", image.imageToPDF));

// Excel tools 19-25
router.post("/excel-to-json", auth, upload.single("file"), withHistory("Excel to JSON", excel.excelToJson));
router.post("/json-to-excel", auth, upload.single("file"), withHistory("JSON to Excel", excel.jsonToExcel));
router.post("/csv-to-excel", auth, upload.single("file"), withHistory("CSV to Excel", excel.csvToExcel));
router.post("/excel-remove-duplicates", auth, upload.single("file"), withHistory("Excel Remove Duplicates", excel.removeDuplicatesExcel));
router.post("/excel-split-sheets", auth, upload.single("file"), withHistory("Excel Split Sheets", excel.splitSheets));
router.post("/excel-merge-sheets", auth, upload.array("files", 20), withHistory("Excel Merge Sheets", excel.mergeSheets));
router.post("/excel-ai", auth, upload.single("file"), withHistory("AI Excel Analyzer", excel.analyzeExcel));

// AI tools 26-30
router.post("/ocr", auth, upload.single("file"), withHistory("OCR", ai.runOCR));
router.post("/summarize-text", auth, upload.single("file"), withHistory("Summarize Text", ai.summarizeText));
router.post("/extract-invoice", auth, upload.single("file"), withHistory("Extract Invoice Data", ai.extractInvoiceData));
router.post("/parse-resume", auth, upload.single("file"), withHistory("Parse Resume", ai.parseResume));
router.post("/extract-image-text", auth, upload.single("file"), withHistory("Extract Image Text", ai.extractTextFromImage));

// Utility tools 31-35
router.post("/compress-file", auth, upload.single("file"), withHistory("Compress File", misc.compressFile));
router.post("/rename-file", auth, upload.single("file"), withHistory("Rename File", misc.renameFile));
router.post("/extract-zip", auth, upload.single("file"), withHistory("Extract ZIP", misc.extractZip));
router.post("/convert-file", auth, upload.single("file"), withHistory("Convert File", misc.convertFile));
router.post("/base64", auth, upload.single("file"), withHistory("Base64 Encoder", misc.encodeBase64));

module.exports = router;
