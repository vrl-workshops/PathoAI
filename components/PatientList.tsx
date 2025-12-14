import React, { useState } from 'react';
import { Search, Plus, User, Phone, ChevronRight, X, FlaskConical } from 'lucide-react';
import { Patient, TestConfig } from '../types';

interface PatientListProps {
  patients: Patient[];
  testConfigs: Record<string, TestConfig>;
  onSelectPatient: (patient: Patient) => void;
  onAddPatient: (
    patientData: Omit<Patient, 'id' | 'createdAt'>,
    initialTest?: { testTypeId: string; value: number; date: string }
  ) => void;
}

export const PatientList: React.FC<PatientListProps> = ({ patients, testConfigs, onSelectPatient, onAddPatient }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    age: '',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
  });
  
  const [addInitialTest, setAddInitialTest] = useState(false);
  const [testData, setTestData] = useState({
    testTypeId: '',
    value: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Initialize test type selection if empty when modal opens
  React.useEffect(() => {
    if (!testData.testTypeId && Object.keys(testConfigs).length > 0) {
      setTestData(prev => ({...prev, testTypeId: Object.keys(testConfigs)[0]}));
    }
  }, [testConfigs, testData.testTypeId]);

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.phone.includes(searchTerm)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const patientPayload = {
      name: formData.name,
      phone: formData.phone,
      age: parseInt(formData.age),
      gender: formData.gender
    };

    let testPayload = undefined;
    if (addInitialTest && testData.value && testData.testTypeId) {
      testPayload = {
        testTypeId: testData.testTypeId,
        value: parseFloat(testData.value),
        date: new Date(testData.date).toISOString()
      };
    }

    onAddPatient(patientPayload, testPayload);
    setIsModalOpen(false);
    
    // Reset form
    setFormData({ name: '', phone: '', age: '', gender: 'Male' });
    setAddInitialTest(false);
    setTestData({
      testTypeId: Object.keys(testConfigs)[0] || '',
      value: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Patient Registry</h2>
          <p className="text-sm text-gray-500">Manage patient records and test history</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Patient
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm shadow-sm"
          placeholder="Search by name or phone number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        <ul className="divide-y divide-gray-200">
          {filteredPatients.length === 0 ? (
            <li className="px-6 py-12 text-center">
              <User className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No patients found</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new patient record.</p>
            </li>
          ) : (
            filteredPatients.map((patient) => (
              <li 
                key={patient.id} 
                className="hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => onSelectPatient(patient)}
              >
                <div className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center min-w-0">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="font-semibold text-blue-600 text-sm">
                        {patient.name.charAt(0)}
                      </span>
                    </div>
                    <div className="ml-4 truncate">
                      <p className="text-sm font-medium text-gray-900 truncate">{patient.name}</p>
                      <div className="flex items-center text-sm text-gray-500">
                        <Phone className="flex-shrink-0 mr-1.5 h-3.5 w-3.5 text-gray-400" />
                        {patient.phone}
                        <span className="mx-2 text-gray-300">|</span>
                        <span>{patient.age} yrs</span>
                        <span className="mx-2 text-gray-300">|</span>
                        <span>{patient.gender}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      {/* Add Patient Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900 bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">Register New Patient</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
              {/* Patient Details Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Patient Details
                </h4>
                <div className="bg-blue-50 border border-blue-100 rounded-md p-3 mb-4">
                    <p className="text-xs text-blue-700">
                        Note: If a patient with the same Name and Phone exists, the new test will be automatically appended to their record.
                    </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                    placeholder="e.g. John Doe"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                   <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                    <input 
                      type="number" 
                      required
                      min="0"
                      max="120"
                      value={formData.age}
                      onChange={(e) => setFormData({...formData, age: e.target.value})}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                      placeholder="Years"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                    <select 
                      value={formData.gender}
                      onChange={(e) => setFormData({...formData, gender: e.target.value as any})}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input 
                    type="tel" 
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                    placeholder="e.g. 555-0123"
                  />
                </div>
              </div>

              {/* Initial Test Section */}
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center mb-4">
                  <input
                    id="add-test"
                    type="checkbox"
                    checked={addInitialTest}
                    onChange={(e) => setAddInitialTest(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="add-test" className="ml-2 block text-sm text-gray-900">
                    Add initial test result now
                  </label>
                </div>

                {addInitialTest && (
                  <div className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-200 animate-in fade-in slide-in-from-top-2 duration-200">
                    <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider flex items-center">
                      <FlaskConical className="w-4 h-4 mr-2" />
                      Test Details
                    </h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Test Type</label>
                      <select 
                        value={testData.testTypeId}
                        onChange={(e) => setTestData({...testData, testTypeId: e.target.value})}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                      >
                         {Object.values(testConfigs).map((config: TestConfig) => (
                          <option key={config.id} value={config.id}>{config.name} ({config.unit})</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                        <input 
                          type="number" 
                          step="0.01"
                          required={addInitialTest}
                          value={testData.value}
                          onChange={(e) => setTestData({...testData, value: e.target.value})}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                          placeholder="Result"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                        <input 
                          type="date" 
                          required={addInitialTest}
                          value={testData.date}
                          onChange={(e) => setTestData({...testData, date: e.target.value})}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
                >
                  Register Patient {addInitialTest ? '& Add Test' : ''}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};