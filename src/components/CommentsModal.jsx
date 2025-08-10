import React, { useEffect, useState } from 'react';
import useStore from '../store';
import { db } from '../firebase/firestore';
import { doc, onSnapshot, updateDoc, arrayUnion } from 'firebase/firestore';

const CommentsModal = ({ transaction, onClose }) => {
  const { users } = useStore();
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [authorId, setAuthorId] = useState('');

  useEffect(() => {
    if (!transaction?.id) return;
    const ref = doc(db, 'transactions', transaction.id);
    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.data() || {};
      setComments(Array.isArray(data.comments) ? data.comments.slice().sort((a,b)=> (b.at||'').localeCompare(a.at||'')) : []);
    });
    return () => unsub();
  }, [transaction]);

  if (!transaction) return null;

  const addComment = async (e) => {
    e.preventDefault();
    if (!text || !authorId) return;
    try {
      const authorName = users.find(u => u.id === authorId)?.name || authorId;
      const entry = { id: crypto.randomUUID(), text: text.trim(), authorId, authorName, at: new Date().toISOString() };
      await updateDoc(doc(db, 'transactions', transaction.id), { comments: arrayUnion(entry) });
      setText('');
    } catch (err) {
      console.error('Failed to add comment', err);
      alert('Could not save comment. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold">Comments</h3>
          <button onClick={onClose} className="text-sm text-gray-600 hover:underline">Close</button>
        </div>
        <form onSubmit={addComment} className="mb-3">
          <label className="block text-sm mb-1">Author</label>
          <select value={authorId} onChange={e=>setAuthorId(e.target.value)} className="w-full p-2 border rounded mb-2">
            <option value="">Select user</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <label className="block text-sm mb-1">Comment</label>
          <input value={text} onChange={e=>setText(e.target.value)} className="w-full p-2 border rounded mb-2" placeholder="Ask a question or add a note"/>
          <button className="bg-indigo-600 text-white px-3 py-2 rounded hover:bg-indigo-700">Post</button>
        </form>
        <div className="max-h-64 overflow-y-auto space-y-2">
          {comments.length === 0 ? (
            <p className="text-sm text-gray-500">No comments yet.</p>
          ) : comments.map(c => (
            <div key={c.id} className="p-2 border rounded">
              <div className="flex justify-between text-xs text-gray-500">
                <span>{c.authorName || c.authorId}</span>
                <span>{c.at ? new Date(c.at).toLocaleString() : ''}</span>
              </div>
              <p className="text-sm">{c.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CommentsModal;
