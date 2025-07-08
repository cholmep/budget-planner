import React from 'react';
import { useNavigate } from 'react-router-dom';

const ScenarioForm: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Create New Scenario</h1>
        <p className="text-gray-600">Model future budget projections</p>
      </div>
      <div className="card">
        <p className="text-gray-600">Scenario creation form would be implemented here.</p>
        <button 
          onClick={() => navigate('/scenarios')}
          className="btn btn-primary mt-4"
        >
          Back to Scenarios
        </button>
      </div>
    </div>
  );
};

export default ScenarioForm;