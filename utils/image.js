const sharp = require("sharp");
const { PDFDocument } = require("pdf-lib");

function setDownload(res, type, name) {
  res.setHeader("Content-Type", type);
  res.setHeader("Content-Disposition", `attachment; filename="${name}"`);
}

exports.resizeImage = async (req, res) => {
  const width = Number(req.body.width || 300);
  const height = Number(req.body.height || 300);
  const buffer = await sharp(req.file.buffer).resize(width, height, { fit: "contain" }).png().toBuffer();
  setDownload(res, "image/png", "resized.png");
  res.send(buffer);
};

exports.compressImage = async (req, res) => {
  const quality = Number(req.body.quality || 70);
  const buffer = await sharp(req.file.buffer).jpeg({ quality }).toBuffer();
  setDownload(res, "image/jpeg", "compressed.jpg");
  res.send(buffer);
};

exports.jpgToPng = async (req, res) => {
  const buffer = await sharp(req.file.buffer).png().toBuffer();
  setDownload(res, "image/png", "converted.png");
  res.send(buffer);
};

exports.pngToJpg = async (req, res) => {
  const buffer = await sharp(req.file.buffer).flatten({ background: "#ffffff" }).jpeg({ quality: 90 }).toBuffer();
  setDownload(res, "image/jpeg", "converted.jpg");
  res.send(buffer);
};

exports.cropImage = async (req, res) => {
  const left = Number(req.body.left || 0);
  const top = Number(req.body.top || 0);
  const width = Number(req.body.width || 200);
  const height = Number(req.body.height || 200);
  const buffer = await sharp(req.file.buffer).extract({ left, top, width, height }).png().toBuffer();
  setDownload(res, "image/png", "cropped.png");
  res.send(buffer);
};

exports.rotateImage = async (req, res) => {
  const angle = Number(req.body.angle || 90);
  const buffer = await sharp(req.file.buffer).rotate(angle).png().toBuffer();
  setDownload(res, "image/png", "rotated.png");
  res.send(buffer);
};

exports.addImageWatermark = async (req, res) => {
  const text = req.body.text || "WATERMARK";
  const meta = await sharp(req.file.buffer).metadata();
  const svg = `
    <svg width="${meta.width}" height="${meta.height}">
      <text x="50%" y="50%" font-size="48" fill="rgba(255,255,255,0.45)"
        text-anchor="middle" transform="rotate(-30, ${meta.width / 2}, ${meta.height / 2})"
        font-family="Arial">${text}</text>
    </svg>`;
  const buffer = await sharp(req.file.buffer)
    .composite([{ input: Buffer.from(svg) }])
    .png()
    .toBuffer();
  setDownload(res, "image/png", "watermarked.png");
  res.send(buffer);
};

exports.imageToPDF = async (req, res) => {
  const out = await PDFDocument.create();
  for (const file of req.files || []) {
    const isPng = file.mimetype === "image/png";
    const image = isPng ? await out.embedPng(file.buffer) : await out.embedJpg(file.buffer);
    const page = out.addPage([image.width, image.height]);
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
  }
  const bytes = await out.save();
  setDownload(res, "application/pdf", "images.pdf");
  res.send(Buffer.from(bytes));
};
