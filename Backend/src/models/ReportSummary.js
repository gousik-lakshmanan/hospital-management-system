import mongoose from 'mongoose';

const findingSchema = new mongoose.Schema({
  parameter: { type: String, required: true },
  value: { type: String, required: true },
  status: { type: String, required: true },
  range: { type: String, required: true },
  explanation: { type: String, required: true }
}, { _id: false });

const reportOverviewSchema = new mongoose.Schema({
  reportType: { type: String, default: '' },
  reportDate: { type: String, default: '' },
  department: { type: String, default: '' },
  purpose: { type: String, default: '' }
}, { _id: false });

const reportSummarySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reportId: {
      type: String,
      required: true
    },
    patientName: {
      type: String,
      required: true
    },
    reportType: {
      type: String,
      required: true
    },
    date: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    aiExplanation: {
      type: String,
      required: true
    },
    findings: [findingSchema],
    doctorQuestions: [{ type: String }],
    model: {
      type: String,
      default: 'gemini'
    },
    // Structured AI Report Summarizer fields (additive/optional).
    reportOverview: {
      type: reportOverviewSchema,
      default: () => ({})
    },
    simpleSummary: {
      type: String,
      default: ''
    },
    normalFindings: [{ type: String }],
    abnormalFindings: [{ type: String }],
    possibleSignificance: [{ type: String }],
    possibleCausesOrFactors: [{ type: String }],
    generalPreventionAndGuidance: [{ type: String }],
    doctorConsultation: [{ type: String }],
    questionsForDoctor: [{ type: String }],
    disclaimer: {
      type: String,
      default: ''
    },
    fileName: {
      type: String,
      default: ''
    },
    fileType: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

export default mongoose.model('ReportSummary', reportSummarySchema);