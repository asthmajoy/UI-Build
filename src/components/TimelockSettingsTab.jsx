import React, { useState, useEffect } from 'react';
import { Clock, History, AlertTriangle, Users } from 'lucide-react';
import { ethers } from 'ethers';
import Loader from './Loader';

const TimelockSettingsTab = ({ contracts }) => {
  const [timelockSettings, setTimelockSettings] = useState({
    minDelay: 0,
    maxDelay: 0,
    gracePeriod: 0,
    lowThreatDelay: 0,
    mediumThreatDelay: 0,
    highThreatDelay: 0,
    executorTokenThreshold: '0',
    executorTokenThresholdDecimal: '0'
  });
  
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Define the threat levels based on the contract
  const threatLevels = [
    { id: 0, name: 'Low' },
    { id: 1, name: 'Medium' },
    { id: 2, name: 'High' }
  ];
  
  // Load timelock settings
  useEffect(() => {
    const loadTimelockSettings = async () => {
      if (!contracts.timelock) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        // Get timelock basic configuration
        const minDelay = await contracts.timelock.minDelay();
        const maxDelay = await contracts.timelock.maxDelay();
        const gracePeriod = await contracts.timelock.gracePeriod();
        
        // Get specific threat level delays
        const lowThreatDelay = await contracts.timelock.lowThreatDelay();
        const mediumThreatDelay = await contracts.timelock.mediumThreatDelay();
        const highThreatDelay = await contracts.timelock.highThreatDelay();
        
        // Initialize with basic settings first in case executor threshold fails
        const initialSettings = {
          minDelay: minDelay.toNumber(),
          maxDelay: maxDelay.toNumber(),
          gracePeriod: gracePeriod.toNumber(),
          lowThreatDelay: lowThreatDelay.toNumber(),
          mediumThreatDelay: mediumThreatDelay.toNumber(),
          highThreatDelay: highThreatDelay.toNumber(),
          executorTokenThreshold: '0',
          executorTokenThresholdDecimal: '0'
        };
        
        setTimelockSettings(initialSettings);
        
        // Get executor token threshold
        try {
          const executorTokenThreshold = await contracts.timelock.minExecutorTokenThreshold();
          
          // Store the raw value internally, but convert for display
          setTimelockSettings({
            ...initialSettings,
            executorTokenThreshold: executorTokenThreshold.toString(),
            // Add decimal version for display purposes
            executorTokenThresholdDecimal: (Number(executorTokenThreshold.toString()) / 10**18).toString()
          });
        } catch (thresholdError) {
          console.warn("Could not fetch executor token threshold:", thresholdError);
          // Continue with other settings loaded
        }
      } catch (error) {
        console.error("Error loading timelock settings:", error);
        setErrorMessage("Failed to load timelock settings: " + (error.message || 'Unknown error'));
      } finally {
        setLoading(false);
      }
    };
    
    loadTimelockSettings();
  }, [contracts.timelock]);
  
  // Update timelock delays
  const updateTimelockDelays = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setTxLoading(true);
    
    try {
      // Note: Now only passing 3 parameters instead of 4
      const tx = await contracts.timelock.updateThreatLevelDelays(
        timelockSettings.lowThreatDelay,
        timelockSettings.mediumThreatDelay,
        timelockSettings.highThreatDelay
      );
      
      await tx.wait();
      setSuccessMessage("Successfully updated threat level delays");
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      console.error("Error updating timelock delays:", error);
      setErrorMessage(error.message || 'Failed to update timelock delays');
    } finally {
      setTxLoading(false);
    }
  };
  
  // Update general timelock parameters
  const updateTimelockParams = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setTxLoading(true);
    
    try {
      // Use the updateDelays function to set min/max delay and grace period
      const tx = await contracts.timelock.updateDelays(
        timelockSettings.minDelay,
        timelockSettings.maxDelay,
        timelockSettings.gracePeriod
      );
      
      await tx.wait();
      setSuccessMessage("Successfully updated timelock parameters");
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      console.error("Error updating timelock parameters:", error);
      setErrorMessage(error.message || 'Failed to update timelock parameters');
    } finally {
      setTxLoading(false);
    }
  };
  
  // Update executor token threshold
  const updateExecutorThreshold = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setTxLoading(true);
    
    try {
      // Convert from decimal to raw value (multiply by 10^18)
      const decimalValue = parseFloat(timelockSettings.executorTokenThresholdDecimal);
      if (isNaN(decimalValue)) {
        throw new Error("Please enter a valid decimal number");
      }
      
      // Convert to BigNumber with ethers.js to handle large numbers properly
      const rawValue = ethers.utils.parseEther(decimalValue.toString());
      
      // Call the updateExecutorTokenThreshold function with the raw value
      const tx = await contracts.timelock.updateExecutorTokenThreshold(rawValue);
      
      await tx.wait();
      setSuccessMessage("Successfully updated executor token threshold");
      
      // Update the internal raw value state with the new value
      setTimelockSettings({
        ...timelockSettings,
        executorTokenThreshold: rawValue.toString()
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      console.error("Error updating executor token threshold:", error);
      setErrorMessage(error.message || 'Failed to update executor token threshold');
    } finally {
      setTxLoading(false);
    }
  };
  
  // Format time in seconds to a readable format
  const formatTime = (seconds) => {
    if (seconds < 60) return `${seconds} seconds`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days`;
    return `${Math.floor(seconds / 604800)} weeks`;
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold dark:text-white">Timelock Settings</h2>
        <p className="text-gray-500 dark:text-gray-400">Manage delayed execution settings for governance actions</p>
      </div>
      
      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 dark:bg-red-900 dark:border-red-700 dark:text-red-200 px-4 py-3 rounded mb-4 flex items-start">
          <AlertTriangle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
          <span className="break-words overflow-hidden">
            {errorMessage.includes("user rejected transaction") 
              ? "Transaction was rejected. Please try again." 
              : errorMessage.length > 200 
                ? errorMessage.substring(0, 200) + "..." 
                : errorMessage
            }
          </span>
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 dark:bg-green-900 dark:border-green-700 dark:text-green-200 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}
      
      {loading ? (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <Loader size="large" text="Loading timelock settings..." />
        </div>
      ) : (
        <>
          {/* General Timelock Settings */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6">
            <div className="flex items-center mb-4">
              <Clock className="w-5 h-5 text-indigo-500 mr-2" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">General Timelock Parameters</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Minimum Delay (seconds)</label>
                <input 
                  type="number" 
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white p-2" 
                  value={timelockSettings.minDelay}
                  onChange={(e) => setTimelockSettings({...timelockSettings, minDelay: parseInt(e.target.value)})}
                  min="0"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Current: {formatTime(timelockSettings.minDelay)}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Maximum Delay (seconds)</label>
                <input 
                  type="number" 
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white p-2" 
                  value={timelockSettings.maxDelay}
                  onChange={(e) => setTimelockSettings({...timelockSettings, maxDelay: parseInt(e.target.value)})}
                  min={timelockSettings.minDelay}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Current: {formatTime(timelockSettings.maxDelay)}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Grace Period (seconds)</label>
                <input 
                  type="number" 
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white p-2" 
                  value={timelockSettings.gracePeriod}
                  onChange={(e) => setTimelockSettings({...timelockSettings, gracePeriod: parseInt(e.target.value)})}
                  min="0"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Current: {formatTime(timelockSettings.gracePeriod)}</p>
              </div>
            </div>
            
            <button 
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md disabled:bg-indigo-400"
              onClick={updateTimelockParams}
              disabled={txLoading}
            >
              {txLoading ? 'Updating...' : 'Update Parameters'}
            </button>
          </div>
          
          {/* Executor Token Threshold */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6">
            <div className="flex items-center mb-4">
              <Users className="w-5 h-5 text-indigo-500 mr-2" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Executor Token Threshold</h3>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Set the minimum amount of tokens required for an address to execute timelock transactions.
            </p>
            
            <div className="grid grid-cols-1 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Token Threshold (JST)
                </label>
                <input 
                  type="text" 
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white p-2" 
                  value={timelockSettings.executorTokenThresholdDecimal || '0'}
                  onChange={(e) => setTimelockSettings({
                    ...timelockSettings, 
                    executorTokenThresholdDecimal: e.target.value
                  })}
                  placeholder="0.01"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Current: {timelockSettings.executorTokenThresholdDecimal || '0'} JST
                </p>
              </div>
            </div>
            
            <button 
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md disabled:bg-indigo-400"
              onClick={updateExecutorThreshold}
              disabled={txLoading}
            >
              {txLoading ? 'Updating...' : 'Update Executor Threshold'}
            </button>
          </div>
          
          {/* Threat Level Delays */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6">
            <div className="flex items-center mb-4">
              <History className="w-5 h-5 text-indigo-500 mr-2" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Threat Level Delays</h3>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Different types of transactions require different waiting periods based on their risk level.
              Transactions with higher threat levels require longer delays before execution.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Low Threat Delay (seconds)</label>
                <input 
                  type="number" 
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white p-2" 
                  value={timelockSettings.lowThreatDelay}
                  onChange={(e) => setTimelockSettings({...timelockSettings, lowThreatDelay: parseInt(e.target.value)})}
                  min={timelockSettings.minDelay}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Current: {formatTime(timelockSettings.lowThreatDelay)}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Medium Threat Delay (seconds)</label>
                <input 
                  type="number" 
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white p-2" 
                  value={timelockSettings.mediumThreatDelay}
                  onChange={(e) => setTimelockSettings({...timelockSettings, mediumThreatDelay: parseInt(e.target.value)})}
                  min={timelockSettings.lowThreatDelay}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Current: {formatTime(timelockSettings.mediumThreatDelay)}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">High Threat Delay (seconds)</label>
                <input 
                  type="number" 
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white p-2" 
                  value={timelockSettings.highThreatDelay}
                  onChange={(e) => setTimelockSettings({...timelockSettings, highThreatDelay: parseInt(e.target.value)})}
                  min={timelockSettings.mediumThreatDelay}
                  max={timelockSettings.maxDelay}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Current: {formatTime(timelockSettings.highThreatDelay)}</p>
              </div>
            </div>
            
            <button 
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md disabled:bg-indigo-400"
              onClick={updateTimelockDelays}
              disabled={txLoading}
            >
              {txLoading ? 'Updating...' : 'Update Threat Level Delays'}
            </button>
            
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Note: Delays must maintain the hierarchy: Low ≤ Medium ≤ High.
              All delays must be at least the minimum delay and no more than the maximum delay.
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default TimelockSettingsTab;