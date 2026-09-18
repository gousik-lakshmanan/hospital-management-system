import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';

const SUPPORTED_EXTENSIONS = ['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png', 'webp'];
const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

const MIME_BY_EXTENSION = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  txt: 'text/plain',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp'
};

// Minimum number of non-whitespace characters required to consider a
// text-based document as containing readable report content.
const MIN_CONTENT_CHARS = 15;

export class ReportParseError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'ReportParseError';
    this.statusCode = statusCode;
  }
}

const cleanText = (raw = '') =>
  String(raw)
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const isMeaningful = (text) => {
  const compact = String(text || '').replace(/\s+/g, '');
  return compact.length >= MIN_CONTENT_CHARS;
};

// Legacy binary Word (.doc) files do not expose plain text directly. Fall back
// to scanning the stream for readable text runs (UTF-16LE is the typical text
// encoding used inside the Word binary container).
const extractDocStrings = (buffer) => {
  const utf16Runs = [];
  const asciiRuns = [];
  let run = '';

  for (let i = 0; i + 1 < buffer.length; i += 2) {
    const low = buffer[i];
    const high = buffer[i + 1];
    if (high === 0x00 && low >= 0x20 && low <= 0x7e) {
      run += String.fromCharCode(low);
    } else {
      if (run.length >= 3) utf16Runs.push(run);
      run = '';
    }
  }
  if (run.length >= 3) utf16Runs.push(run);

  run = '';
  for (let j = 0; j < buffer.length; j += 1) {
    const c = buffer[j];
    if (c >= 0x20 && c <= 0x7e) {
      run += String.fromCharCode(c);
    } else {
      if (run.length >= 4) asciiRuns.push(run);
      run = '';
    }
  }
  if (run.length >= 4) asciiRuns.push(run);

  return (utf16Runs.length ? utf16Runs : asciiRuns).join('\n');
};

const extractPdfText = async (buffer) => {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText();
    return result.text || '';
  } finally {
    await parser.destroy();
  }
};

const extractDocxText = async (buffer) => {
  const result = await mammoth.extractRawText({ buffer });
  return result.value || '';
};

const extractTxtText = (buffer) => buffer.toString('utf8');

export const getReportExtension = (originalName = '') =>
  String(originalName || '').split('.').pop().toLowerCase().trim();

export const isSupportedExtension = (ext) => SUPPORTED_EXTENSIONS.includes(ext);
export const isImageExtension = (ext) => IMAGE_EXTENSIONS.includes(ext);

export const resolveReportMimeType = (ext, providedMime = '') => {
  const expected = MIME_BY_EXTENSION[ext] || 'application/octet-stream';
  const provided = String(providedMime || '').toLowerCase();
  if (isImageExtension(ext) && provided.startsWith('image/')) return provided;
  if (provided && ['application/octet-stream', 'binary/octet-stream'].includes(provided)) return expected;
  return String(provided || expected).toLowerCase();
};

export const extractReportContent = async ({ buffer, ext, mimeType = '' }) => {
  if (!buffer || buffer.length === 0) {
    throw new ReportParseError('The uploaded file is empty. Please upload a valid report file.');
  }

  if (isImageExtension(ext)) {
    return {
      kind: 'image',
      base64: buffer.toString('base64'),
      mimeType: resolveReportMimeType(ext, mimeType)
    };
  }

  let raw = '';
  if (ext === 'pdf') raw = await extractPdfText(buffer);
  else if (ext === 'docx') raw = await extractDocxText(buffer);
  else if (ext === 'doc') raw = extractDocStrings(buffer);
  else if (ext === 'txt') raw = extractTxtText(buffer);

  const text = cleanText(raw);
  if (!isMeaningful(text)) {
    throw new ReportParseError('No readable report information was found in the uploaded file.');
  }

  return { kind: 'text', text };
};

export default {
  extractReportContent,
  ReportParseError,
  isSupportedExtension,
  isImageExtension,
  getReportExtension,
  resolveReportMimeType
};