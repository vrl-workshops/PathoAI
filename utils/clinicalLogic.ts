import { TestRecord, TestConfig, Alert } from '../types';

export const calculateDelta = (current: number, previous: number): number => {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

export const getOutlierStatus = (value: number, config: TestConfig): 'Normal' | 'Abnormal' | 'Critical' => {
  if (config.criticalHigh && value >= config.criticalHigh) return 'Critical';
  if (config.criticalLow && value <= config.criticalLow) return 'Critical';
  if (value > config.maxNormal || value < config.minNormal) return 'Abnormal';
  return 'Normal';
};

export const getPreviousTest = (records: TestRecord[], patientId: string, testTypeId: string, currentRecordId?: string): TestRecord | undefined => {
  // Sort by date descending
  const relevantRecords = records
    .filter(r => r.patientId === patientId && r.testTypeId === testTypeId && r.id !== currentRecordId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  return relevantRecords[0];
};

export const checkFollowUpNeeded = (records: TestRecord[], config: TestConfig): boolean => {
  // Sort by date descending
  const sorted = [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  if (sorted.length === 0) return false;

  const lastTest = sorted[0];
  const lastDate = new Date(lastTest.date);
  const now = new Date();
  
  const diffTime = Math.abs(now.getTime() - lastDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

  return diffDays >= config.followUpDays;
};
