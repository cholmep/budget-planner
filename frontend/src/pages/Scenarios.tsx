import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, BarChart3, TrendingUp } from 'lucide-react';

const Scenarios: React.FC = () => {
  const scenarios = [
    { id: 1, name: 'Conservative Budget', projectionMonths: 12, netIncome: 1250, totalProjected: 15000 },
    { id: 2, name: 'Aggressive Savings', projectionMonths: 12, netIncome: 1800, totalProjected: 21600 }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Budget Scenarios</h1>
          <p className="text-gray-600">Model different financial scenarios and compare outcomes</p>
        </div>
        <Link to="/scenarios/new" className="btn btn-primary flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Create Scenario</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {scenarios.map((scenario) => (
          <div key={scenario.id} className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{scenario.name}</h3>
              <BarChart3 className="h-5 w-5 text-primary-500" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Monthly Net Income</span>
                <span className="font-medium text-success-600">+${scenario.netIncome}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Projection Period</span>
                <span className="font-medium">{scenario.projectionMonths} months</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Projected</span>
                <span className="font-bold text-primary-600">${scenario.totalProjected.toLocaleString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Scenarios;