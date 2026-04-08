const XLSX = require("xlsx");

function sendWorkbook(res, wb, name) {
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${name}"`);
  res.send(buffer);
}

exports.excelToJson = async (req, res) => {
  const wb = XLSX.read(req.file.buffer, { type: "buffer" });
  const out = {};
  wb.SheetNames.forEach((name) => {
    out[name] = XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: "" });
  });
  res.json({ success: true, data: out });
};

exports.jsonToExcel = async (req, res) => {
  const data = JSON.parse(req.file.buffer.toString("utf8"));
  const rows = Array.isArray(data) ? data : data.data || [];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Sheet1");
  sendWorkbook(res, wb, "json-to-excel.xlsx");
};

exports.csvToExcel = async (req, res) => {
  const wb = XLSX.read(req.file.buffer.toString("utf8"), { type: "string" });
  sendWorkbook(res, wb, "csv-to-excel.xlsx");
};

exports.removeDuplicatesExcel = async (req, res) => {
  const wb = XLSX.read(req.file.buffer, { type: "buffer" });
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
  const seen = new Set();
  const unique = rows.filter((r) => {
    const key = JSON.stringify(r);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const out = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(out, XLSX.utils.json_to_sheet(unique), "Unique");
  sendWorkbook(res, out, "duplicates-removed.xlsx");
};

exports.splitSheets = async (req, res) => {
  const column = req.body.column;
  if (!column) return res.status(400).json({ success: false, message: "body.column required" });
  const wb = XLSX.read(req.file.buffer, { type: "buffer" });
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
  const grouped = {};
  for (const row of rows) {
    const key = String(row[column] ?? "Blank");
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(row);
  }
  const out = XLSX.utils.book_new();
  Object.entries(grouped).forEach(([key, list]) => {
    XLSX.utils.book_append_sheet(out, XLSX.utils.json_to_sheet(list), key.slice(0, 31) || "Sheet");
  });
  sendWorkbook(res, out, "split-sheets.xlsx");
};

exports.mergeSheets = async (req, res) => {
  const rows = [];
  for (const file of req.files || []) {
    const wb = XLSX.read(file.buffer, { type: "buffer" });
    rows.push(...XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" }));
  }
  const out = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(out, XLSX.utils.json_to_sheet(rows), "Merged");
  sendWorkbook(res, out, "merged.xlsx");
};

exports.analyzeExcel = async (req, res) => {
  const wb = XLSX.read(req.file.buffer, { type: "buffer" });
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
  let numericCellCount = 0;
  let total = 0;
  let min = Infinity;
  let max = -Infinity;
  for (const row of rows) {
    for (const value of Object.values(row)) {
      if (typeof value === "number" && Number.isFinite(value)) {
        numericCellCount++;
        total += value;
        min = Math.min(min, value);
        max = Math.max(max, value);
      }
    }
  }
  res.json({
    success: true,
    rows: rows.length,
    columns: rows[0] ? Object.keys(rows[0]).length : 0,
    numericCellCount,
    total,
    average: numericCellCount ? total / numericCellCount : 0,
    min: numericCellCount ? min : null,
    max: numericCellCount ? max : null
  });
};
