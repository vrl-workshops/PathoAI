import React, { useState, useMemo } from 'react';
import { ArrowLeft, Plus, AlertCircle, AlertTriangle, CheckCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Patient, TestRecord, TestConfig, TestType } from '../types';
import { getOutlierStatus, getPreviousTest, calculateDelta } from '../utils/clinicalLogic';
import { analyzeTestResult } from '../services/geminiService';

interface PatientDetailProps {
  patient: Patient;
  records: TestRecord[];
  testConfigs: Record<string, TestConfig>;
  onBack: () => void;
  onAddRecord: (record: TestRecord) => void;
}

export const PatientDetail: React.FC<PatientDetailProps> = ({ patient, records, testConfigs, onBack, onAddRecord }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedTestType, setSelectedTestType] = useState<string>(Object.keys(testConfigs)[0] || '');
  const [testValue, setTestValue] = useState<string>('');
  const [testDate, setTestDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const patientRecords = useMemo(() => {
    return records
      .filter(r => r.patientId === patient.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [records, patient.id]);

  const recordsByTestType = useMemo(() => {
    const grouped: Record<string, TestRecord[]> = {};
    patientRecords.forEach(r => {
      if (!grouped[r.testTypeId]) grouped[r.testTypeId] = [];
      grouped[r.testTypeId].push(r);
    });
    // Sort ascending for charts
    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });
    return grouped;
  }, [patientRecords]);

  const handleSave = async () => {
    if (!testValue || !testDate || !selectedTestType) return;

    const val = parseFloat(testValue);
    const config = testConfigs[selectedTestType];
    
    // Prepare temporary record for analysis
    const newRecord: TestRecord = {
      id: Date.now().toString(),
      patientId: patient.id,
      testTypeId: selectedTestType,
      value: val,
      date: new Date(testDate).toISOString(),
    };

    const previousRecord = getPreviousTest(records, patient.id, selectedTestType);

    setIsAnalyzing(true);
    let aiResult = null;
    
    try {
        aiResult = await analyzeTestResult(patient, newRecord, previousRecord, config);
    } catch(e) {
        console.error("AI failed", e);
    } finally {
        setIsAnalyzing(false);
    }

    if (aiResult) {
        newRecord.aiAnalysis = aiResult;
        setAnalysisResult(aiResult);
    }

    onAddRecord(newRecord);
    
    // Reset form if no AI result to show (if AI fails, we just add it)
    if (!aiResult) {
        setShowAddForm(false);
        setTestValue('');
    }
  };

  const closeAnalysis = () => {
    setAnalysisResult(null);
    setShowAddForm(false);
    setTestValue('');
  };

  return (
    <div className="space-y-6">
      <button 
        onClick={onBack}
        className="flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Registry
      </button>

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{patient.name}</h1>
          <div className="mt-1 flex flex-wrap gap-3 text-sm text-gray-500">
            <span className="flex items-center"><span className="font-medium mr-1">ID:</span> {patient.phone}</span>
            <span className="w-1 h-1 bg-gray-300 rounded-full self-center"></span>
            <span>{patient.age} years</span>
            <span className="w-1 h-1 bg-gray-300 rounded-full self-center"></span>
            <span>{patient.gender}</span>
          </div>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium text-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Test Entry
        </button>
      </div>

      {/* Analysis Modal */}
      {(showAddForm || analysisResult) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900 bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">
                {analysisResult ? 'Clinical Analysis' : 'Add New Test Result'}
              </h3>
              {!analysisResult && (
                <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              )}
            </div>
            
            <div className="p-6 overflow-y-auto">
              {!analysisResult ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Test Type</label>
                    <select 
                      value={selectedTestType}
                      onChange={(e) => setSelectedTestType(e.target.value)}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                    >
                      {Object.values(testConfigs).map((config: TestConfig) => (
                        <option key={config.id} value={config.id}>{config.name} ({config.unit})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Result Value</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={testValue}
                      onChange={(e) => setTestValue(e.target.value)}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                      placeholder="Enter numeric value"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input 
                      type="date" 
                      value={testDate}
                      onChange={(e) => setTestDate(e.target.value)}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg border ${
                    analysisResult.deltaCheckResult === 'Outlier' ? 'bg-red-50 border-red-200' :
                    analysisResult.deltaCheckResult === 'Significant Change' ? 'bg-amber-50 border-amber-200' :
                    'bg-green-50 border-green-200'
                  }`}>
                    <div className="flex items-start">
                      {analysisResult.deltaCheckResult === 'Outlier' ? <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3" /> :
                       analysisResult.deltaCheckResult === 'Significant Change' ? <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 mr-3" /> :
                       <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3" />}
                      <div>
                        <h4 className={`text-sm font-bold ${
                           analysisResult.deltaCheckResult === 'Outlier' ? 'text-red-800' :
                           analysisResult.deltaCheckResult === 'Significant Change' ? 'text-amber-800' :
                           'text-green-800'
                        }`}>
                          {analysisResult.deltaCheckResult}
                        </h4>
                        <p className="text-sm mt-1 text-gray-700">{analysisResult.clinicalReasoning}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Internal Note (Pathologist)</h4>
                    <p className="text-sm text-gray-800 italic">"{analysisResult.pathologistNote}"</p>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                     <h4 className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-2">Patient Notification Draft</h4>
                     <p className="text-sm text-blue-900">"{analysisResult.patientNotification}"</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              {!analysisResult ? (
                 <>
                  <button 
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={isAnalyzing || !testValue}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center"
                  >
                    {isAnalyzing ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Analyzing...
                      </>
                    ) : 'Save & Analyze'}
                  </button>
                 </>
              ) : (
                <button 
                  onClick={closeAnalysis}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
                >
                  Confirm & Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Charts & History Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">Recent Test History</h3>
            </div>
            <ul className="divide-y divide-gray-100">
              {patientRecords.length === 0 ? (
                <li className="p-6 text-center text-gray-500 text-sm">No test records found.</li>
              ) : (
                patientRecords.map((record) => {
                  const config = testConfigs[record.testTypeId];
                  // Safe check if config was deleted but record exists
                  if (!config) return null;

                  const status = getOutlierStatus(record.value, config);
                  
                  return (
                    <li key={record.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                             <span className="font-medium text-gray-900">{config.name}</span>
                             {status === 'Critical' && <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700">CRITICAL</span>}
                             {status === 'Abnormal' && <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-700">ABNORMAL</span>}
                          </div>
                          <div className="mt-1 text-sm text-gray-500">
                            {new Date(record.date).toLocaleDateString()}
                          </div>
                          {record.aiAnalysis && (
                             <div className="mt-2 text-xs text-gray-600 bg-blue-50 p-2 rounded border border-blue-100">
                                <span className="font-semibold text-blue-700">AI Note:</span> {record.aiAnalysis.pathologistNote}
                             </div>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-gray-900">{record.value}</span>
                          <span className="text-sm text-gray-500 ml-1">{config.unit}</span>
                          <div className="text-xs text-gray-400 mt-1">
                             Ref: {config.minNormal}-{config.maxNormal}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        </div>

        {/* Right Column: Trend Charts */}
        <div className="space-y-6">
           {Object.keys(recordsByTestType).map(testTypeId => {
             const config = testConfigs[testTypeId];
             if (!config) return null;

             const data = recordsByTestType[testTypeId].map(r => ({
               date: new Date(r.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
               value: r.value
             }));
             
             // Only show chart if more than 1 point
             if (data.length < 2) return null;

             const latest = data[data.length - 1].value;
             const previous = data[data.length - 2].value;
             const delta = calculateDelta(latest, previous);
             const isRising = delta > 0;

             return (
               <div key={testTypeId} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                 <div className="flex justify-between items-center mb-4">
                    <h4 className="font-semibold text-gray-800">{config.name} Trend</h4>
                    <div className={`flex items-center text-xs font-bold ${isRising ? 'text-red-500' : 'text-green-500'}`}>
                      {isRising ? <TrendingUp className="w-3 h-3 mr-1"/> : <TrendingDown className="w-3 h-3 mr-1"/>}
                      {Math.abs(delta).toFixed(1)}%
                    </div>
                 </div>
                 <div className="h-40 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="date" tick={{fontSize: 10}} stroke="#9ca3af" />
                        <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                        <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} 
                            labelStyle={{ color: '#6b7280', fontSize: '12px' }}
                        />
                        <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={{r: 3, fill: '#3b82f6'}} activeDot={{r: 5}} />
                      </LineChart>
                    </ResponsiveContainer>
                 </div>
               </div>
             );
           })}
        </div>
      </div>
    </div>
  );
};