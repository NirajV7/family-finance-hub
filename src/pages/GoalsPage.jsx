import React, { useEffect, useMemo, useState } from 'react';

const LS_KEY = 'ffh_goals_v1';

const currency = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v || 0);

const loadGoals = () => {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; } catch { return []; }
};
const saveGoals = (goals) => localStorage.setItem(LS_KEY, JSON.stringify(goals));

const ProgressBar = ({ value, max }) => {
  const pct = Math.min(100, Math.round(((value || 0) / (max || 1)) * 100));
  return (
    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
      <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500" style={{ width: pct + '%' }} />
    </div>
  );
};

const GoalsPage = () => {
  const [goals, setGoals] = useState(loadGoals());
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => { saveGoals(goals); }, [goals]);

  const addGoal = (e) => {
    e.preventDefault();
    if (!title || !target) return;
    const newGoal = { id: crypto.randomUUID(), title: title.trim(), target: parseFloat(target), saved: 0, note: note.trim() };
    setGoals([newGoal, ...goals]);
    setTitle(''); setTarget(''); setNote('');
  };

  const addContribution = (id, amount) => {
    setGoals(g => g.map(goal => goal.id === id ? { ...goal, saved: Math.max(0, (goal.saved || 0) + amount) } : goal));
  };

  const removeGoal = (id) => setGoals(g => g.filter(x => x.id !== id));

  return (
    <div className="p-4">
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white p-6 rounded-xl shadow mb-6">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,white_0,transparent_40%),radial-gradient(circle_at_80%_0,white_0,transparent_35%)]" aria-hidden="true"></div>
        <div className="relative">
          <h2 className="text-2xl font-extrabold">Goals</h2>
          <p className="text-sm text-white/85">Set shared goals and track progress together</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <form onSubmit={addGoal} className="card p-4 lg:col-span-1">
          <h3 className="font-bold mb-3">Create Financial Goal</h3>
          <label className="block text-sm mb-1">Title</label>
          <input className="w-full p-2 border rounded mb-3" value={title} onChange={e=>setTitle(e.target.value)} placeholder="EMI for Loan"/>
          <label className="block text-sm mb-1">Target Amount (INR)</label>
          <input type="number" className="w-full p-2 border rounded mb-3" value={target} onChange={e=>setTarget(e.target.value)} min="0" step="1" placeholder="100000"/>
          <label className="block text-sm mb-1">Note</label>
          <input className="w-full p-2 border rounded mb-4" value={note} onChange={e=>setNote(e.target.value)} placeholder="Optional notes"/>
          <button className="bg-indigo-600 text-white px-3 py-2 rounded hover:bg-indigo-700">Add Goal</button>
        </form>
        <div className="lg:col-span-2 card p-4">
          <h3 className="font-bold mb-3">Your Goals</h3>
          {goals.length === 0 ? (
            <p className="text-sm text-gray-600">No goals yet. Create one to get started.</p>
          ) : (
            <ul className="space-y-4">
              {goals.map(g => {
                const pct = Math.min(100, Math.round(((g.saved||0)/(g.target||1))*100));
                return (
                  <li key={g.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-lg">{g.title}</h4>
                        {g.note ? <p className="text-xs text-gray-500">{g.note}</p> : null}
                      </div>
                      <button onClick={()=>removeGoal(g.id)} className="text-red-600 text-sm hover:underline">Remove</button>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>{currency(g.saved)} saved</span>
                      <span>Target: {currency(g.target)} ({pct}%)</span>
                    </div>
                    <ProgressBar value={g.saved} max={g.target} />
                    <div className="mt-3 flex gap-2 items-center">
                      <input type="number" min="0" step="1" placeholder="Add amount" className="p-2 border rounded w-40" id={`add-${g.id}`} />
                      <button onClick={()=>{
                        const el = document.getElementById(`add-${g.id}`);
                        const val = parseFloat(el.value);
                        if (!isNaN(val) && val>0) { addContribution(g.id, val); el.value=''; }
                      }} className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700">Add Contribution</button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoalsPage;
