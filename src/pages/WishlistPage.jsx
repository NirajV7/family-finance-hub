import React, { useEffect, useState } from 'react';

const LS_KEY = 'ffh_wishlist_v1';
const loadItems = () => { try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; } catch { return []; } };
const saveItems = (items) => localStorage.setItem(LS_KEY, JSON.stringify(items));

const WishlistPage = () => {
  const [items, setItems] = useState(loadItems());
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');

  useEffect(()=>{ saveItems(items); }, [items]);

  const addItem = (e) => {
    e.preventDefault();
    if (!title) return;
    setItems([{ id: crypto.randomUUID(), title: title.trim(), note: note.trim(), createdAt: Date.now() }, ...items]);
    setTitle(''); setNote('');
  };

  const removeItem = (id) => setItems(items.filter(i=>i.id!==id));

  return (
    <div className="p-4">
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white p-6 rounded-xl shadow mb-6">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,white_0,transparent_40%),radial-gradient(circle_at_80%_0,white_0,transparent_35%)]" aria-hidden="true"></div>
        <div className="relative">
          <h2 className="text-2xl font-extrabold">Shared Wishlist</h2>
          <p className="text-sm text-white/85">Plan and prioritize big family purchases</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <form onSubmit={addItem} className="card p-4 lg:col-span-1">
          <h3 className="font-bold mb-3">Add Wishlist Item</h3>
          <label className="block text-sm mb-1">Title</label>
          <input className="w-full p-2 border rounded mb-3" value={title} onChange={e=>setTitle(e.target.value)} placeholder="New TV" />
          <label className="block text-sm mb-1">Note</label>
          <input className="w-full p-2 border rounded mb-3" value={note} onChange={e=>setNote(e.target.value)} placeholder="Preferred brand, size..." />
          <button className="bg-pink-600 text-white px-3 py-2 rounded hover:bg-pink-700">Add</button>
        </form>
        <div className="card p-4 lg:col-span-2">
          <h3 className="font-bold mb-3">Items</h3>
          {items.length === 0 ? (
            <p className="text-sm text-gray-600">No items yet. Add something your family wants.</p>
          ) : (
            <ul className="space-y-3">
              {items.map(i => (
                <li key={i.id} className="p-3 border rounded flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{i.title}</p>
                    {i.note && <p className="text-xs text-gray-500">{i.note}</p>}
                  </div>
                  <button onClick={()=>removeItem(i.id)} className="text-red-600 text-sm hover:underline">Remove</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default WishlistPage;
