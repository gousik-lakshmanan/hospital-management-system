import mongoose from 'mongoose';

const findingSchema = new mongoose.Schema({
  parameter: { type: String, required: true },
  value: { type: String, required: true },
  status: { type: String, required: true },
  range: { type: String, required: true },
  explanation: { type: String, required: true }
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
    }
  },
  { timestamps: true }
);

export default mongoose.model('ReportSummary', reportSummarySchema);
