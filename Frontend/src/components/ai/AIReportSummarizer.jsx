import React, { useState, useEffect, useRef } from 'react';
import {
  FileHeart,
  FileText,
  Sparkles,
  ShieldAlert,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  HeartPulse,
  Stethoscope,
  Info,
  Upload,
  X,
  ClipboardList
} from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { reportSummarizerService } from '../../services/reportSummarizerService';

const SUPPORTED_EXTENSIONS = ['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png', 'webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const NOT_AVAILABLE = 'Not clearly available in the uploaded report.';
const UNSUPPORTED_MESSAGE =
  'This file format is not supported. Please upload a PDF, DOC, DOCX, TXT, JPG, JPEG, PNG, or WEBP report.';

const NORMAL_STATUSES = ['normal', 'within range', 'in range', 'negative', 'non-reactive', 'optimal', 'desirable'];
const ABNORMAL_STATUSES = [
  'high',
  'low',
  'flagged',
  'critical',
  'elevated',
  'decreased',
  'abnormal',
  'out of range',
  'above normal',
  'below normal',
  'high alert',
  'low alert',
  'positive'
];

const formatBytes = (bytes) => {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const statusColor = (status) => {
  const text = String(status || '').toUpperCase();
  if (['HIGH', 'LOW', 'CRITICAL', 'FLAGGED', 'ABNORMAL', 'POSITIVE', 'ELEVATED', 'DECREASED', 'OUT OF RANGE'].includes(text)) {
    return 'bg-rose-50 text-rose-700 border-rose-200';
  }
  if (['WARNING', 'NEAR OPTIMAL', 'BORDERLINE', 'TRACE'].includes(text)) {
    return 'bg-amber-50 text-amber-700 border-amber-200';
  }
  return 'bg-emerald-50 text-emerald-700 border-emerald-200';
};

const findingLine = (f) => {
  const valuePart = f.unit && f.unit !== NOT_AVAILABLE ? `${f.value} ${f.unit}`.trim() : f.value;
  const rangePart =
    f.referenceRange && f.referenceRange !== NOT_AVAILABLE ? ` (Reference: ${f.referenceRange})` : '';
  return `${f.test}: ${valuePart}${rangePart}`;
};

const deriveByStatus = (findings, statuses) =>
  (findings || [])
    .filter((f) => statuses.includes(String(f.status || '').toLowerCase()))
    .map(findingLine);

// Normalizes both the new structured summaries and older stored documents
// (aiExplanation / findings / doctorQuestions) into the same view model.
const mapSummary = (doc) => {
  if (!doc) return null;
  const overview = doc.reportOverview || {};
  const findings = (doc.findings || []).map((f) => ({
    test: f.parameter,
    value: f.value,
    unit: '',
    referenceRange: f.range,
    status: f.status,
    explanation: f.explanation
  }));

  return {
    title: doc.title || 'Medical Report Summary',
    fileName: doc.fileName || '',
    fileType: doc.fileType || '',
    reportType: doc.reportType || NOT_AVAILABLE,
    reportDate: doc.date || NOT_AVAILABLE,
    reportOverview: {
      reportType: overview.reportType || doc.reportType || NOT_AVAILABLE,
      reportDate: overview.reportDate || doc.date || NOT_AVAILABLE,
      department: overview.department || NOT_AVAILABLE,
      purpose: overview.purpose || NOT_AVAILABLE
    },
    simpleSummary: doc.simpleSummary || doc.aiExplanation || '',
    keyFindings: findings,
    normalFindings: Array.isArray(doc.normalFindings) && doc.normalFindings.length
      ? doc.normalFindings
      : deriveByStatus(findings, NORMAL_STATUSES),
    abnormalFindings: Array.isArray(doc.abnormalFindings) && doc.abnormalFindings.length
      ? doc.abnormalFindings
      : deriveByStatus(findings, ABNORMAL_STATUSES),
    possibleSignificance: doc.possibleSignificance || [],
    possibleCausesOrFactors: doc.possibleCausesOrFactors || [],
    generalPreventionAndGuidance: doc.generalPreventionAndGuidance || [],
    doctorConsultation: doc.doctorConsultation || [],
    questionsForDoctor: doc.questionsForDoctor || doc.doctorQuestions || [],
    disclaimer: doc.disclaimer || null
  };
};

const getExtension = (name) => String(name || '').split('.').pop().toLowerCase().trim();

export const AIReportSummarizer = () => {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [savedSummaries, setSavedSummaries] = useState([]);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    const fetchSummaries = async () => {
      try {
        const data = await reportSummarizerService.getMyReportSummaries();
        if (data.success) {
          setSavedSummaries(data.summaries);
        }
      } catch (err) {
        console.error('Failed to load report summaries', err);
      }
    };
    fetchSummaries();
  }, []);

  const resetFile = () => {
    setFile(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleFileChosen = (chosen) => {
    setError('');
    if (!chosen) return;

    const ext = getExtension(chosen.name);
    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
      setError(UNSUPPORTED_MESSAGE);
      return;
    }
    if (chosen.size > MAX_FILE_SIZE) {
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
      setError('File is too large. Maximum allowed size is 10 MB.');
      return;
    }
    setFile(chosen);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer?.files?.[0];
    if (dropped) handleFileChosen(dropped);
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');

    if (!file) {
      setError('Please upload a report before analyzing.');
      return;
    }

    const ext = getExtension(file.name);
    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      setError(UNSUPPORTED_MESSAGE);
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('File is too large. Maximum allowed size is 10 MB.');
      return;
    }

    setLoading(true);
    try {
      const data = await reportSummarizerService.analyzeReport(file);
      if (data.success) {
        setSummary(mapSummary(data.summary));
        setSavedSummaries((prev) => [data.summary, ...prev.filter((s) => s._id !== data.summary._id)]);
      } else {
        setError(data.message || 'Unable to analyze the report right now. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to analyze the report right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderList = (items, colorClass, Icon) => {
    if (!items || items.length === 0) return null;
    return (
      <ul className="space-y-2">
        {items.map((item, idx) => (
          <li key={idx} className="flex gap-2 items-start text-xs leading-relaxed text-slate-600">
            {Icon && <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${colorClass}`} />}
            <span>{item}</span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl flex items-start gap-3 text-xs leading-normal">
        <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Medical Assistive Disclaimer:</span>
          <p className="mt-0.5">
            The Report Summarizer extracts and simplifies information found in the uploaded report. It does not
            diagnose and does not replace a doctor&apos;s analysis. Clinical actions must only be taken after
            consulting your primary physician.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-xl text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Card
            title="Upload Medical Report"
            subtitle="PDF, DOC, DOCX, TXT, JPG, JPEG, PNG or WEBP"
            className="h-fit"
          >
            <form onSubmit={handleAnalyze} className="space-y-4">
              <label
                htmlFor="report-file-input"
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                className={`block border border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                  dragging
                    ? 'border-blue-400 bg-blue-50'
                    : file
                      ? 'border-emerald-300 bg-emerald-50/40'
                      : 'border-slate-300 hover:bg-slate-50'
                }`}
              >
                <input
                  ref={inputRef}
                  id="report-file-input"
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.webp"
                  className="sr-only"
                  onChange={(e) => handleFileChosen(e.target.files?.[0])}
                />
                {file ? (
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-800 truncate">{file.name}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {file.type || 'Unknown type'} • {formatBytes(file.size)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={resetFile}
                      className="shrink-0 p-1.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      aria-label="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="w-10 h-10 mx-auto rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mb-2">
                      <Upload className="w-5 h-5" />
                    </div>
                    <span className="block text-[10px] text-slate-500 font-semibold">Choose File or Drag & Drop</span>
                    <span className="block text-[9px] text-slate-400 mt-0.5">Maximum file size: 10 MB</span>
                  </div>
                )}
              </label>

              <Button type="submit" variant="primary" loading={loading} className="w-full" icon={Sparkles} size="md">
                {loading ? 'Analyzing...' : 'Analyze Report'}
              </Button>
            </form>
          </Card>

          {savedSummaries.length > 0 && (
            <Card title="Previous Summaries" subtitle="Click to reopen a past analysis" bodyClassName="p-3">
              <ul className="space-y-1 max-h-64 overflow-y-auto">
                {savedSummaries.map((s) => (
                  <li key={s._id}>
                    <button
                      type="button"
                      onClick={() => {
                        setError('');
                        setSummary(mapSummary(s));
                      }}
                      className="w-full text-left p-2.5 rounded-lg hover:bg-slate-50 flex items-start gap-2.5 transition-colors"
                    >
                      <ClipboardList className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <span className="min-w-0">
                        <span className="block text-xs font-semibold text-slate-700 truncate">{s.title}</span>
                        <span className="block text-[10px] text-slate-400 mt-0.5 truncate">
                          {s.reportType || 'Report'} • {s.date || ''}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        {/* Right column - results */}
        <div className="md:col-span-2 space-y-4">
          {loading ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center h-full flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">Analyzing your report...</h3>
              <p className="text-xs text-slate-400 max-w-xs mt-1 leading-normal">
                The report is being securely processed and summarized by AI. This can take a few moments.
              </p>
            </div>
          ) : !summary ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center h-full flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mb-4">
                <FileHeart className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">Awaiting Report Analysis</h3>
              <p className="text-xs text-slate-400 max-w-xs mt-1 leading-normal">
                Upload a medical report to view its AI-generated, easy-to-understand summary here.
              </p>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* Report Overview */}
              <Card title={summary.title} subtitle={summary.fileName || undefined}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {[
                    ['Report Type', summary.reportOverview.reportType],
                    ['Report Date', summary.reportOverview.reportDate],
                    ['Department', summary.reportOverview.department],
                    ['Purpose', summary.reportOverview.purpose]
                  ].map(([label, value]) => (
                    <div key={label} className="bg-slate-50 rounded-lg p-3">
                      <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400 mb-1">{label}</p>
                      <p className="text-slate-700 leading-relaxed">{value}</p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Simple Summary */}
              {summary.simpleSummary && (
                <Card title="Simple Summary" subtitle="What this report says in plain language">
                  <p className="text-xs leading-relaxed text-slate-600">{summary.simpleSummary}</p>
                </Card>
              )}

              {/* Key Findings */}
              {summary.keyFindings.length > 0 && (
                <Card title="Key Findings" subtitle="Values identified in the uploaded report">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold">
                          <th className="p-3">Test / Finding</th>
                          <th className="p-3">Reported Value</th>
                          <th className="p-3">Reference Range</th>
                          <th className="p-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-600">
                        {summary.keyFindings.map((f, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/20 align-top">
                            <td className="p-3 font-semibold text-slate-800">
                              {f.test}
                              {f.explanation && (
                                <span className="block text-[9px] font-medium text-slate-400 mt-0.5 leading-normal max-w-[260px]">
                                  {f.explanation}
                                </span>
                              )}
                            </td>
                            <td className="p-3 font-semibold text-slate-800 whitespace-nowrap">{f.value}</td>
                            <td className="p-3 text-slate-400 whitespace-nowrap">{f.referenceRange}</td>
                            <td className="p-3">
                              {f.status && (
                                <Badge className={statusColor(f.status)}>
                                  {String(f.status).toUpperCase()}
                                </Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

              {/* Within Range */}
              {summary.normalFindings.length > 0 && (
                <Card title="Within Range Findings" subtitle="Values that fall inside the stated reference ranges">
                  {renderList(summary.normalFindings, 'text-emerald-500', CheckCircle2)}
                </Card>
              )}

              {/* Abnormal / Notable */}
              {summary.abnormalFindings.length > 0 && (
                <Card title="Abnormal / Notable Findings" subtitle="Values flagged outside their stated reference ranges">
                  {renderList(summary.abnormalFindings, 'text-rose-500', AlertTriangle)}
                </Card>
              )}

              {/* Possible Significance */}
              {summary.possibleSignificance.length > 0 && (
                <Card title="What It May Mean" subtitle="General explanation — not a diagnosis">
                  {renderList(summary.possibleSignificance, 'text-blue-500', Lightbulb)}
                </Card>
              )}

              {/* Possible Factors */}
              {summary.possibleCausesOrFactors.length > 0 && (
                <Card title="Possible Factors" subtitle="Commonly associated factors (educational information)">
                  {renderList(summary.possibleCausesOrFactors, 'text-slate-500', Info)}
                </Card>
              )}

              {/* Prevention & Guidance */}
              {summary.generalPreventionAndGuidance.length > 0 && (
                <Card title="General Prevention & Guidance" subtitle="Informational lifestyle and follow-up advice">
                  {renderList(summary.generalPreventionAndGuidance, 'text-emerald-500', HeartPulse)}
                </Card>
              )}

              {/* When to Consult a Doctor */}
              {summary.doctorConsultation.length > 0 && (
                <Card title="When to Consult a Doctor" subtitle="Findings that may reasonably warrant professional review">
                  {renderList(summary.doctorConsultation, 'text-blue-600', Stethoscope)}
                </Card>
              )}

              {/* Questions for Doctor */}
              {summary.questionsForDoctor.length > 0 && (
                <Card title="Questions to Ask Your Doctor" subtitle="Based on the findings in your report">
                  {renderList(summary.questionsForDoctor, 'text-indigo-500', HelpCircle)}
                </Card>
              )}

              {/* Disclaimer */}
              {(summary.disclaimer || true) && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl flex items-start gap-3 text-xs leading-relaxed">
                  <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <p>{summary.disclaimer || 'This AI-generated summary is for informational purposes only and is not a medical diagnosis or a replacement for professional medical advice. Please consult a qualified healthcare professional for interpretation and treatment decisions.'}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIReportSummarizer;