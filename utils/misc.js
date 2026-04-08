const AdmZip = require("adm-zip");
const zlib = require("zlib");
const XLSX = require("xlsx");

exports.compressFile = async (req, res) => {
  const gz = zlib.gzipSync(req.file.buffer);
  res.setHeader("Content-Type", "application/gzip");
  res.setHeader("Content-Disposition", `attachment; filename="${req.file.originalname}.gz"`);
  res.send(gz);
};

exports.renameFile = async (req, res) => {
  const newName = req.body.newName || `renamed_${req.file.originalname}`;
  res.setHeader("Content-Type", req.file.mimetype || "application/octet-stream");
  res.setHeader("Content-Disposition", `attachment; filename="${newName}"`);
  res.send(req.file.buffer);
};

exports.extractZip = async (req, res) => {
  const zip = new AdmZip(req.file.buffer);
  const files = zip.getEntries().map((entry) => ({
    name: entry.entryName,
    size: entry.header.size,
    isDirectory: entry.isDirectory
  }));
  res.json({ success: true, files });
};

exports.convertFile = async (req, res) => {
  const target = (req.body.target || "").toLowerCase();
  const name = req.file.originalname.toLowerCase();

  if (target === "json" && (name.endsWith(".xlsx") || name.endsWith(".xls"))) {
    const wb = XLSX.read(req.file.buffer, { type: "buffer" });
    const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
    return res.json({ success: true, data });
  }

  if (target === "txt") {
    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Content-Disposition", "attachment; filename=converted.txt");
    return res.send(req.file.buffer.toString("utf8"));
  }

  res.status(400).json({ success: false, message: "Unsupported conversion target" });
};

exports.encodeBase64 = async (req, res) => {
  res.json({
    success: true,
    filename: req.file.originalname,
    mimeType: req.file.mimetype,
    base64: req.file.buffer.toString("base64")
  });
};
