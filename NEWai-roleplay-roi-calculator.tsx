import React, { useState } from 'react';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer } from 'recharts';

const ROICalculator = () => {
  // Initial data values
  const [values, setValues] = useState({
    // Value drivers (annual)
    rampTime: 500000,
    winRate: 350000,
    productivity: 750000,
    managerEfficiency: 100000,
    
    // Implementation cost
    implementationCost: 400000,
    
    // Assumption values
    numReps: 50,
    avgRampMonths: 6,
    rampTimeReduction: 30,
    avgDealCycle: 90,
    dealCycleReduction: 20,
    currentWinRate: 25,
    winRateImprovement: 5,
    repProductivityHours: 10,
    managerCoachingHours: 5
  });

  // Calculate totals - excluding deal size and turnover
  const totalValue = values.rampTime + values.winRate + values.productivity + values.managerEfficiency;
  const netROI = totalValue - values.implementationCost;
  const roiPercentage = ((netROI / values.implementationCost) * 100).toFixed(1);

  // Create timeline data - monthly breakdown over 24 months
  const createTimelineData = () => {
    const data = [];
    
    // Distribution weights (when benefits materialize)
    // Earlier benefits: productivity, manager efficiency
    // Later benefits: win rate improvements
    const distributionWeights = {
      rampTime:          [0, 0, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05],
      winRate:           [0, 0, 0, 0, 0.02, 0.03, 0.04, 0.05, 0.05, 0.06, 0.06, 0.06, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07],
      productivity:      [0, 0.05, 0.06, 0.06, 0.06, 0.06, 0.06, 0.06, 0.05, 0.05, 0.05, 0.05, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04],
      managerEfficiency: [0.05, 0.06, 0.06, 0.06, 0.06, 0.05, 0.05, 0.05, 0.05, 0.05, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04]
    };
    
    let cumulativeROI = -values.implementationCost;
    
    for (let month = 0; month < 24; month++) {
      const monthData = {
        month: month,
        rampTimeValue: values.rampTime * distributionWeights.rampTime[month],
        winRateValue: values.winRate * distributionWeights.winRate[month],
        productivityValue: values.productivity * distributionWeights.productivity[month],
        managerEfficiencyValue: values.managerEfficiency * distributionWeights.managerEfficiency[month],
      };
      
      // Calculate month's total value
      const monthValue = monthData.rampTimeValue + monthData.winRateValue + 
                       monthData.productivityValue + monthData.managerEfficiencyValue;
      
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
  
  // Create pie chart data for value drivers
  const pieChartData = [
    { name: 'Rep Productivity', value: values.productivity },
    { name: 'Ramp Time Acceleration', value: values.rampTime },
    { name: 'Win Rate Improvement', value: values.winRate },
    { name: 'Manager Efficiency', value: values.managerEfficiency }
  ];
  
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#6366f1'];
  
  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Handle slider input changes for value drivers and implementation cost
  const handleInputChange = (e, field) => {
    setValues({
      ...values,
      [field]: parseInt(e.target.value)
    });
  };

  // Handle assumption changes
  const handleAssumptionChange = (e, field) => {
    const newValues = { ...values };
    newValues[field] = parseInt(e.target.value);
    
    // Recalculate derived values based on assumptions
    if (['numReps', 'avgRampMonths', 'rampTimeReduction'].includes(field)) {
      // Ramp Time Value = Number of Reps × Current Ramp Time in Months × % Reduction × Average Rep Monthly Cost
      const avgRepMonthlyCost = 8000; // Assumption: $8,000 monthly cost per rep
      newValues.rampTime = Math.round((newValues.numReps * newValues.avgRampMonths * (newValues.rampTimeReduction / 100) * avgRepMonthlyCost) / 12) * 12;
    }
    
    if (['avgDealCycle', 'dealCycleReduction', 'currentWinRate', 'winRateImprovement'].includes(field)) {
      // Win Rate Value = Revenue Impact of Closing Deals Faster and Winning More
      const avgDealSize = 20000; // Assumption: $20,000 average deal size
      const dealsPerRep = 24; // Assumption: 24 deals per rep annually
      const cycleImpact = newValues.dealCycleReduction / 100;
      const winRateImpact = newValues.winRateImprovement / newValues.currentWinRate;
      newValues.winRate = Math.round((newValues.numReps * dealsPerRep * avgDealSize * (cycleImpact + winRateImpact) * 0.3) / 10000) * 10000;
    }
    
    if (['repProductivityHours'].includes(field)) {
      // Productivity Value = Weekly Hours Saved × 48 Weeks × Hourly Cost × Number of Reps
      const hourlyRate = 60; // Assumption: $60 per hour
      newValues.productivity = Math.round((newValues.repProductivityHours * 48 * hourlyRate * newValues.numReps) / 10000) * 10000;
    }
    
    if (['managerCoachingHours'].includes(field)) {
      // Manager Efficiency = Weekly Hours Saved × 48 Weeks × Hourly Cost × Number of Managers
      const hourlyManagerRate = 100; // Assumption: $100 per hour
      const numManagers = Math.ceil(newValues.numReps / 8); // Assume 1 manager per 8 reps
      newValues.managerEfficiency = Math.round((newValues.managerCoachingHours * 48 * hourlyManagerRate * numManagers) / 5000) * 5000;
    }
    
    setValues(newValues);
  };

  return (
    <div className="p-4 border rounded-lg bg-white shadow-md w-full">
      <h2 className="text-xl font-bold mb-4">AI Roleplay ROI Calculator</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <h3 className="font-semibold mb-2">Key Assumptions</h3>
          <div className="space-y-4">
            <div className="p-2 bg-gray-50 rounded">
              <h4 className="font-medium text-sm mb-2">Team Size & Structure</h4>
              <div>
                <label className="block text-sm mb-1">Number of Sales Reps: {values.numReps}</label>
                <input type="range" min="10" max="200" step="5" value={values.numReps} 
                       onChange={(e) => handleAssumptionChange(e, 'numReps')} 
                       className="w-full" />
              </div>
            </div>
            
            <div className="p-2 bg-gray-50 rounded">
              <h4 className="font-medium text-sm mb-2">Ramp Time Impact</h4>
              <div>
                <label className="block text-sm mb-1">Current Avg Ramp Time (months): {values.avgRampMonths}</label>
                <input type="range" min="2" max="12" step="1" value={values.avgRampMonths} 
                       onChange={(e) => handleAssumptionChange(e, 'avgRampMonths')} 
                       className="w-full" />
              </div>
              <div>
                <label className="block text-sm mb-1">Expected Ramp Time Reduction (%): {values.rampTimeReduction}%</label>
                <input type="range" min="5" max="50" step="5" value={values.rampTimeReduction} 
                       onChange={(e) => handleAssumptionChange(e, 'rampTimeReduction')} 
                       className="w-full" />
              </div>
            </div>
            
            <div className="p-2 bg-gray-50 rounded">
              <h4 className="font-medium text-sm mb-2">Sales Performance Impact</h4>
              <div>
                <label className="block text-sm mb-1">Current Avg Deal Cycle (days): {values.avgDealCycle}</label>
                <input type="range" min="30" max="180" step="5" value={values.avgDealCycle} 
                       onChange={(e) => handleAssumptionChange(e, 'avgDealCycle')} 
                       className="w-full" />
              </div>
              <div>
                <label className="block text-sm mb-1">Deal Cycle Reduction (%): {values.dealCycleReduction}%</label>
                <input type="range" min="5" max="40" step="5" value={values.dealCycleReduction} 
                       onChange={(e) => handleAssumptionChange(e, 'dealCycleReduction')} 
                       className="w-full" />
              </div>
              <div>
                <label className="block text-sm mb-1">Current Win Rate (%): {values.currentWinRate}%</label>
                <input type="range" min="10" max="50" step="1" value={values.currentWinRate} 
                       onChange={(e) => handleAssumptionChange(e, 'currentWinRate')} 
                       className="w-full" />
              </div>
              <div>
                <label className="block text-sm mb-1">Win Rate Improvement (percentage points): {values.winRateImprovement}</label>
                <input type="range" min="1" max="15" step="1" value={values.winRateImprovement} 
                       onChange={(e) => handleAssumptionChange(e, 'winRateImprovement')} 
                       className="w-full" />
              </div>
            </div>
            
            <div className="p-2 bg-gray-50 rounded">
              <h4 className="font-medium text-sm mb-2">Time Savings</h4>
              <div>
                <label className="block text-sm mb-1">Rep Productivity (hours saved/week): {values.repProductivityHours}</label>
                <input type="range" min="1" max="20" step="1" value={values.repProductivityHours} 
                       onChange={(e) => handleAssumptionChange(e, 'repProductivityHours')} 
                       className="w-full" />
              </div>
              <div>
                <label className="block text-sm mb-1">Manager Coaching (hours saved/week): {values.managerCoachingHours}</label>
                <input type="range" min="1" max="15" step="1" value={values.managerCoachingHours} 
                       onChange={(e) => handleAssumptionChange(e, 'managerCoachingHours')} 
                       className="w-full" />
              </div>
            </div>
            
            <div className="p-2 bg-gray-50 rounded">
              <h4 className="font-medium text-sm mb-2">Implementation</h4>
              <div>
                <label className="block text-sm mb-1">Implementation Cost: {formatCurrency(values.implementationCost)}</label>
                <input type="range" min="50000" max="1000000" step="50000" value={values.implementationCost} 
                       onChange={(e) => handleInputChange(e, 'implementationCost')} 
                       className="w-full" />
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
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
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-4">Value Drivers (Annual)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    dataKey="value"
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="p-2 border rounded">
                <p className="text-sm font-medium">Rep Productivity</p>
                <p className="text-lg font-semibold">{formatCurrency(values.productivity)}</p>
              </div>
              <div className="p-2 border rounded">
                <p className="text-sm font-medium">Ramp Time Accel.</p>
                <p className="text-lg font-semibold">{formatCurrency(values.rampTime)}</p>
              </div>
              <div className="p-2 border rounded">
                <p className="text-sm font-medium">Win Rate Improve.</p>
                <p className="text-lg font-semibold">{formatCurrency(values.winRate)}</p>
              </div>
              <div className="p-2 border rounded">
                <p className="text-sm font-medium">Manager Efficiency</p>
                <p className="text-lg font-semibold">{formatCurrency(values.managerEfficiency)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mb-8">
        <h3 className="font-semibold mb-4">Cumulative ROI Timeline (24 Months)</h3>
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
      
      <div className="mt-4 text-sm text-gray-500">
        <p>* Adjust sliders to model different ROI scenarios based on your organization's specific metrics</p>
        <p>* Timeline shows when different value drivers materialize over a 24-month period</p>
        <p>* All calculations are estimates and should be validated with your finance team</p>
      </div>
    </div>
  );
};

export default ROICalculator;
