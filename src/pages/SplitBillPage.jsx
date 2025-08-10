import React, { useEffect, useMemo, useState } from 'react';
import useStore from '../store';
import { db } from '../firebase/firestore';
import { addDoc, collection, doc, getDoc, updateDoc } from 'firebase/firestore';

const currency = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v || 0);

const SplitBillPage = () => {
  const { users, fetchUsers } = useStore();
  const [payer, setPayer] = useState('');
  const [participants, setParticipants] = useState([]); // array of user ids excluding payer
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('Family bill');
  const [date, setDate] = useState(new Date().toISOString().slice(0,10));

  useEffect(() => {
    const unsub = fetchUsers?.();
    return () => { unsub && unsub(); };
  }, [fetchUsers]);

  const toggleParticipant = (id) => {
    setParticipants(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id]);
  };

  const selectedCount = useMemo(() => (payer ? 1 : 0) + participants.length, [payer, participants]);
  const share = useMemo(() => {
    const total = parseFloat(amount) || 0;
    return selectedCount > 0 ? Math.round(total / selectedCount) : 0;
  }, [amount, selectedCount]);

  const handleSplit = async (e) => {
    e.preventDefault();
    const total = parseFloat(amount);
    if (!payer || !total || selectedCount < 2) {
      alert('Select a payer, at least one participant, and enter a valid amount.');
      return;
    }
    try {
      // 1) Record the expense paid by payer (for their portion only or total?)
      // We'll record the total as Expense from payer to reflect outflow, then Transfers back from participants.
      const expenseTx = {
        type: 'Expense',
        description: description || 'general transaction',
        amount: total,
        date: new Date(date),
        user: payer,
        category: 'Shared Expense',
      };
      const expRef = await addDoc(collection(db, 'transactions'), expenseTx);
      // adjust payer balance
      const payerRef = doc(db, 'users', payer);
      const payerDoc = await getDoc(payerRef);
      if (payerDoc.exists()) {
        const bal = payerDoc.data().balance || 0;
        await updateDoc(payerRef, { balance: bal - total });
      }

      // 2) For each participant, create Transfer from participant to payer of their equal share
      const eachShare = share;
      for (const uid of participants) {
        const tx = {
          type: 'Transfer',
          description: `Split: ${description || 'general transaction'}`,
          amount: eachShare,
          date: new Date(date),
          user: uid,
          to: payer,
          category: 'Split Settlement',
        };
        await addDoc(collection(db, 'transactions'), tx);
        // decrease participant balance
        const uRef = doc(db, 'users', uid);
        const uDoc = await getDoc(uRef);
        if (uDoc.exists()) {
          const bal = uDoc.data().balance || 0;
          await updateDoc(uRef, { balance: bal - eachShare });
        }
        // increase payer balance for received transfer
        const pDoc2 = await getDoc(payerRef);
        if (pDoc2.exists()) {
          const bal2 = pDoc2.data().balance || 0;
          await updateDoc(payerRef, { balance: bal2 + eachShare });
        }
      }

      alert('Split recorded successfully.');
      setAmount(''); setDescription('Family bill'); setParticipants([]); setPayer('');
    } catch (e1) {
      console.error('Error splitting bill:', e1);
      alert('Failed to record split. See console for details.');
    }
  };

  return (
    <div className="p-4">
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white p-6 rounded-xl shadow mb-6">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,white_0,transparent_40%),radial-gradient(circle_at_80%_0,white_0,transparent_35%)]" aria-hidden="true"></div>
        <div className="relative">
          <h2 className="text-2xl font-extrabold">Split a Bill</h2>
          <p className="text-sm text-white/85">Quickly split shared expenses among family members</p>
        </div>
      </div>
      <form onSubmit={handleSplit} className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1">Payer</label>
            <select value={payer} onChange={e=>setPayer(e.target.value)} className="w-full p-2 border rounded">
              <option value="">Select Payer</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block mb-1">Total Amount (INR)</label>
            <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} className="w-full p-2 border rounded" min="0" step="1" />
          </div>
          <div>
            <label className="block mb-1">Description</label>
            <input value={description} onChange={e=>setDescription(e.target.value)} className="w-full p-2 border rounded" placeholder="Family dinner" />
          </div>
          <div>
            <label className="block mb-1">Date</label>
            <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full p-2 border rounded" />
          </div>
        </div>
        <div className="mt-4">
          <h4 className="font-semibold mb-2">Participants</h4>
          <div className="flex flex-wrap gap-2">
            {users.map(u => (
              <label key={u.id} className={`px-3 py-1 border rounded-full cursor-pointer ${participants.includes(u.id) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white'}`}>
                <input type="checkbox" className="hidden" checked={participants.includes(u.id)} onChange={()=>toggleParticipant(u.id)} />
                {u.name}
              </label>
            ))}
          </div>
          <p className="text-sm text-gray-600 mt-2">Selected people (including payer): {selectedCount}. Each share: {currency(share)}.</p>
        </div>
        <button type="submit" className="mt-4 bg-indigo-600 text-white px-3 py-2 rounded hover:bg-indigo-700">Create Split</button>
      </form>
    </div>
  );
};

export default SplitBillPage;
