import { useState, useEffect } from 'react';
import axios from 'axios';
import { Editor } from '@monaco-editor/react';
import { Terminal, Copy, CheckCircle, XCircle, Play } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function App() {
  const [challenges, setChallenges] = useState([]);
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [sql, setSql] = useState('-- Write your SQL here\nSELECT * FROM aws_billing_logs LIMIT 5;');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get(`${API_URL}/challenges`).then(res => {
      setChallenges(res.data);
      if (res.data.length > 0) setActiveChallenge(res.data[0]);
    }).catch(err => console.error("Error fetching challenges", err));
  }, []);

  const runQuery = async () => {
    if (!activeChallenge) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await axios.post(`${API_URL}/submit`, {
        challenge_id: activeChallenge.id,
        query: sql
      });
      setResult(res.data);
    } catch (err) {
      setResult({ status: 'error', message: err.response?.data?.detail || err.message });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-gray-100 font-sans flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800/80 bg-black/40 backdrop-blur-md p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg shadow-[0_0_15px_rgba(99,102,241,0.5)]">
            <Terminal className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent tracking-tight">
            CloudQuery Sandbox
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-xs font-semibold px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-300 backdrop-blur-sm">
            Live Execution
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Pane - Challenge Info */}
        <div className="w-full md:w-1/3 border-r border-gray-800 p-6 flex flex-col gap-6 bg-[#0c0c0e] overflow-y-auto">
          <div>
            <h2 className="text-sm text-gray-400 uppercase tracking-wider mb-2">Select Challenge</h2>
            <div className="space-y-2">
              {challenges.map(c => (
                <button
                  key={c.id}
                  onClick={() => setActiveChallenge(c)}
                  className={`w-full text-left p-3 rounded-md transition-all ${activeChallenge?.id === c.id ? 'bg-gray-800 border-emerald-500 border' : 'bg-[#151518] border border-transparent hover:border-gray-700'}`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-sm">{c.title}</span>
                    <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full ${c.difficulty === 'Easy' ? 'bg-emerald-900/50 text-emerald-400' : 'bg-amber-900/50 text-amber-400'}`}>
                      {c.difficulty}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {activeChallenge && (
            <div className="bg-[#151518] p-5 rounded-xl border border-gray-800 shadow-xl">
              <h3 className="text-lg font-bold mb-2 text-white">{activeChallenge.title}</h3>
              <p className="text-sm text-gray-400 mb-4 leading-relaxed">{activeChallenge.description}</p>
              <div className="mt-4 p-3 bg-gray-900 rounded-lg text-sm font-mono text-gray-300 border border-gray-800">
                <span className="text-gray-500">Expected Columns: </span>
                <span className="text-cyan-400">{activeChallenge.expected_columns.join(', ')}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Pane - Editor & Output */}
        <div className="w-full md:w-2/3 flex flex-col h-[calc(100vh-65px)]">
          {/* Top Bar for Editor */}
          <div className="bg-[#111114] border-b border-gray-800 p-2 px-4 flex justify-between items-center shrink-0">
            <span className="text-xs font-mono text-gray-400 bg-gray-800 px-2 py-1 rounded">query.sql</span>
            <button 
              onClick={runQuery}
              disabled={loading}
              className="px-4 py-1.5 flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-md text-sm transition-colors disabled:opacity-50"
            >
              <Play className="w-4 h-4" />
              <span>{loading ? 'Executing...' : 'Run Code'}</span>
            </button>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 min-h-[300px]">
            <Editor
              height="100%"
              defaultLanguage="sql"
              theme="vs-dark"
              value={sql}
              onChange={(val) => setSql(val)}
              options={{ minimap: { enabled: false }, fontSize: 14, padding: { top: 16 } }}
            />
          </div>

          {/* Results Pane */}
          <div className="h-1/3 bg-[#0c0c0e] border-t border-gray-800 flex flex-col shrink-0">
            <div className="bg-[#111114] border-b border-gray-800 px-4 py-2 flex items-center space-x-2 shrink-0">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Execution Result</span>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              {!result && <div className="text-gray-600 text-sm italic">Run your query to see results here.</div>}
              
              {result && (
                <div>
                  <div className={`p-3 rounded-md mb-4 flex items-start space-x-2 ${result.status === 'success' ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-900/50' : result.status === 'failed' ? 'bg-amber-950/30 text-amber-400 border border-amber-900/50' : 'bg-red-950/30 text-red-400 border border-red-900/50'}`}>
                    {result.status === 'success' ? <CheckCircle className="w-5 h-5 mt-0.5" /> : <XCircle className="w-5 h-5 mt-0.5" />}
                    <div>
                      <div className="font-bold uppercase text-xs mb-1">{result.status}</div>
                      <div className="text-sm">{result.message}</div>
                    </div>
                  </div>

                  {result.rows && result.rows.length > 0 && (
                    <div className="overflow-x-auto rounded-lg border border-gray-800">
                      <table className="w-full text-sm text-left font-mono">
                        <thead className="text-xs text-gray-400 bg-gray-900 border-b border-gray-800">
                          <tr>
                            {result.columns.map((col, i) => (
                              <th key={i} className="px-4 py-2">{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {result.rows.map((row, i) => (
                            <tr key={i} className="bg-[#111114] border-b border-gray-800/50 last:border-0 hover:bg-gray-800">
                              {result.columns.map((col, j) => (
                                <td key={j} className="px-4 py-2 text-gray-300">{row[col]}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {result.rows && result.rows.length === 0 && (
                     <div className="text-sm text-gray-500 font-mono">Query returned 0 rows.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
