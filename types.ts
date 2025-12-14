export interface Patient {
  id: string;
  phone: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  createdAt: string;
}

export enum TestType {
  HBA1C = 'HbA1c',
  TSH = 'TSH',
  LIPID_TOTAL_CHOLESTEROL = 'Total Cholesterol',
  HEMOGLOBIN = 'Hemoglobin',
  CREATININE = 'Creatinine',
  GLUCOSE_FASTING = 'Glucose (Fasting)'
}

export interface TestConfig {
  id: string;
  name: string;
  unit: string;
  minNormal: number;
  maxNormal: number;
  criticalLow?: number;
  criticalHigh?: number;
  deltaPercentThreshold: number; // Percentage change to flag as significant
  followUpDays: number; // Days after which a reminder is needed
}

export interface TestRecord {
  id: string;
  patientId: string;
  testTypeId: string;
  value: number;
  date: string; // ISO String
  notes?: string;
  aiAnalysis?: AIAnalysisResult;
}

export interface AIAnalysisResult {
  repeatVisit: boolean;
  deltaCheckResult: 'Normal' | 'Significant Change' | 'Outlier';
  actionRequired: 'Inform Pathologist' | 'Notify Patient' | 'No Action';
  pathologistNote: string;
  patientNotification: string;
  clinicalReasoning: string;
}

export interface Alert {
  id: string;
  patientId: string;
  type: 'REMINDER' | 'CRITICAL' | 'DELTA';
  message: string;
  date: string;
  isRead: boolean;
}