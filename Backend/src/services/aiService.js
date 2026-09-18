const DEFAULT_MODEL = 'gemini-3.1-flash-lite';
const AI_UNAVAILABLE = 'AI_REPORT_SUMMARIZER_UNAVAILABLE';
const NOT_AVAILABLE = 'Not clearly available in the uploaded report.';

export const DEFAULT_DISCLAIMER =
  'This AI-generated summary is for informational purposes only and is not a medical diagnosis or a replacement for professional medical advice. Please consult a qualified healthcare professional for interpretation and treatment decisions.';

// Cap the amount of raw report text sent to the model to stay well within
// reasonable token limits for a summarized document.
const REPORT_TEXT_LIMIT = 120000;

const buildPrompt = ({ reportText, isImage }) => {
  const sourceStatement = isImage
    ? 'The uploaded medical report is provided as an image attached to this request. Carefully read every visible part of the image.'
    : 'The uploaded medical report contents are provided below as extracted text.';

  const reportSection = isImage
    ? 'The report image is attached to this request — analyze only what is visible in it.'
    : `--- BEGIN REPORT CONTENT ---
${String(reportText || '').slice(0, REPORT_TEXT_LIMIT)}
--- END REPORT CONTENT ---`;

  return `You are a medical AI assistant that summarizes clinical and diagnostic reports for non-medical users in simple, easy-to-understand language.

You must base your analysis ONLY on the information present in the uploaded report.

${sourceStatement}

${reportSection}

Rules:
1. Extract and preserve the actual values and units exactly as written in the report (for example "11.8 g/dL").
2. Preserve reference ranges exactly as printed when the report includes them. Do NOT invent reference ranges; when a range is not present use "${NOT_AVAILABLE}".
3. Identify findings that are within range and findings that are abnormal / high / low / flagged, ONLY when the report or its stated reference ranges support that interpretation.
4. Explain medical terminology in plain language a non-medical person can understand.
5. Possible significance and possible causes/factors are GENERAL educational information only and must be clearly separated from reported findings. Use cautious wording such as "This finding can sometimes be associated with...", "This may warrant discussion with a healthcare professional...", and "The report alone cannot determine the cause." Never present them as a diagnosis.
6. Do NOT invent laboratory values, diagnoses, medications, symptoms, test results, assumptions, or treatment/causes. If a value or section cannot be read clearly, write "${NOT_AVAILABLE}".
7. Do NOT diagnose the patient and do NOT prescribe, start, or stop any medication or treatment.
8. Prevention and guidance must be general informational advice only (lifestyle considerations, monitoring, follow-up testing, discussing results with a doctor). Never prescribe treatment.
9. "When to consult a doctor" guidance must follow directly from the report. Only flag urgency when the report itself supports it; otherwise provide routine follow-up advice.
10. Questions for the doctor must be based on the actual report findings.
11. Every array section must contain only full text strings. Never use null, true, false, or empty strings inside array sections; if a section has no entries, provide an empty array [].

If the uploaded report contains NO readable medical information (for example a blank or unreadable scan), set "noReadableContent" to true, set "simpleSummary" to an empty string, and return empty arrays for all array sections.

Respond with ONLY valid JSON (no markdown, no backticks, no extra text) matching EXACTLY this structure:
{
  "reportOverview": { "reportType": "", "reportDate": "", "department": "", "purpose": "" },
  "simpleSummary": "",
  "keyFindings": [
    { "test": "", "value": "", "unit": "", "referenceRange": "", "status": "", "explanation": "" }
  ],
  "normalFindings": [],
  "abnormalFindings": [],
  "possibleSignificance": [],
  "possibleCausesOrFactors": [],
  "generalPreventionAndGuidance": [],
  "doctorConsultation": [],
  "questionsForDoctor": [],
  "disclaimer": "",
  "noReadableContent": false
}

"status" in keyFindings should be one of: Normal, Within Range, High, Low, Positive, Negative, or Flagged when supported by the report. Use "${NOT_AVAILABLE}" for any field that cannot be identified in the report.`;
};

const extractJson = (text) => {
  const trimmed = String(text || '').trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced ? fenced[1] : trimmed).trim();
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('No JSON object found in model response.');
  }
  return candidate.slice(start, end + 1);
};

const toStringArray = (value, max = 25) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === 'string') return item.trim();
      if (item && typeof item === 'object') return String(item.text ?? '').trim();
      return '';
    })
    .filter(Boolean)
    .slice(0, max);
};

const NORMAL_STATUSES = new Set([
  'normal',
  'within range',
  'in range',
  'negative',
  'non-reactive',
  'optimal',
  'desirable'
]);

const ABNORMAL_STATUSES = new Set([
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
]);

const deriveFindingsSummary = (findings, statuses) =>
  findings
    .filter((f) => statuses.has(String(f.status || '').toLowerCase()))
    .map((f) => {
      const valuePart = f.unit ? `${f.value} ${f.unit}`.trim() : f.value;
      const rangePart =
        f.referenceRange && f.referenceRange !== NOT_AVAILABLE ? ` (Reference: ${f.referenceRange})` : '';
      return `${f.test}: ${valuePart}${rangePart}`;
    });

const normalizeSummary = (parsed) => {
  const overview = parsed && typeof parsed.reportOverview === 'object' ? parsed.reportOverview : {};

  const rawFindings = Array.isArray(parsed?.keyFindings) ? parsed.keyFindings : [];
  const keyFindings = rawFindings
    .filter((f) => f && typeof f === 'object')
    .map((f) => ({
      test: String(f.test || f.parameter || '').trim() || NOT_AVAILABLE,
      value: String(f.value ?? '').trim(),
      unit: String(f.unit ?? '').trim(),
      referenceRange: String(f.referenceRange || f.range || '').trim() || NOT_AVAILABLE,
      status: String(f.status ?? '').trim(),
      explanation: String(f.explanation ?? '').trim()
    }))
    .filter((f) => f.value || f.test !== NOT_AVAILABLE);

  const simpleSummary = String(parsed?.simpleSummary ?? '').trim();
  const aiNormalFindings = toStringArray(parsed?.normalFindings);
  const aiAbnormalFindings = toStringArray(parsed?.abnormalFindings);

  // Derive the normal/abnormal sections from the extracted findings whenever the
  // model did not supply them, so the summary always reflects the actual report.
  const normalFindings =
    aiNormalFindings.length > 0 ? aiNormalFindings : deriveFindingsSummary(keyFindings, NORMAL_STATUSES);
  const abnormalFindings =
    aiAbnormalFindings.length > 0 ? aiAbnormalFindings : deriveFindingsSummary(keyFindings, ABNORMAL_STATUSES);

  const noReadableContent =
    parsed?.noReadableContent === true ||
    (!simpleSummary && keyFindings.length === 0 && normalFindings.length === 0 && abnormalFindings.length === 0);

  return {
    reportOverview: {
      reportType: String(overview.reportType ?? '').trim() || NOT_AVAILABLE,
      reportDate: String(overview.reportDate ?? '').trim() || NOT_AVAILABLE,
      department: String(overview.department ?? '').trim() || NOT_AVAILABLE,
      purpose: String(overview.purpose ?? '').trim() || NOT_AVAILABLE
    },
    simpleSummary,
    keyFindings,
    normalFindings,
    abnormalFindings,
    possibleSignificance: toStringArray(parsed?.possibleSignificance),
    possibleCausesOrFactors: toStringArray(parsed?.possibleCausesOrFactors),
    generalPreventionAndGuidance: toStringArray(parsed?.generalPreventionAndGuidance),
    doctorConsultation: toStringArray(parsed?.doctorConsultation),
    questionsForDoctor: toStringArray(parsed?.questionsForDoctor),
    disclaimer: String(parsed?.disclaimer ?? '').trim() || DEFAULT_DISCLAIMER,
    noReadableContent
  };
};

/**
 * Summarize an uploaded medical report using the configured Gemini model.
 *
 * @param {Object} options
 * @param {string} options.text       Extracted text for text-based reports.
 * @param {Object|null} options.imagePart When the report is an image: { base64, mimeType }.
 * @returns {Promise<Object>} Normalized structured summary.
 * @throws {Error} Always throws when Gemini is unavailable or returns unusable
 *                 output. There is intentionally NO fabricated fallback.
 */
export const summarizeClinicalReport = async ({ text, imagePart }) => {
  const apiKey = process.env.AI_API_KEY;
  const modelName = process.env.AI_MODEL || DEFAULT_MODEL;

  if (!apiKey) {
    throw new Error(AI_UNAVAILABLE);
  }

  const parts = [{ text: buildPrompt({ reportText: text, isImage: Boolean(imagePart) }) }];
  if (imagePart) {
    parts.push({ inline_data: { mime_type: imagePart.mimeType, data: imagePart.base64 } });
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { temperature: 0.2, responseMimeType: 'application/json' }
    })
  });

  if (!response.ok) {
    console.warn(`[Report Summarizer] Gemini API returned status ${response.status}.`);
    throw new Error(AI_UNAVAILABLE);
  }

  const data = await response.json();
  const candidateText = ((data?.candidates?.[0]?.content?.parts) || [])
    .map((part) => part.text || '')
    .join('')
    .trim();

  if (!candidateText) {
    console.warn('[Report Summarizer] Gemini returned an empty response.');
    throw new Error(AI_UNAVAILABLE);
  }

  let parsed;
  try {
    parsed = JSON.parse(extractJson(candidateText));
  } catch (err) {
    console.warn('[Report Summarizer] Could not parse the model JSON response:', err.message);
    throw new Error(AI_UNAVAILABLE);
  }

  return normalizeSummary(parsed);
};

export default { summarizeClinicalReport, DEFAULT_DISCLAIMER };