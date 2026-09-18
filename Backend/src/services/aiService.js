import { GoogleGenAI, Type } from '@google/genai';

export const summarizeClinicalReport = async (reportData) => {
  // Ensure we have an API key configured
  if (!process.env.AI_API_KEY) {
    throw new Error('AI Provider is not configured. Missing AI_API_KEY.');
  }

  const ai = new GoogleGenAI({ apiKey: process.env.AI_API_KEY });
  const model = process.env.AI_MODEL || 'gemini-1.5-flash';

  const prompt = `
You are a highly qualified medical AI assistant designed to summarize clinical reports for patients in simple, easy-to-understand language.

Task: Analyze the following clinical report data and generate a structured summary.

Report Data:
${JSON.stringify(reportData, null, 2)}

Instructions:
1. Generate an "aiExplanation": A short narrative summary explaining the overall test results simply. Avoid heavy medical jargon.
2. Extract "findings": Identify key biomarkers. For each, provide the 'parameter' name, the reported 'value', the 'range' (reference range), a 'status' (e.g., 'Normal', 'High', 'Low', 'Low Alert', 'Positive', 'Negative'), and a simple 'explanation' of what this parameter means and why the status is what it is.
3. Suggest "doctorQuestions": Generate exactly 3 relevant questions the patient should ask their doctor based on these specific results.
4. Keep the original reported values and ranges. DO NOT invent or alter values.
5. Do not diagnose the patient unless the report explicitly provides a diagnosis.
6. Do not prescribe medication or recommend changing medical treatment.
`;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      aiExplanation: {
        type: Type.STRING,
        description: "A short, simple narrative summary of the overall test results."
      },
      findings: {
        type: Type.ARRAY,
        description: "Key biomarkers extracted from the report.",
        items: {
          type: Type.OBJECT,
          properties: {
            parameter: { type: Type.STRING },
            value: { type: Type.STRING },
            range: { type: Type.STRING },
            status: { type: Type.STRING, description: "E.g., Normal, High, Low, Low Alert" },
            explanation: { type: Type.STRING, description: "Simple explanation of the parameter and its significance based on the value." }
          },
          required: ["parameter", "value", "range", "status", "explanation"]
        }
      },
      doctorQuestions: {
        type: Type.ARRAY,
        description: "Exactly 3 questions the patient should ask their doctor.",
        items: { type: Type.STRING }
      }
    },
    required: ["aiExplanation", "findings", "doctorQuestions"]
  };

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
      },
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error('Error in AI Service:', error);
    throw new Error('Failed to generate report summary');
  }
};
