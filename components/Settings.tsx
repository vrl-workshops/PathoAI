import React, { useState } from 'react';
import { Save, Plus, AlertTriangle, Trash2, Edit2, X } from 'lucide-react';
import { TestConfig } from '../types';

interface SettingsProps {
  configs: Record<string, TestConfig>;
  onUpdateConfig: (config: TestConfig) => void;
  onAddConfig: (config: TestConfig) => void;
}

export const Settings: React.FC<SettingsProps> = ({ configs, onUpdateConfig, onAddConfig }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  
  // Empty state for new config
  const initialConfigState: TestConfig = {
    id: '',
    name: '',
    unit: '',
    minNormal: 0,
    maxNormal: 0,
    criticalLow: 0,
    criticalHigh: 0,
    deltaPercentThreshold: 20,
    followUpDays: 90
  };

  const [formData, setFormData] = useState<TestConfig>(initialConfigState);

  const handleEdit = (config: TestConfig) => {
    setFormData({ ...config });
    setEditingId(config.id);
    setIsAdding(false);
  };

  const handleAddNew = () => {
    setFormData({ ...initialConfigState, id: `test_${Date.now()}` });
    setEditingId(null);
    setIsAdding(true);
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsAdding(false);
    setFormData(initialConfigState);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAdding) {
      // Ensure ID is uniqueish
      const newConfig = { ...formData, id: formData.name.toUpperCase().replace(/\s+/g, '_') };
      onAddConfig(newConfig);
    } else {
      onUpdateConfig(formData);
    }
    handleCancel();
  };

  const handleChange = (field: keyof TestConfig, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: typeof prev[field] === 'number' ? parseFloat(value.toString()) : value
    }));
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Laboratory Configuration</h2>
          <p className="text-sm text-gray-500">Manage reference ranges, units, and alert rules.</p>
        </div>
        {!isAdding && !editingId && (
          <button 
            onClick={handleAddNew}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium text-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Test
          </button>
        )}
      </div>

      {/* Edit/Add Form */}
      {(isAdding || editingId) && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">
              {isAdding ? 'Add New Test Configuration' : `Edit ${formData.name}`}
            </h3>
            <button onClick={handleCancel} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-blue-600 uppercase tracking-wider">Basic Info</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Test Name</label>
                <input 
                  type="text" required
                  value={formData.name}
                  onChange={e => handleChange('name', e.target.value)}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                <input 
                  type="text" required
                  value={formData.unit}
                  onChange={e => handleChange('unit', e.target.value)}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                  placeholder="e.g. mg/dL, %"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium text-blue-600 uppercase tracking-wider">Reference Ranges</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Normal</label>
                  <input type="number" step="any" required value={formData.minNormal} onChange={e => handleChange('minNormal', e.target.value)} className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Normal</label>
                  <input type="number" step="any" required value={formData.maxNormal} onChange={e => handleChange('maxNormal', e.target.value)} className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Critical Low</label>
                  <input type="number" step="any" value={formData.criticalLow} onChange={e => handleChange('criticalLow', e.target.value)} className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Critical High</label>
                  <input type="number" step="any" value={formData.criticalHigh} onChange={e => handleChange('criticalHigh', e.target.value)} className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border" />
                </div>
              </div>
            </div>

            <div className="space-y-4 md:col-span-2">
              <h4 className="text-sm font-medium text-blue-600 uppercase tracking-wider">Clinical Rules</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delta Check Threshold (%)</label>
                  <input 
                    type="number" step="any" required
                    value={formData.deltaPercentThreshold}
                    onChange={e => handleChange('deltaPercentThreshold', e.target.value)}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                  />
                  <p className="text-xs text-gray-500 mt-1">Change greater than this % is flagged.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Interval (Days)</label>
                  <input 
                    type="number" required
                    value={formData.followUpDays}
                    onChange={e => handleChange('followUpDays', e.target.value)}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                  />
                  <p className="text-xs text-gray-500 mt-1">Days before a repeat test is recommended.</p>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 pt-4 border-t border-gray-100 flex justify-end gap-3">
              <button 
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Configuration
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Existing Configs List */}
      <div className="grid grid-cols-1 gap-4">
        {Object.values(configs).map((config: TestConfig) => (
          <div key={config.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-blue-300 transition-colors">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-gray-900">{config.name}</h3>
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-600">{config.unit}</span>
              </div>
              <div className="mt-2 text-sm text-gray-600 flex flex-wrap gap-x-6 gap-y-1">
                <span><span className="font-medium">Normal:</span> {config.minNormal} - {config.maxNormal}</span>
                {config.criticalHigh && <span><span className="font-medium text-red-600">Critical:</span> &gt;{config.criticalHigh}</span>}
                <span><span className="font-medium text-amber-600">Delta Limit:</span> {config.deltaPercentThreshold}%</span>
                <span><span className="font-medium text-blue-600">Follow-up:</span> {config.followUpDays} days</span>
              </div>
            </div>
            <button 
              onClick={() => handleEdit(config)}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
            >
              <Edit2 className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};