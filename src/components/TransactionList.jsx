import React, { useState } from 'react';

const TransactionList = ({ transactions, users, actions }) => {
  const [expandedId, setExpandedId] = useState(null);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (timestamp) => {
    if (timestamp && timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString('en-IN');
    }
    return 'Invalid Date';
  };

  const getUserName = (userId) => {
    const user = users?.find(u => u.id === userId);
    return user ? user.name : userId;
  };

  const toggleRow = (id) => setExpandedId(prev => (prev === id ? null : id));

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="font-bold mb-4">Transactions</h3>
      {/* Mobile card list */}
      <div className="md:hidden space-y-3">
        {transactions.map(t => {
          const commentCount = Array.isArray(t.comments) ? t.comments.length : 0;
          const isOpen = expandedId === t.id;
          return (
            <div key={t.id} className="border rounded-lg p-3" onClick={()=>toggleRow(t.id)}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-gray-500">{formatDate(t.date)}</div>
                  <div className="font-semibold">{(t.description && String(t.description).trim()) || 'General Transaction'}</div>
                  <div className="text-xs text-gray-500">{t.type} • From {getUserName(t.user)} {t.to ? `→ ${getUserName(t.to)}` : ''}</div>
                </div>
                <div className="text-right font-bold">{formatCurrency(t.amount)}</div>
              </div>
              <div className="mt-2 flex items-center justify-between">
                {commentCount > 0 ? (
                  <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{commentCount} comment{commentCount>1?'s':''}</span>
                ) : <span />}
                {actions && (
                  <div onClick={(e)=>e.stopPropagation()} className="text-xs">
                    {actions(t)}
                  </div>
                )}
              </div>
              {isOpen && (
                <div className="mt-3 text-sm text-gray-700 space-y-2">
                  <div><span className="text-gray-500">Category:</span> {t.category || '-'}</div>
                  <div>
                    <p className="font-semibold mb-1">Comments</p>
                    {commentCount === 0 ? (
                      <p className="text-gray-500">No comments yet.</p>
                    ) : (
                      <ul className="space-y-1 max-h-32 overflow-y-auto pr-1">
                        {t.comments.slice().sort((a,b)=> (b.at||'').localeCompare(a.at||''))?.map(c => (
                          <li key={c.id} className="text-xs border rounded px-2 py-1 bg-white">
                            <div className="flex justify-between text-gray-500">
                              <span>{c.authorName || c.authorId}</span>
                              <span>{c.at ? new Date(c.at).toLocaleString() : ''}</span>
                            </div>
                            <p className="text-gray-800">{c.text}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Date</th>
              <th className="p-2 text-left">Description</th>
              <th className="p-2 text-left">Type</th>
              <th className="p-2 text-left">From</th>
              <th className="p-2 text-left">To</th>
              <th className="p-2 text-right">Amount</th>
              {actions && <th className="p-2 text-center">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {transactions.map(t => {
              const commentCount = Array.isArray(t.comments) ? t.comments.length : 0;
              return (
                <React.Fragment key={t.id}>
                  <tr className="border-b cursor-pointer hover:bg-gray-50" onClick={()=>toggleRow(t.id)}>
                    <td className="p-2">{formatDate(t.date)}</td>
                    <td className="p-2">
                      {(t.description && String(t.description).trim()) || 'General Transaction'}
                      <div>
                        {commentCount > 0 && (
                          <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{commentCount} comment{commentCount > 1 ? 's' : ''}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-2">{t.type}</td>
                    <td className="p-2">{getUserName(t.user)}</td>
                    <td className="p-2">{t.to ? getUserName(t.to) : '-'}</td>
                    <td className="p-2 text-right">{formatCurrency(t.amount)}</td>
                    {actions && <td className="p-2 text-center" onClick={(e)=>e.stopPropagation()}>{actions(t)}</td>}
                  </tr>
                  {expandedId === t.id && (
                    <tr className="bg-gray-50">
                      <td colSpan={actions ? 7 : 6} className="p-3">
                        <div className="text-sm text-gray-700 grid grid-cols-1 gap-3">
                          <div>
                            <p className="font-semibold mb-1">Comments</p>
                            {commentCount === 0 ? (
                              <p className="text-gray-500">No comments yet.</p>
                            ) : (
                              <ul className="space-y-1 max-h-32 overflow-y-auto pr-1">
                                {t.comments.slice().sort((a, b) => (b.at || '').localeCompare(a.at || '')).map(c => (
                                  <li key={c.id}
                                      className="text-xs border rounded px-2 py-1 bg-white">
                                    <div className="flex justify-between text-gray-500">
                                      <span>{c.authorName || c.authorId}</span>
                                      <span>{c.at ? new Date(c.at).toLocaleString() : ''}</span>
                                    </div>
                                    <p className="text-gray-800">{c.text}</p>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionList;