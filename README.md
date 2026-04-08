# SaaS Backend

A Node.js/Express REST API backend with 35+ file processing tools including PDF, Image, Excel, OCR, and AI utilities.

## Features

- **Auth** – JWT-based register/login
- **PDF Tools** – Merge, split, compress, rotate, watermark, convert, remove pages
- **Image Tools** – Resize, compress, crop, rotate, watermark, convert formats
- **Excel Tools** – JSON/CSV conversion, remove duplicates, merge/split sheets, analyze
- **AI Tools** – OCR, text summarization, invoice extraction, resume parsing
- **Utility Tools** – Compress, rename, zip extract, file convert, base64 encode

## Setup

```bash
npm install
cp .env.example .env
# Fill in your MONGO_URI and JWT_SECRET in .env
npm start
```

## Environment Variables

| Variable    | Description                     |
|-------------|---------------------------------|
| MONGO_URI   | MongoDB connection string        |
| JWT_SECRET  | Secret key for JWT signing       |
| PORT        | Server port (default: 5000)      |

## API Overview

### Auth
- `POST /api/auth/register` – Register a new user
- `POST /api/auth/login` – Login and receive JWT

### Tools (all require `Authorization: <token>` header)

**PDF:** `/api/tools/merge-pdf`, `/split-pdf`, `/compress-pdf`, `/pdf-to-word`, `/word-to-pdf`, `/pdf-to-jpg`, `/jpg-to-pdf`, `/rotate-pdf`, `/pdf-watermark`, `/remove-pdf-pages`

**Image:** `/api/tools/resize-image`, `/compress-image`, `/jpg-to-png`, `/png-to-jpg`, `/crop-image`, `/rotate-image`, `/image-watermark`, `/image-to-pdf`

**Excel:** `/api/tools/excel-to-json`, `/json-to-excel`, `/csv-to-excel`, `/excel-remove-duplicates`, `/excel-split-sheets`, `/excel-merge-sheets`, `/excel-ai`

**AI:** `/api/tools/ocr`, `/summarize-text`, `/extract-invoice`, `/parse-resume`, `/extract-image-text`

**Utility:** `/api/tools/compress-file`, `/rename-file`, `/extract-zip`, `/convert-file`, `/base64`
