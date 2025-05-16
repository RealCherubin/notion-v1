import React, { useState } from 'react';
import { FAKE_WORKSPACE_DATA } from '@/data/fakeWorkspaceData';

export default function Workspace() {
  const [currentPageId, setCurrentPageId] = useState(FAKE_WORKSPACE_DATA[0].id);
  const currentPage = FAKE_WORKSPACE_DATA.find(p => p.id === currentPageId);

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar */}
      <div style={{ width: 220, borderRight: '1px solid #eee', padding: 16, background: '#f8fafc' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: 18 }}>Pages</h3>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {FAKE_WORKSPACE_DATA.map(page => (
            <li key={page.id} style={{ marginBottom: 4 }}>
              <button
                style={{
                  background: page.id === currentPageId ? '#e0e7ff' : 'transparent',
                  border: 'none',
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontWeight: page.id === currentPageId ? 600 : 400,
                  borderRadius: 6,
                  transition: 'background 0.15s',
                }}
                onClick={() => setCurrentPageId(page.id)}
              >
                {page.title}
              </button>
            </li>
          ))}
        </ul>
      </div>
      {/* Page Viewer */}
      <div style={{ flex: 1, padding: 32, overflowY: 'auto', background: '#fff' }}>
        <h2 style={{ fontSize: 28, marginBottom: 24 }}>{currentPage?.title}</h2>
        {currentPage?.type === 'note' && (
          <div>
            {currentPage.content.map((line: string, i: number) => (
              <p key={i} style={{ fontSize: 18, margin: '12px 0' }}>{line}</p>
            ))}
          </div>
        )}
        {currentPage?.type === 'table' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 16 }}>
              <thead>
                <tr>
                  {currentPage.columns.map((col: string) => (
                    <th key={col} style={{ border: '1px solid #ccc', padding: 8, background: '#f1f5f9', fontWeight: 600 }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentPage.rows.slice(0, 100).map((row: any[], i: number) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#f9fafb' : '#fff' }}>
                    {row.map((cell, j) => (
                      <td key={j} style={{ border: '1px solid #eee', padding: 8 }}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {currentPage.rows.length > 100 && (
              <div style={{ marginTop: 12, color: '#888', fontSize: 14 }}>
                Showing first 100 rows of {currentPage.rows.length} total.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 