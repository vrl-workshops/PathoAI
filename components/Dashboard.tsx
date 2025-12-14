import React, { useMemo } from 'react';
import { AlertCircle, Calendar, Clock, ArrowRight } from 'lucide-react';
import { Patient, TestRecord, TestConfig, TestType } from '../types';
import { checkFollowUpNeeded } from '../utils/clinicalLogic';

interface DashboardProps {
  patients: Patient[];
  records: TestRecord[];
  testConfigs: Record<string, TestConfig>;
  onViewPatient: (patient: Patient) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ patients, records, testConfigs, onViewPatient }) => {
  
  const stats = useMemo(() => {
    const totalPatients = patients.length;
    const totalTests = records.length;
    const criticals = records.filter(r => {
        const config = testConfigs[r.testTypeId];
        if (!config) return false;
        return (config.criticalHigh && r.value >= config.criticalHigh) || (config.criticalLow && r.value <= config.criticalLow);
    }).length;
    return { totalPatients, totalTests, criticals };
  }, [patients, records, testConfigs]);

  const followUpAlerts = useMemo(() => {
    const alerts: { patient: Patient, testType: string, daysOverdue: number }[] = [];
    
    patients.forEach(patient => {
      // Iterate through all configured tests to find follow-ups
      Object.values(testConfigs).forEach((config: TestConfig) => {
        const testRecords = records.filter(r => r.patientId === patient.id && r.testTypeId === config.id);
        
        if (testRecords.length > 0) {
          // Sort descending
          testRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          const lastTest = testRecords[0];
          const lastDate = new Date(lastTest.date);
          const now = new Date();
          const diffTime = now.getTime() - lastDate.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays > config.followUpDays) {
            alerts.push({
              patient,
              testType: config.name,
              daysOverdue: diffDays - config.followUpDays
            });
          }
        }
      });
    });
    return alerts;
  }, [patients, records, testConfigs]);

  const recentCriticals = useMemo(() => {
      const crits = records.filter(r => {
        const config = testConfigs[r.testTypeId];
        if (!config) return false;
        return (config.criticalHigh && r.value >= config.criticalHigh) || (config.criticalLow && r.value <= config.criticalLow);
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5); // top 5

      return crits.map(r => {
          const patient = patients.find(p => p.id === r.patientId);
          return { record: r, patient };
      });
  }, [records, patients, testConfigs]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Overview of lab activities and pending alerts</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
           <div className="text-sm font-medium text-gray-500 mb-1">Total Patients</div>
           <div className="text-3xl font-bold text-gray-900">{stats.totalPatients}</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
           <div className="text-sm font-medium text-gray-500 mb-1">Total Tests Conducted</div>
           <div className="text-3xl font-bold text-blue-600">{stats.totalTests}</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
           <div className="text-sm font-medium text-gray-500 mb-1">Critical Findings (All Time)</div>
           <div className="text-3xl font-bold text-red-600">{stats.criticals}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Follow-up Reminders */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-amber-50 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-amber-900 flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    Overdue Follow-ups
                </h3>
                <span className="text-xs font-bold bg-amber-200 text-amber-800 px-2 py-1 rounded-full">{followUpAlerts.length}</span>
            </div>
            <div className="p-0">
                {followUpAlerts.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <CheckCircle className="w-12 h-12 mx-auto text-green-200 mb-2" />
                        <p>No overdue follow-ups.</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-100">
                        {followUpAlerts.map((alert, idx) => (
                            <li key={idx} className="px-6 py-4 hover:bg-gray-50 transition-colors flex justify-between items-center group cursor-pointer" onClick={() => onViewPatient(alert.patient)}>
                                <div>
                                    <div className="font-medium text-gray-900">{alert.patient.name}</div>
                                    <div className="text-sm text-gray-500">{alert.testType} check overdue by <span className="font-semibold text-amber-600">{alert.daysOverdue} days</span></div>
                                </div>
                                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500" />
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>

        {/* Critical Alerts */}
         <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-red-50 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-red-900 flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    Recent Critical Results
                </h3>
            </div>
            <div className="p-0">
                {recentCriticals.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <p>No critical results recently.</p>
                    </div>
                ) : (
                     <ul className="divide-y divide-gray-100">
                        {recentCriticals.map((item, idx) => {
                            if (!item.patient) return null;
                            const config = testConfigs[item.record.testTypeId];
                            if (!config) return null;
                            
                            return (
                                <li key={idx} className="px-6 py-4 hover:bg-gray-50 transition-colors flex justify-between items-center group cursor-pointer" onClick={() => onViewPatient(item.patient!)}>
                                    <div>
                                        <div className="font-medium text-gray-900">{item.patient.name}</div>
                                        <div className="text-sm text-gray-500">
                                            {config.name}: <span className="font-bold text-red-600">{item.record.value} {config.unit}</span>
                                        </div>
                                        <div className="text-xs text-gray-400">{new Date(item.record.date).toLocaleDateString()}</div>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500" />
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

// Simple icon for placeholder
const CheckCircle = ({ className }: {className?: string}) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);