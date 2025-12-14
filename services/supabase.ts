import { createClient } from '@supabase/supabase-js';
import { Patient, TestConfig, TestRecord } from '../types';

// Configuration provided by user
const SUPABASE_URL = 'https://evcdfhlkalgrldfbegmw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2Y2RmaGxrYWxncmxkZmJlZ213Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MTQ1MzQsImV4cCI6MjA4MTI5MDUzNH0.BY5d_ejDk3GOby8yOpqv2_0-6KDUmL-RMzbGO0u64Po';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Mappers ---

// Map DB snake_case to Frontend camelCase
export const mapPatientFromDB = (row: any): Patient => ({
  id: row.id,
  name: row.name,
  phone: row.phone,
  age: row.age,
  gender: row.gender,
  createdAt: row.created_at
});

export const mapPatientToDB = (patient: Partial<Patient>) => ({
  id: patient.id,
  name: patient.name,
  phone: patient.phone,
  age: patient.age,
  gender: patient.gender,
  created_at: patient.createdAt
});

export const mapTestConfigFromDB = (row: any): TestConfig => ({
  id: row.id,
  name: row.name,
  unit: row.unit,
  minNormal: row.min_normal,
  maxNormal: row.max_normal,
  criticalLow: row.critical_low,
  criticalHigh: row.critical_high,
  deltaPercentThreshold: row.delta_percent_threshold,
  followUpDays: row.follow_up_days
});

export const mapTestConfigToDB = (config: TestConfig) => ({
  id: config.id,
  name: config.name,
  unit: config.unit,
  min_normal: config.minNormal,
  max_normal: config.maxNormal,
  critical_low: config.criticalLow,
  critical_high: config.criticalHigh,
  delta_percent_threshold: config.deltaPercentThreshold,
  follow_up_days: config.followUpDays
});

export const mapTestRecordFromDB = (row: any): TestRecord => ({
  id: row.id,
  patientId: row.patient_id,
  testTypeId: row.test_type_id,
  value: row.value,
  date: row.date,
  notes: row.notes,
  aiAnalysis: row.ai_analysis
});

export const mapTestRecordToDB = (record: TestRecord) => ({
  id: record.id,
  patient_id: record.patientId,
  test_type_id: record.testTypeId,
  value: record.value,
  date: record.date,
  notes: record.notes,
  ai_analysis: record.aiAnalysis
});

// --- API Methods ---

export const api = {
  fetchPatients: async (): Promise<Patient[]> => {
    const { data, error } = await supabase.from('patients').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapPatientFromDB);
  },

  createPatient: async (patient: Patient): Promise<Patient> => {
    const dbPayload = mapPatientToDB(patient);
    const { data, error } = await supabase.from('patients').insert(dbPayload).select().single();
    if (error) throw error;
    return mapPatientFromDB(data);
  },

  fetchTestConfigs: async (): Promise<TestConfig[]> => {
    const { data, error } = await supabase.from('test_configs').select('*');
    if (error) throw error;
    return (data || []).map(mapTestConfigFromDB);
  },

  upsertTestConfig: async (config: TestConfig): Promise<TestConfig> => {
    const dbPayload = mapTestConfigToDB(config);
    const { data, error } = await supabase.from('test_configs').upsert(dbPayload).select().single();
    if (error) throw error;
    return mapTestConfigFromDB(data);
  },
  
  // Batch insert for seeding - Changed to Upsert to be robust against "duplicate key" errors
  insertTestConfigs: async (configs: TestConfig[]): Promise<TestConfig[]> => {
    const dbPayloads = configs.map(mapTestConfigToDB);
    // Using upsert with onConflict ignore (or update) prevents crashing if data partially exists
    const { data, error } = await supabase.from('test_configs').upsert(dbPayloads, { onConflict: 'id' }).select();
    if (error) throw error;
    return (data || []).map(mapTestConfigFromDB);
  },

  fetchTestRecords: async (): Promise<TestRecord[]> => {
    const { data, error } = await supabase.from('test_records').select('*').order('date', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapTestRecordFromDB);
  },

  createTestRecord: async (record: TestRecord): Promise<TestRecord> => {
    const dbPayload = mapTestRecordToDB(record);
    const { data, error } = await supabase.from('test_records').insert(dbPayload).select().single();
    if (error) throw error;
    return mapTestRecordFromDB(data);
  }
};
