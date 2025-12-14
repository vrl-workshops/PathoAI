import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { PatientList } from './components/PatientList';
import { PatientDetail } from './components/PatientDetail';
import { Dashboard } from './components/Dashboard';
import { Settings } from './components/Settings';
import { Patient, TestRecord, TestConfig } from './types';
import { TEST_CONFIGS } from './constants';
import { analyzeTestResult } from './services/geminiService';
import { api } from './services/supabase';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [records, setRecords] = useState<TestRecord[]>([]);
  const [testConfigs, setTestConfigs] = useState<Record<string, TestConfig>>({});
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  
  // App State
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize Data from Supabase
  useEffect(() => {
    const initData = async () => {
      try {
        setIsLoading(true);
        const [fetchedPatients, fetchedConfigs, fetchedRecords] = await Promise.all([
          api.fetchPatients(),
          api.fetchTestConfigs(),
          api.fetchTestRecords()
        ]);

        setPatients(fetchedPatients);
        setRecords(fetchedRecords);

        // Handle Configs
        if (fetchedConfigs.length === 0) {
          // Seed DB if empty
          console.log('Seeding default test configurations...');
          const seeded = await api.insertTestConfigs(Object.values(TEST_CONFIGS));
          const configMap = seeded.reduce((acc, curr) => ({ ...acc, [curr.id]: curr }), {});
          setTestConfigs(configMap);
        } else {
          const configMap = fetchedConfigs.reduce((acc, curr) => ({ ...acc, [curr.id]: curr }), {});
          setTestConfigs(configMap);
        }
        
      } catch (err: any) {
        console.error("Failed to load data:", err);
        setError(err.message || "Failed to connect to database. Please check your Supabase credentials.");
      } finally {
        setIsLoading(false);
      }
    };

    initData();
  }, []);

  // Handle Configuration Updates
  const handleUpdateConfig = async (updatedConfig: TestConfig) => {
    try {
      const savedConfig = await api.upsertTestConfig(updatedConfig);
      setTestConfigs(prev => ({
        ...prev,
        [savedConfig.id]: savedConfig
      }));
    } catch (e) {
      console.error("Error updating config:", e);
      alert("Failed to update configuration");
    }
  };

  const handleAddConfig = async (newConfig: TestConfig) => {
    try {
      const savedConfig = await api.upsertTestConfig(newConfig);
      setTestConfigs(prev => ({
        ...prev,
        [savedConfig.id]: savedConfig
      }));
    } catch (e) {
       console.error("Error creating config:", e);
       alert("Failed to create configuration");
    }
  };

  // Create Patient & Optional Initial Record
  const handleAddPatient = async (
    patientData: Omit<Patient, 'id' | 'createdAt'>,
    initialTest?: { testTypeId: string; value: number; date: string }
  ) => {
    
    // 1. De-duplication: Check for existing patient by Name + Phone in local state (which reflects DB)
    const existingPatient = patients.find(p => 
      p.name.trim().toLowerCase() === patientData.name.trim().toLowerCase() && 
      p.phone.trim() === patientData.phone.trim()
    );

    let targetPatientId: string;
    let targetPatient: Patient;

    try {
      if (existingPatient) {
        console.log(`Duplicate detected. Using existing patient: ${existingPatient.name}`);
        targetPatient = existingPatient;
        targetPatientId = existingPatient.id;
      } else {
        targetPatientId = Date.now().toString(); // Or let UUID be generated if strict, but stick to client-side ID for simplicity with TS types
        const newPatient: Patient = {
          id: targetPatientId,
          createdAt: new Date().toISOString(),
          ...patientData
        };
        targetPatient = await api.createPatient(newPatient);
        setPatients(prev => [targetPatient, ...prev]);
      }

      // 2. Add Test Record if provided
      if (initialTest) {
          const recordId = (Date.now() + 1).toString();
          const newRecord: TestRecord = {
              id: recordId,
              patientId: targetPatientId,
              testTypeId: initialTest.testTypeId,
              value: initialTest.value,
              date: initialTest.date
          };

          // Attempt AI Analysis for the initial record
          try {
              const config = testConfigs[initialTest.testTypeId];
              // Get previous record for THIS patient if exists
              const patientExistingRecords = records.filter(r => r.patientId === targetPatientId && r.testTypeId === initialTest.testTypeId);
              const sorted = patientExistingRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
              const previousRecord = sorted[0];

              const analysis = await analyzeTestResult(targetPatient, newRecord, previousRecord, config);
              if (analysis) {
                  newRecord.aiAnalysis = analysis;
              }
          } catch (error) {
              console.error("Initial AI analysis failed", error);
          }

          const savedRecord = await api.createTestRecord(newRecord);
          setRecords(prev => [savedRecord, ...prev]);
      }
      
      // 3. Navigate to the patient detail view
      setSelectedPatient(targetPatient);
      setActiveTab('patients');

    } catch (e) {
      console.error("Error adding patient/test:", e);
      alert("An error occurred while saving to the database.");
    }
  };

  const handleAddRecord = async (record: TestRecord) => {
    try {
      const savedRecord = await api.createTestRecord(record);
      setRecords(prev => [savedRecord, ...prev]);
    } catch (e) {
      console.error("Error adding record:", e);
      alert("Failed to save test record.");
    }
  };

  const handleViewPatient = (patient: Patient) => {
      setSelectedPatient(patient);
      setActiveTab('patients');
  };

  const renderContent = () => {
    if (activeTab === 'dashboard') {
      return (
        <Dashboard 
          patients={patients} 
          records={records} 
          onViewPatient={handleViewPatient}
          testConfigs={testConfigs}
        />
      );
    }

    if (activeTab === 'patients') {
      if (selectedPatient) {
        return (
          <PatientDetail
            patient={selectedPatient}
            records={records}
            onBack={() => setSelectedPatient(null)}
            onAddRecord={handleAddRecord}
            testConfigs={testConfigs}
          />
        );
      }
      return (
        <PatientList
          patients={patients}
          onSelectPatient={setSelectedPatient}
          onAddPatient={handleAddPatient}
          testConfigs={testConfigs}
        />
      );
    }
    
    if (activeTab === 'settings') {
        return (
            <Settings 
              configs={testConfigs}
              onUpdateConfig={handleUpdateConfig}
              onAddConfig={handleAddConfig}
            />
        )
    }

    return <div>Tab not found</div>;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Connecting to PathoTrack DB...</h2>
        <p className="text-gray-500 mt-2">Initializing secure connection</p>
      </div>
    );
  }

  if (error) {
     return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg border border-red-100 max-w-md w-full text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <Layout activeTab={activeTab} onTabChange={(tab) => { setActiveTab(tab); setSelectedPatient(null); }}>
      {renderContent()}
    </Layout>
  );
}
