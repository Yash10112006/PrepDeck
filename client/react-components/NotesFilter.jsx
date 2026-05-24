import React, { useState, useEffect } from 'react';
import axios from 'axios';

const NotesFilter = ({ token, apiBaseUrl = '/api', onNotesUpdate }) => {
  const [semester, setSemester] = useState('');
  const [subject, setSubject] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Trigger search on filter change
  useEffect(() => {
    fetchNotes();
  }, [semester, subject]);

  const fetchNotes = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (semester) params.append('semester', semester);
      if (subject) params.append('subject', subject);

      const response = await axios.get(`${apiBaseUrl}/notes?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      onNotesUpdate(response.data); // Pass data back to parent state
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch notes');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSemester('');
    setSubject('');
  };

  return (
    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-sm mb-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full">
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-400 mb-1">Semester</label>
            <select 
              value={semester} 
              onChange={(e) => setSemester(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 text-slate-200 text-sm rounded-lg py-2 px-3 focus:outline-none focus:border-primary"
            >
              <option value="">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                <option key={sem} value={sem}>Semester {sem}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-400 mb-1">Subject Search</label>
            <input 
              type="text" 
              value={subject} 
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. OS, DBMS, Physics..."
              className="w-full bg-slate-900 border border-slate-600 text-slate-200 text-sm rounded-lg py-2 px-3 focus:outline-none focus:border-primary placeholder-slate-500"
            />
          </div>
        </div>

        <div className="flex items-end self-stretch md:self-end h-full mt-auto pb-1">
           {loading ? (
             <span className="text-primary text-sm flex items-center gap-2"><i className="fa-solid fa-spinner fa-spin"></i> Filtering...</span>
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

export default NotesFilter;
