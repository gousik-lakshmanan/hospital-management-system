import React, { useState, useEffect } from 'react';
import { FileHeart, FileText, ChevronRight, AlertCircle, ShieldAlert, Sparkles, HelpCircle } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { reportSummarizerService } from '../../services/reportSummarizerService';

const rawReportsData = {
  'cbc': {
    reportId: 'cbc-101',
    patientName: 'Aarav Sharma',
    reportType: 'Complete Blood Count (CBC)',
    date: '2026-08-20',
    sourceReport: 'Hemoglobin: 11.8 g/dL (Range: 13.5 - 17.5 g/dL)\nWhite Blood Cells: 7,500 /mcL (Range: 4,500 - 11,000 /mcL)\nPlatelet Count: 250,000 /mcL (Range: 150,000 - 450,000 /mcL)'
  },
  'lipid': {
    reportId: 'lipid-202',
    patientName: 'Vikram Malhotra',
    reportType: 'Lipid Profile',
    date: '2026-08-22',
    sourceReport: 'Total Cholesterol: 235 mg/dL (Range: < 200 mg/dL)\nLDL (Bad Cholesterol): 155 mg/dL (Range: < 100 mg/dL)\nHDL (Good Cholesterol): 45 mg/dL (Range: > 40 mg/dL)'
  },
  'urine': {
    reportId: 'urine-303',
    patientName: 'Ananya Iyer',
    reportType: 'Urinalysis Report',
    date: '2026-08-25',
    sourceReport: 'Glucose: Negative\nProteins: Trace (+1)\nLeukocytes: Positive'
  }
};

export const AIReportSummarizer = () => {
  const [selectedReport, setSelectedReport] = useState('');
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [savedSummaries, setSavedSummaries] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSummaries = async () => {
      try {
        const data = await reportSummarizerService.getMyReportSummaries();
        if (data.success) {
          setSavedSummaries(data.summaries);
        }
      } catch (err) {
        console.error("Failed to load summaries", err);
      }
    };
    fetchSummaries();
  }, []);

  const mockReportsList = [
    { value: 'cbc', label: 'Complete Blood Count (CBC) - Aarav Sharma' },
    { value: 'lipid', label: 'Lipid Profile - Vikram Malhotra' },
    { value: 'urine', label: 'Urinalysis Report - Ananya Iyer' }
  ];

  const handleSummarize = async (e) => {
    e.preventDefault();
    if (!selectedReport) return;
    setError(null);
    setLoading(true);

    const reportPayload = rawReportsData[selectedReport];

    try {
      const existing = savedSummaries.find(s => s.reportId === reportPayload.reportId);
      if (existing) {
         setSummary(existing);
         setLoading(false);
         return;
      }
      
      const response = await reportSummarizerService.summarizeReport(reportPayload);
      if (response.success) {
         setSummary(response.summary);
         setSavedSummaries(prev => [response.summary, ...prev]);
      } else {
         setError(response.message || 'Failed to summarize report');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'An error occurred while communicating with the AI service.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl flex items-start gap-3 text-xs leading-normal">
        <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Medical Assistive Disclaimer:</span>
          <p className="mt-0.5">
            The Report Summarizer extracts and simplifies clinical reports. It does not replace a doctor\'s analysis. Clinical actions must only be taken after consulting your primary physician.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Setup Card */}
        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-xl text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <Card title="Select Clinical Report" subtitle="Upload or choose mock hospital logs" className="h-fit">
          <form onSubmit={handleSummarize} className="space-y-4">
            <div>
              <label className="block text-[10px] text-slate-500 font-semibold uppercase">Report Record</label>
              <select
                value={selectedReport}
                onChange={(e) => setSelectedReport(e.target.value)}
                className="mt-1 w-full p-2.5 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-xs"
                required
              >
                <option value="">-- Choose Report Document --</option>
                {mockReportsList.map((r, idx) => (
                  <option key={idx} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            <div className="border border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 cursor-pointer transition-colors">
              <FileText className="w-6 h-6 text-slate-400 mx-auto mb-2" />
              <span className="block text-[10px] text-slate-500 font-semibold">Simulate PDF Drop</span>
              <span className="block text-[9px] text-slate-400 mt-0.5">Drag & drop files to scan values</span>
            </div>

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full"
              icon={Sparkles}
            >
              Scan & Summarize Report
            </Button>
          </form>
        </Card>
        </div>

        {/* Output Area */}
        <div className="md:col-span-2 space-y-4">
          {!summary ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center h-full flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mb-4">
                <FileHeart className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">Awaiting Summary Analysis</h3>
              <p className="text-xs text-slate-400 max-w-xs mt-1 leading-normal">
                Choose a clinical record from the directory and trigger the AI parser to simplify the findings.
              </p>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-300">
              
              {/* Core summary explanation */}
              <Card title={summary.title} subtitle={`Patient: ${summary.patientName} • Date: ${summary.date}`}>
                <div className="space-y-3 text-xs leading-relaxed text-slate-600">
                  <p className="font-medium text-slate-800">AI Narrative Summary:</p>
                  <p>{summary.aiExplanation}</p>
                </div>
              </Card>

              {/* Param table */}
              <Card title="Extracted Vital Parameters" subtitle="Identified chemical indicators and range offsets">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold">
                        <th className="p-3">Biomarker</th>
                        <th className="p-3">Report Value</th>
                        <th className="p-3">Reference Range</th>
                        <th className="p-3">Risk Assessment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600">
                      {summary.findings.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/20">
                          <td className="p-3 font-semibold text-slate-800">
                            {item.parameter}
                            <span className="block text-[9px] font-medium text-slate-400 mt-0.5 leading-normal">
                              {item.explanation}
                            </span>
                          </td>
                          <td className="p-3 font-semibold text-slate-800">{item.value}</td>
                          <td className="p-3 text-slate-400">{item.range}</td>
                          <td className="p-3">
                            <Badge>{item.status}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Questions for doctor */}
              <Card title="Suggested Questions for Your Physician" subtitle="Important topics to cover during consultation">
                <ul className="space-y-2">
                  {summary.doctorQuestions.map((q, idx) => (
                    <li key={idx} className="flex gap-2 items-start text-xs text-slate-600">
                      <HelpCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
              </Card>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIReportSummarizer;
