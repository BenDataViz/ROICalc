import React, { useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer } from 'recharts';

const ROIVisualization = () => {
  // Initial data values
  const [values, setValues] = useState({
    rampTime: 500000,
    winRate: 350000,
    dealSize: 200000,
    productivity: 750000,
    turnover: 150000,
    managerEfficiency: 100000,
    implementationCost: 400000
  });

  // Calculate totals
  const totalValue = values.rampTime + values.winRate + values.dealSize + 
                    values.productivity + values.turnover + values.managerEfficiency;
  const netROI = totalValue - values.implementationCost;
  const roiPercentage = ((netROI / values.implementationCost) * 100).toFixed(1);

  // Create timeline data - monthly breakdown over 24 months
  const createTimelineData = () => {
    const data = [];
    
    // Distribution weights (when benefits materialize)
    // Earlier benefits: productivity, manager efficiency
    // Later benefits: deal size, win rate improvements
    const distributionWeights = {
      rampTime:          [0, 0, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05],
      winRate:           [0, 0, 0, 0, 0.02, 0.03, 0.04, 0.05, 0.05, 0.06, 0.06, 0.06, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07],
      dealSize:          [0, 0, 0, 0, 0, 0.02, 0.03, 0.04, 0.05, 0.05, 0.06, 0.06, 0.06, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07],
      productivity:      [0, 0.05, 0.06, 0.06, 0.06, 0.06, 0.06, 0.06, 0.05, 0.05, 0.05, 0.05, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04],
      turnover:          [0, 0, 0, 0.02, 0.03, 0.03, 0.04, 0.04, 0.05, 0.05, 0.05, 0.05, 0.06, 0.06, 0.06, 0.06, 0.06, 0.06, 0.06, 0.06, 0.06, 0.06, 0.06, 0.06],
      managerEfficiency: [0.05, 0.06, 0.06, 0.06, 0.06, 0.05, 0.05, 0.05, 0.05, 0.05, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04]
    };
    
    let cumulativeROI = -values.implementationCost;
    
    for (let month = 0; month < 24; month++) {
      const monthData = {
        month: month,
        rampTimeValue: values.rampTime * distributionWeights.rampTime[month],
        winRateValue: values.winRate * distributionWeights.winRate[month],
        dealSizeValue: values.dealSize * distributionWeights.dealSize[month],
        productivityValue: values.productivity * distributionWeights.productivity[month],
        turnoverValue: values.turnover * distributionWeights.turnover[month],
        managerEfficiencyValue: values.managerEfficiency * distributionWeights.managerEfficiency[month],
      };
      
      // Calculate month's total value
      const monthValue = monthData.rampTimeValue + monthData.winRateValue + 
                       monthData.dealSizeValue + monthData.productivityValue + 
                       monthData.turnoverValue + monthData.managerEfficiencyValue;
      
      // Update cumulative ROI
      cumulativeROI += monthValue;
      monthData.cumulativeROI = cumulativeROI;
      monthData.monthlyValue = monthValue;
      
      // Add implementation cost to first month for waterfall
      if (month === 0) {
        monthData.implementationCost = -values.implementationCost;
      }
      
      data.push(monthData);
    }
    
    return data;
  };
  
  const timelineData = createTimelineData();
  
  // Find breakeven point
  const breakevenMonth = timelineData.findIndex(item => item.cumulativeROI >= 0);
  
  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Handle slider input changes
  const handleInputChange = (e, field) => {
    setValues({
      ...values,
      [field]: parseInt(e.target.value)
    });
  };

  return (
    <div className="p-4 border rounded-lg bg-white shadow-md w-full">
      <h2 className="text-xl font-bold mb-4">AI Roleplay ROI Visualization</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <h3 className="font-semibold mb-2">Value Drivers (Annual)</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Rep Productivity: {formatCurrency(values.productivity)}</label>
              <input type="range" min="0" max="1500000" step="50000" value={values.productivity} 
                    onChange={(e) => handleInputChange(e, 'productivity')} 
                    className="w-full" />
            </div>
            <div>
              <label className="block text-sm mb-1">Ramp Time Acceleration: {formatCurrency(values.rampTime)}</label>
              <input type="range" min="0" max="1000000" step="50000" value={values.rampTime} 
                    onChange={(e) => handleInputChange(e, 'rampTime')} 
                    className="w-full" />
            </div>
            <div>
              <label className="block text-sm mb-1">Win Rate Improvement: {formatCurrency(values.winRate)}</label>
              <input type="range" min="0" max="1000000" step="50000" value={values.winRate} 
                    onChange={(e) => handleInputChange(e, 'winRate')} 
                    className="w-full" />
            </div>
            <div>
              <label className="block text-sm mb-1">Deal Size Growth: {formatCurrency(values.dealSize)}</label>
              <input type="range" min="0" max="1000000" step="50000" value={values.dealSize} 
                    onChange={(e) => handleInputChange(e, 'dealSize')} 
                    className="w-full" />
            </div>
            <div>
              <label className="block text-sm mb-1">Reduced Turnover: {formatCurrency(values.turnover)}</label>
              <input type="range" min="0" max="500000" step="25000" value={values.turnover} 
                    onChange={(e) => handleInputChange(e, 'turnover')} 
                    className="w-full" />
            </div>
            <div>
              <label className="block text-sm mb-1">Manager Efficiency: {formatCurrency(values.managerEfficiency)}</label>
              <input type="range" min="0" max="500000" step="25000" value={values.managerEfficiency} 
                    onChange={(e) => handleInputChange(e, 'managerEfficiency')} 
                    className="w-full" />
            </div>
            <div>
              <label className="block text-sm mb-1">Implementation Cost: {formatCurrency(values.implementationCost)}</label>
              <input type="range" min="50000" max="1000000" step="50000" value={values.implementationCost} 
                    onChange={(e) => handleInputChange(e, 'implementationCost')} 
                    className="w-full" />
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-4">ROI Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-3 rounded">
              <p className="text-sm text-blue-700">Total Annual Value</p>
              <p className="text-xl font-bold text-blue-700">{formatCurrency(totalValue)}</p>
            </div>
            <div className="bg-green-50 p-3 rounded">
              <p className="text-sm text-green-700">Net ROI (2 Years)</p>
              <p className="text-xl font-bold text-green-700">{formatCurrency(timelineData[23].cumulativeROI)}</p>
            </div>
            <div className="bg-purple-50 p-3 rounded">
              <p className="text-sm text-purple-700">ROI Percentage</p>
              <p className="text-xl font-bold text-purple-700">{roiPercentage}%</p>
            </div>
            <div className="bg-amber-50 p-3 rounded">
              <p className="text-sm text-amber-700">Breakeven Point</p>
              <p className="text-xl font-bold text-amber-700">
                {breakevenMonth >= 0 ? `Month ${breakevenMonth}` : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mb-8">
        <h3 className="font-semibold mb-4">Cumulative ROI Timeline</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timelineData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" label={{ value: 'Month', position: 'insideBottomRight', offset: -5 }} />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <ReferenceLine y={0} stroke="red" strokeDasharray="3 3" />
              {breakevenMonth >= 0 && (
                <ReferenceLine x={breakevenMonth} stroke="green" strokeDasharray="3 3" label="Breakeven" />
              )}
              <Line type="monotone" dataKey="cumulativeROI" name="Cumulative ROI" stroke="#2563eb" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div>
        <h3 className="font-semibold mb-4">Monthly Value by Driver</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={timelineData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="productivityValue" stackId="a" name="Productivity" fill="#3b82f6" />
              <Bar dataKey="rampTimeValue" stackId="a" name="Ramp Time" fill="#10b981" />
              <Bar dataKey="winRateValue" stackId="a" name="Win Rate" fill="#f59e0b" />
              <Bar dataKey="dealSizeValue" stackId="a" name="Deal Size" fill="#8b5cf6" />
              <Bar dataKey="turnoverValue" stackId="a" name="Reduced Turnover" fill="#ec4899" />
              <Bar dataKey="managerEfficiencyValue" stackId="a" name="Manager Efficiency" fill="#6366f1" />
              {timelineData[0] && (
                <Bar dataKey="implementationCost" name="Implementation Cost" fill="#ef4444" />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="mt-4 text-sm text-gray-500">
        <p>* Adjust sliders to model different ROI scenarios based on your organization's metrics</p>
        <p>* Timeline shows when different value drivers materialize over a 24-month period</p>
      </div>
    </div>
  );
};

export default ROIVisualization;
