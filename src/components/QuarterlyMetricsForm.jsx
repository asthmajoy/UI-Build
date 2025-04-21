// QuarterlyMetricsForm.jsx - Component for updating quarterly metrics

import React, { useState } from 'react';
import { Calendar, Save, AlertTriangle, CheckCircle, X } from 'lucide-react';

// Form for updating quarterly metrics
const QuarterlyMetricsForm = ({ currentMetrics, onUpdate, onCancel }) => {
  const [formData, setFormData] = useState({
    currentQuarter: currentMetrics?.currentQuarter || 'Q1 2025',
    casesResolved: {
      total: currentMetrics?.casesResolved?.total || 0,
      quarterly: {
        q1: currentMetrics?.casesResolved?.quarterly?.q1 || 0,
        q2: currentMetrics?.casesResolved?.quarterly?.q2 || 0,
        q3: currentMetrics?.casesResolved?.quarterly?.q3 || 0,
        q4: currentMetrics?.casesResolved?.quarterly?.q4 || 0
      },
      byType: {
        housing: currentMetrics?.casesResolved?.byType?.housing || 0,
        family: currentMetrics?.casesResolved?.byType?.family || 0,
        immigration: currentMetrics?.casesResolved?.byType?.immigration || 0,
        consumer: currentMetrics?.casesResolved?.byType?.consumer || 0
      }
    },
    fundingAllocated: {
      total: currentMetrics?.fundingAllocated?.total || 0,
      byCategory: {
        legal: currentMetrics?.fundingAllocated?.byCategory?.legal || 0,
        education: currentMetrics?.fundingAllocated?.byCategory?.education || 0,
        advocacy: currentMetrics?.fundingAllocated?.byCategory?.advocacy || 0
      }
    },
    communityGrowth: {
      members: currentMetrics?.communityGrowth?.members || 0,
      growthRate: currentMetrics?.communityGrowth?.growthRate || 0,
      activeParticipation: currentMetrics?.communityGrowth?.activeParticipation || 0
    },
    initiativeDistribution: {
      housing: currentMetrics?.initiativeDistribution?.housing || 0,
      family: currentMetrics?.initiativeDistribution?.family || 0,
      immigration: currentMetrics?.initiativeDistribution?.immigration || 0,
      consumer: currentMetrics?.initiativeDistribution?.consumer || 0
    }
  });

  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  // Handle input changes
  const handleChange = (e, section, subsection, field) => {
    const value = e.target.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
    
    if (!section) {
      setFormData({
        ...formData,
        [field]: value
      });
      return;
    }
    
    if (!subsection) {
      setFormData({
        ...formData,
        [section]: {
          ...formData[section],
          [field]: value
        }
      });
      return;
    }
    
    setFormData({
      ...formData,
      [section]: {
        ...formData[section],
        [subsection]: {
          ...formData[section][subsection],
          [field]: value
        }
      }
    });
  };

  // Validate form data
  const validateForm = () => {
    const newErrors = {};
    
    // Check if case totals match
    const quarterlyTotal = 
      formData.casesResolved.quarterly.q1 + 
      formData.casesResolved.quarterly.q2 + 
      formData.casesResolved.quarterly.q3 + 
      formData.casesResolved.quarterly.q4;
    
    const byTypeTotal = 
      formData.casesResolved.byType.housing + 
      formData.casesResolved.byType.family + 
      formData.casesResolved.byType.immigration + 
      formData.casesResolved.byType.consumer;
    
    if (quarterlyTotal !== formData.casesResolved.total) {
      newErrors.quarterlyTotal = 'Quarterly case totals must equal the total cases resolved';
    }
    
    if (byTypeTotal !== formData.casesResolved.total) {
      newErrors.byTypeTotal = 'Case type totals must equal the total cases resolved';
    }
    
    // Check if initiative distribution adds up to 100%
    const initiativeTotal = 
      formData.initiativeDistribution.housing + 
      formData.initiativeDistribution.family + 
      formData.initiativeDistribution.immigration + 
      formData.initiativeDistribution.consumer;
    
    if (Math.abs(initiativeTotal - 100) > 0.1) {
      newErrors.initiativeTotal = 'Initiative distribution must total 100%';
    }
    
    // Check if funding amounts make sense
    const fundingTotal = 
      formData.fundingAllocated.byCategory.legal + 
      formData.fundingAllocated.byCategory.education + 
      formData.fundingAllocated.byCategory.advocacy;
    
    if (Math.abs(fundingTotal - formData.fundingAllocated.total) > 0.01) {
      newErrors.fundingTotal = 'Funding category totals must equal the total funding allocated';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    
    if (!validateForm()) {
      return;
    }
    
    // Update metrics
    try {
      const result = await onUpdate(formData);
      if (result.success) {
        setSuccessMessage('Metrics updated successfully!');
        setTimeout(() => {
          onCancel();
        }, 2000);
      } else {
        setErrors({ submit: result.message });
      }
    } catch (error) {
      setErrors({ submit: error.message });
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold dark:text-white flex items-center">
          <Calendar className="w-6 h-6 mr-2 text-blue-500" />
          Update Quarterly Metrics
        </h2>
        <button 
          onClick={onCancel} 
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
      
      {successMessage && (
        <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-md mb-4 flex items-center text-green-700 dark:text-green-300">
          <CheckCircle className="w-5 h-5 mr-2" />
          {successMessage}
        </div>
      )}
      
      {errors.submit && (
        <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-md mb-4 flex items-center text-red-700 dark:text-red-300">
          <AlertTriangle className="w-5 h-5 mr-2" />
          {errors.submit}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Quarter Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Current Quarter
            </label>
            <select
              value={formData.currentQuarter}
              onChange={(e) => handleChange(e, null, null, 'currentQuarter')}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="Q1 2025">Q1 2025</option>
              <option value="Q2 2025">Q2 2025</option>
              <option value="Q3 2025">Q3 2025</option>
              <option value="Q4 2025">Q4 2025</option>
            </select>
          </div>
        </div>
        
        {/* Cases Resolved Section */}
        <fieldset className="border border-gray-300 dark:border-gray-700 rounded-md p-4">
          <legend className="text-sm font-medium text-gray-700 dark:text-gray-300 px-2">
            Cases Resolved
          </legend>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Total Cases
              </label>
              <input
                type="number"
                value={formData.casesResolved.total}
                onChange={(e) => handleChange(e, 'casesResolved', null, 'total')}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
            
            {/* Quarterly breakdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Q1
              </label>
              <input
                type="number"
                value={formData.casesResolved.quarterly.q1}
                onChange={(e) => handleChange(e, 'casesResolved', 'quarterly', 'q1')}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Q2
              </label>
              <input
                type="number"
                value={formData.casesResolved.quarterly.q2}
                onChange={(e) => handleChange(e, 'casesResolved', 'quarterly', 'q2')}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Q3
              </label>
              <input
                type="number"
                value={formData.casesResolved.quarterly.q3}
                onChange={(e) => handleChange(e, 'casesResolved', 'quarterly', 'q3')}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Q4
              </label>
              <input
                type="number"
                value={formData.casesResolved.quarterly.q4}
                onChange={(e) => handleChange(e, 'casesResolved', 'quarterly', 'q4')}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
          
          {errors.quarterlyTotal && (
            <div className="text-sm text-red-600 dark:text-red-400 mb-3">
              {errors.quarterlyTotal}
            </div>
          )}
          
          {/* Cases by type */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Housing
              </label>
              <input
                type="number"
                value={formData.casesResolved.byType.housing}
                onChange={(e) => handleChange(e, 'casesResolved', 'byType', 'housing')}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Family
              </label>
              <input
                type="number"
                value={formData.casesResolved.byType.family}
                onChange={(e) => handleChange(e, 'casesResolved', 'byType', 'family')}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Immigration
              </label>
              <input
                type="number"
                value={formData.casesResolved.byType.immigration}
                onChange={(e) => handleChange(e, 'casesResolved', 'byType', 'immigration')}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Consumer
              </label>
              <input
                type="number"
                value={formData.casesResolved.byType.consumer}
                onChange={(e) => handleChange(e, 'casesResolved', 'byType', 'consumer')}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
          
          {errors.byTypeTotal && (
            <div className="text-sm text-red-600 dark:text-red-400 mt-2">
              {errors.byTypeTotal}
            </div>
          )}
        </fieldset>
        
        {/* Funding Allocation Section */}
        <fieldset className="border border-gray-300 dark:border-gray-700 rounded-md p-4">
          <legend className="text-sm font-medium text-gray-700 dark:text-gray-300 px-2">
            Funding Allocation
          </legend>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Total Funding
              </label>
              <input
                type="number"
                value={formData.fundingAllocated.total}
                onChange={(e) => handleChange(e, 'fundingAllocated', null, 'total')}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Legal Services
              </label>
              <input
                type="number"
                value={formData.fundingAllocated.byCategory.legal}
                onChange={(e) => handleChange(e, 'fundingAllocated', 'byCategory', 'legal')}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Education
              </label>
              <input
                type="number"
                value={formData.fundingAllocated.byCategory.education}
                onChange={(e) => handleChange(e, 'fundingAllocated', 'byCategory', 'education')}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Advocacy
              </label>
              <input
                type="number"
                value={formData.fundingAllocated.byCategory.advocacy}
                onChange={(e) => handleChange(e, 'fundingAllocated', 'byCategory', 'advocacy')}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
          
          {errors.fundingTotal && (
            <div className="text-sm text-red-600 dark:text-red-400 mt-2">
              {errors.fundingTotal}
            </div>
          )}
        </fieldset>
        
        {/* Community Growth Section */}
        <fieldset className="border border-gray-300 dark:border-gray-700 rounded-md p-4">
          <legend className="text-sm font-medium text-gray-700 dark:text-gray-300 px-2">
            Community Growth
          </legend>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Total Members
              </label>
              <input
                type="number"
                value={formData.communityGrowth.members}
                onChange={(e) => handleChange(e, 'communityGrowth', null, 'members')}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Growth Rate (%)
              </label>
              <input
                type="number"
                value={formData.communityGrowth.growthRate}
                onChange={(e) => handleChange(e, 'communityGrowth', null, 'growthRate')}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Active Participation (0-1)
              </label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={formData.communityGrowth.activeParticipation}
                onChange={(e) => handleChange(e, 'communityGrowth', null, 'activeParticipation')}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Enter a decimal between 0 and 1 (e.g., 0.42 for 42%)
              </span>
            </div>
          </div>
        </fieldset>
        
        {/* Initiative Distribution Section */}
        <fieldset className="border border-gray-300 dark:border-gray-700 rounded-md p-4">
          <legend className="text-sm font-medium text-gray-700 dark:text-gray-300 px-2">
            Initiative Distribution (%)
          </legend>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Housing
              </label>
              <input
                type="number"
                value={formData.initiativeDistribution.housing}
                onChange={(e) => handleChange(e, 'initiativeDistribution', null, 'housing')}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Family
              </label>
              <input
                type="number"
                value={formData.initiativeDistribution.family}
                onChange={(e) => handleChange(e, 'initiativeDistribution', null, 'family')}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Immigration
              </label>
              <input
                type="number"
                value={formData.initiativeDistribution.immigration}
                onChange={(e) => handleChange(e, 'initiativeDistribution', null, 'immigration')}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Consumer
              </label>
              <input
                type="number"
                value={formData.initiativeDistribution.consumer}
                onChange={(e) => handleChange(e, 'initiativeDistribution', null, 'consumer')}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
          
          {errors.initiativeTotal && (
            <div className="text-sm text-red-600 dark:text-red-400 mt-2">
              {errors.initiativeTotal}
            </div>
          )}
          
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Note: These percentages should total 100%
          </div>
        </fieldset>
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Metrics
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuarterlyMetricsForm;