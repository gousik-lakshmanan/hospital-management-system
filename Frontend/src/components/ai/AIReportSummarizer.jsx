import React, { useState } from 'react';
import { FileHeart, FileText, ChevronRight, AlertCircle, ShieldAlert, Sparkles, HelpCircle } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';

export const AIReportSummarizer = () => {
  const [selectedReport, setSelectedReport] = useState('');
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);

  const mockReportsList = [
    { value: 'cbc', label: 'Complete Blood Count (CBC) - Aarav Sharma' },
    { value: 'lipid', label: 'Lipid Profile - Vikram Malhotra' },
    { value: 'urine', label: 'Urinalysis Report - Ananya Iyer' }
  ];

  const handleSummarize = (e) => {
    e.preventDefault();
    if (!selectedReport) return;
    setLoading(true);

    setTimeout(() => {
      let reportSummary = {};

      if (selectedReport === 'cbc') {
        reportSummary = {
          title: 'Complete Blood Count (CBC) Summary',
          patientName: 'Aarav Sharma',
          date: '2026-08-20',
          findings: [
            { parameter: 'Hemoglobin', value: '11.8 g/dL', status: 'Low', range: '13.5 - 17.5 g/dL', explanation: 'Slightly low hemoglobin indicating mild anemia. This can cause minor fatigue.' },
            { parameter: 'White Blood Cells', value: '7,500 /mcL', status: 'Normal', range: '4,500 - 11,000 /mcL', explanation: 'WBC count is within normal ranges, indicating no immediate bacterial infections.' },
            { parameter: 'Platelet Count', value: '250,000 /mcL', status: 'Normal', range: '150,000 - 450,000 /mcL', explanation: 'Blood clotting cell levels are healthy.' }
          ],
          aiExplanation: 'The blood test reveals mild anemia based on the lower-than-normal Hemoglobin level (11.8 g/dL). Other parameters like infection fighting white cells and clotting platelets are completely normal.',
          doctorQuestions: [
            'Could my low hemoglobin be related to dietary iron intake?',
            'Do you recommend iron supplements or just dietary changes?',
            'Should we repeat the CBC test after a month?'
          ]
        };
      } else if (selectedReport === 'lipid') {
        reportSummary = {
          title: 'Lipid Profile Summary',
          patientName: 'Vikram Malhotra',
          date: '2026-08-22',
          findings: [
            { parameter: 'Total Cholesterol', value: '235 mg/dL', status: 'High', range: '< 200 mg/dL', explanation: 'Elevated total blood cholesterol, suggesting potential plaque risks.' },
            { parameter: 'LDL (Bad Cholesterol)', value: '155 mg/dL', status: 'High', range: '< 100 mg/dL', explanation: 'Significantly elevated bad cholesterol. Requires management.' },
            { parameter: 'HDL (Good Cholesterol)', value: '45 mg/dL', status: 'Normal', range: '> 40 mg/dL', explanation: 'Good cholesterol levels are within target guidelines.' }
          ],
          aiExplanation: 'The lipid profile shows elevated Total Cholesterol (235 mg/dL) and LDL Cholesterol (155 mg/dL). This cardiovascular signature is consistent with hyperlipidemia, suggesting diet adjustment or statin medicines.',
          doctorQuestions: [
            'Does my LDL level require statin medication, or should I attempt diet modifications first?',
            'What lifestyle changes would have the greatest impact on my cholesterol?',
            'Should we plan a stress test or heart assessment?'
          ]
        };
      } else {
        reportSummary = {
          title: 'Urinalysis Report Summary',
          patientName: 'Ananya Iyer',
          date: '2026-08-25',
          findings: [
            { parameter: 'Glucose', value: 'Negative', status: 'Normal', range: 'Negative', explanation: 'No sugar present, indicating normal filtration.' },
            { parameter: 'Proteins', value: 'Trace (+1)', status: 'Low Alert', range: 'Negative', explanation: 'Trace amounts of protein found, suggesting minor kidney stress or dehydration.' },
            { parameter: 'Leukocytes', value: 'Positive', status: 'High', range: 'Negative', explanation: 'Presence of white cells suggests potential urinary tract infection (UTI).' }
          ],
          aiExplanation: 'The urinalysis report indicates trace protein levels and positive white cells (Leukocytes). This is commonly seen in localized UTIs or dehydration stresses.',
          doctorQuestions: [
            'Does the presence of leukocytes indicate a UTI that requires antibiotics?',
            'Could my post-op dehydration cause the trace protein?',
            'Do you recommend a urine culture test?'
          ]
        };
      }

      setSummary(reportSummary);
      setLoading(false);
    }, 1500);
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
