import ReportSummary from '../models/ReportSummary.js';
import { summarizeClinicalReport } from '../services/aiService.js';
import {
  extractReportContent,
  getReportExtension,
  isSupportedExtension,
  ReportParseError
} from '../utils/reportFileParser.js';

const NOT_AVAILABLE = 'Not clearly available in the uploaded report.';

const UNSUPPORTED_MESSAGE =
  'This file format is not supported. Please upload a PDF, DOC, DOCX, TXT, JPG, JPEG, PNG, or WEBP report.';

const contentTypeForExt = (ext) => {
  if (ext === 'txt') return 'text/plain';
  if (ext === 'pdf') return 'application/pdf';
  if (ext === 'doc') return 'application/msword';
  if (ext === 'docx') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  return 'application/octet-stream';
};

export const generateReportSummary = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a report before analyzing.' });
    }

    const buffer = req.file.buffer;
    const fileName = String(req.file.originalname || 'report').trim();
    const ext = getReportExtension(fileName);

    if (!isSupportedExtension(ext)) {
      return res.status(400).json({ success: false, message: UNSUPPORTED_MESSAGE });
    }

    let extracted;
    try {
      extracted = await extractReportContent({ buffer, ext, mimeType: req.file.mimetype });
    } catch (err) {
      if (err instanceof ReportParseError) {
        return res.status(err.statusCode || 400).json({ success: false, message: err.message });
      }
      return res.status(400).json({
        success: false,
        message: 'The uploaded report could not be read clearly. Please upload a clearer or supported version.'
      });
    }

    let aiSummary;
    try {
      aiSummary = await summarizeClinicalReport({
        text: extracted.kind === 'text' ? extracted.text : '',
        imagePart: extracted.kind === 'image' ? { base64: extracted.base64, mimeType: extracted.mimeType } : null
      });
    } catch (err) {
      // Never expose API keys or stack traces. No synthetic/fake summary is ever returned.
      return res.status(502).json({ success: false, message: 'Unable to analyze the report right now. Please try again.' });
    }

    if (!aiSummary || aiSummary.noReadableContent === true) {
      return res.status(422).json({
        success: false,
        message: 'The uploaded report could not be read clearly. Please upload a clearer or supported version.'
      });
    }

    const overview = aiSummary.reportOverview || {};
    const reportDate =
      overview.reportDate && !overview.reportDate.includes('Not clearly')
        ? overview.reportDate
        : new Date().toISOString().slice(0, 10);
    const reportType =
      overview.reportType && !overview.reportType.includes('Not clearly')
        ? overview.reportType
        : ext === 'pdf'
          ? 'PDF Report'
          : ext === 'txt'
            ? 'Text Report'
            : ext === 'doc' || ext === 'docx'
              ? 'Document Report'
              : 'Medical Report';

    const newSummary = new ReportSummary({
      userId: req.user._id,
      reportId: `report-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      patientName: req.user.name || 'Patient',
      reportType,
      date: reportDate,
      title: `${reportType} Report Summary`,
      aiExplanation: aiSummary.simpleSummary || NOT_AVAILABLE,
      findings: aiSummary.keyFindings.map((f) => ({
        parameter: f.test,
        value:
          (f.unit && f.unit !== NOT_AVAILABLE ? `${f.value} ${f.unit}`.trim() : f.value) || NOT_AVAILABLE,
        status: f.status || 'Not specified',
        range: f.referenceRange,
        explanation: f.explanation || NOT_AVAILABLE
      })),
      doctorQuestions: aiSummary.questionsForDoctor,
      reportOverview: aiSummary.reportOverview,
      simpleSummary: aiSummary.simpleSummary,
      normalFindings: aiSummary.normalFindings,
      abnormalFindings: aiSummary.abnormalFindings,
      possibleSignificance: aiSummary.possibleSignificance,
      possibleCausesOrFactors: aiSummary.possibleCausesOrFactors,
      generalPreventionAndGuidance: aiSummary.generalPreventionAndGuidance,
      doctorConsultation: aiSummary.doctorConsultation,
      questionsForDoctor: aiSummary.questionsForDoctor,
      disclaimer: aiSummary.disclaimer,
      fileName,
      fileType: extracted.kind === 'image' ? extracted.mimeType : contentTypeForExt(ext)
    });

    await newSummary.save();

    res.status(201).json({
      success: true,
      message: 'Report analyzed and summarized successfully.',
      summary: newSummary
    });
  } catch (error) {
    console.error('Error generating report summary:', error.message);
    res.status(500).json({ success: false, message: 'Report analysis could not be completed. Please try again.' });
  }
};

export const getMyReportSummaries = async (req, res) => {
  try {
    const summaries = await ReportSummary.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, summaries });
  } catch (error) {
    console.error('Error fetching report summaries:', error.message);
    res.status(500).json({ success: false, message: 'Could not retrieve report summaries.' });
  }
};