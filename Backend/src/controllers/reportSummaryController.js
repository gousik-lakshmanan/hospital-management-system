import ReportSummary from '../models/ReportSummary.js';
import { summarizeClinicalReport } from '../services/aiService.js';

export const generateReportSummary = async (req, res) => {
  try {
    const { reportId, patientName, reportType, date, sourceReport } = req.body;
    
    // Validate request
    if (!reportId || !patientName || !reportType || !date) {
      return res.status(400).json({ success: false, message: 'Missing required report fields.' });
    }

    // Check if summary already exists for this user and reportId to avoid duplicate AI generation
    let existingSummary = await ReportSummary.findOne({ userId: req.user._id, reportId });
    if (existingSummary) {
      return res.status(200).json({ success: true, summary: existingSummary });
    }

    // Prepare data for AI
    const reportData = {
      patientName,
      reportType,
      date,
      sourceReport
    };

    // Call AI Service
    const aiResponse = await summarizeClinicalReport(reportData);

    // Save to DB
    const newSummary = new ReportSummary({
      userId: req.user._id,
      reportId,
      patientName,
      reportType,
      date,
      title: `${reportType} Summary`,
      aiExplanation: aiResponse.aiExplanation,
      findings: aiResponse.findings,
      doctorQuestions: aiResponse.doctorQuestions,
      sourceReport
    });

    await newSummary.save();

    res.status(201).json({ success: true, summary: newSummary });

  } catch (error) {
    console.error('Error generating report summary:', error);
    res.status(500).json({ success: false, message: 'Report analysis could not be completed. Please try again.' });
  }
};

export const getMyReportSummaries = async (req, res) => {
  try {
    const summaries = await ReportSummary.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, summaries });
  } catch (error) {
    console.error('Error fetching report summaries:', error);
    res.status(500).json({ success: false, message: 'Could not retrieve report summaries.' });
  }
};
