import { GoogleGenAI, Type } from "@google/genai";
import { TestRecord, TestConfig, Patient, AIAnalysisResult } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const analyzeTestResult = async (
  patient: Patient,
  currentRecord: TestRecord,
  previousRecord: TestRecord | undefined,
  config: TestConfig
): Promise<AIAnalysisResult | null> => {
  const ai = getClient();
  if (!ai) {
    console.warn("API Key not found for Gemini.");
    return null;
  }

  const hasPrevious = !!previousRecord;
  const deltaVal = hasPrevious ? ((currentRecord.value - previousRecord!.value) / previousRecord!.value) * 100 : 0;
  
  const prompt = `
    Analyze this pathology test result.
    
    Patient: ${patient.name}, Age: ${patient.age}, Gender: ${patient.gender}
    Test: ${config.name}
    Current Value: ${currentRecord.value} ${config.unit} (Date: ${currentRecord.date})
    Previous Value: ${hasPrevious ? `${previousRecord!.value} ${config.unit} (Date: ${previousRecord!.date})` : 'None'}
    Normal Range: ${config.minNormal} - ${config.maxNormal} ${config.unit}
    Critical Limits: Low < ${config.criticalLow || 'N/A'}, High > ${config.criticalHigh || 'N/A'}
    
    Task:
    1. Determine if this is a repeat visit.
    2. Check Delta: Is the change significant? (Threshold is approx ${config.deltaPercentThreshold}%)
    3. Check Outlier: Is the value critical or abnormal?
    4. Recommend Action: Inform Pathologist, Notify Patient, or No Action.
    5. Draft a short, professional note for the pathologist.
    6. Draft a polite, non-alarming notification for the patient if follow-up is needed (if normal, just say results are ready).
    7. Provide brief clinical reasoning.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            repeatVisit: { type: Type.BOOLEAN },
            deltaCheckResult: { type: Type.STRING, enum: ['Normal', 'Significant Change', 'Outlier'] },
            actionRequired: { type: Type.STRING, enum: ['Inform Pathologist', 'Notify Patient', 'No Action'] },
            pathologistNote: { type: Type.STRING },
            patientNotification: { type: Type.STRING },
            clinicalReasoning: { type: Type.STRING }
          },
          required: ["repeatVisit", "deltaCheckResult", "actionRequired", "pathologistNote", "patientNotification", "clinicalReasoning"]
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text) as AIAnalysisResult;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return null;
  }
};
