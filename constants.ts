import { TestConfig, TestType, Patient, TestRecord } from './types';

// Default configurations used for seeding the database if empty
export const TEST_CONFIGS: Record<string, TestConfig> = {
  [TestType.HBA1C]: {
    id: TestType.HBA1C,
    name: 'HbA1c',
    unit: '%',
    minNormal: 4.0,
    maxNormal: 5.6,
    criticalHigh: 9.0,
    deltaPercentThreshold: 10,
    followUpDays: 90, // 3 months
  },
  [TestType.TSH]: {
    id: TestType.TSH,
    name: 'TSH',
    unit: 'mIU/L',
    minNormal: 0.4,
    maxNormal: 4.0,
    criticalLow: 0.1,
    criticalHigh: 10.0,
    deltaPercentThreshold: 20,
    followUpDays: 180, // 6 months
  },
  [TestType.GLUCOSE_FASTING]: {
    id: TestType.GLUCOSE_FASTING,
    name: 'Glucose (Fasting)',
    unit: 'mg/dL',
    minNormal: 70,
    maxNormal: 100,
    criticalLow: 50,
    criticalHigh: 300,
    deltaPercentThreshold: 15,
    followUpDays: 180,
  }
};
