import multer from 'multer';
import { isSupportedExtension, getReportExtension, resolveReportMimeType } from '../utils/reportFileParser.js';

export const MAX_REPORT_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const GENERIC_MIMES = new Set(['application/octet-stream', 'binary/octet-stream']);

const UNSUPPORTED_MESSAGE =
  'This file format is not supported. Please upload a PDF, DOC, DOCX, TXT, JPG, JPEG, PNG, or WEBP report.';

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_REPORT_FILE_SIZE,
    files: 1,
    fields: 5
  },
  fileFilter: (req, file, cb) => {
    const ext = getReportExtension(file.originalname);
    if (!isSupportedExtension(ext)) {
      const err = new Error('UNSUPPORTED_FILE_TYPE');
      err.code = 'UNSUPPORTED_FILE_TYPE';
      return cb(err);
    }

    // Validate the declared MIME type. A specific, non-generic MIME that cannot
    // represent the declared extension is rejected.
    const provided = String(file.mimetype || '').toLowerCase();
    const expected = resolveReportMimeType(ext, provided);
    if (provided && !GENERIC_MIMES.has(provided) && provided !== expected) {
      const err = new Error('UNSUPPORTED_FILE_TYPE');
      err.code = 'UNSUPPORTED_FILE_TYPE';
      return cb(err);
    }

    return cb(null, true);
  }
});

export const uploadReportFile = (req, res, next) => {
  upload.single('report')(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'File is too large. Maximum allowed size is 10 MB.' });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ success: false, message: 'Unexpected upload field. Please upload a single report file.' });
    }
    return res.status(400).json({ success: false, message: UNSUPPORTED_MESSAGE });
  });
};

export default { uploadReportFile, MAX_REPORT_FILE_SIZE };