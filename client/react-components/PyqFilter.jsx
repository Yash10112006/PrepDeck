import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PyqFilter = ({ token, apiBaseUrl = '/api', onPyqsUpdate }) => {
  const [year, setYear] = useState('');
  const [subject, setSubject] = useState('');
  const [examType, setExamType] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPyqs();
  }, [year, subject, examType]);

  const fetchPyqs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (year) params.append('year', year);
      if (subject) params.append('subject', subject);
      if (examType) params.append('examType', examType);

      const response = await axios.get(`${apiBaseUrl}/pyqs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      onPyqsUpdate(response.data); // Pass filtered PYQs back to the parent component
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch PYQs');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setYear('');
    setSubject('');
    setExamType('');
  };

  return (
    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-sm mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Year</label>
          <select 
            value={year} 
            onChange={(e) => setYear(e.target.value)}
            className="w-full bg-slate-900 border border-slate-600 text-slate-200 text-sm rounded-lg py-2 px-3 focus:outline-none focus:border-primary"
          >
            <option value="">All Years</option>
            <option value="2024">2024</option>
            <option value="2023">2023</option>
            <option value="2022">2022</option>
            <option value="2021">2021</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Exam Type</label>
          <select 
            value={examType} 
            onChange={(e) => setExamType(e.target.value)}
            className="w-full bg-slate-900 border border-slate-600 text-slate-200 text-sm rounded-lg py-2 px-3 focus:outline-none focus:border-primary"
          >
            <option value="">All Types</option>
            <option value="midsem">Midsem</option>
            <option value="endsem">Endsem</option>
            <option value="backlog">Backlog</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Subject Search</label>
          <input 
            type="text" 
            value={subject} 
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Maths, Data Structures..."
            className="w-full bg-slate-900 border border-slate-600 text-slate-200 text-sm rounded-lg py-2 px-3 focus:outline-none focus:border-primary placeholder-slate-500"
          />
        </div>

        <div className="flex items-end justify-end h-full mt-auto pb-1">
          {loading ? (
             <span className="text-secondary text-sm flex items-center gap-2"><i className="fa-solid fa-spinner fa-spin"></i> Filtering...</span>
           ) : (
             <button 
               onClick={handleReset} 
               className="text-slate-400 text-sm hover:text-white transition-colors"
             >
               Reset Filters
             </button>
           )}
        </div>

      </div>
      {error && <p className="text-red-400 text-xs mt-3">{error}</p>}
    </div>
  );
};

export default PyqFilter;
