import React from 'react';

interface DebugPanelProps {
  rollingContext: string[];
  triggers: { pause: boolean; punctuation: boolean; keyword: boolean };
  contextAnalysis: {
    lastTwo: string[];
    related: boolean;
    historical: string;
  };
  uiState: string;
  suggestion: string;
  userFeedback: string;
  checklist: { label: string; done: boolean }[];
  historySummary?: string;
  summaryStatus?: string;
  historyCount?: number;
  open: boolean;
  onClose: () => void;
  onGenerateSummary?: () => void;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  rollingContext,
  triggers,
  contextAnalysis,
  uiState,
  suggestion,
  userFeedback,
  checklist,
  historySummary = 'Not available',
  summaryStatus = 'Unknown',
  historyCount = 0,
  open,
  onClose,
  onGenerateSummary,
}) => {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed',
      top: 32,
      right: 32,
      zIndex: 9999,
      background: 'rgba(30,41,59,0.98)',
      color: 'white',
      borderRadius: 12,
      padding: 0,
      minWidth: 340,
      maxWidth: 420,
      boxShadow: '0 2px 16px rgba(0,0,0,0.18)',
      fontFamily: 'monospace',
      opacity: 0.98,
      display: 'flex',
      flexDirection: 'column',
      maxHeight: 'calc(100vh - 64px)',
    }}>
      <div style={{
        padding: '16px 20px 8px 20px',
        borderBottom: '1px solid #334155',
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center'
      }}>
        <b>Think+ Debug Panel</b>
        <button onClick={onClose} style={{background:'none',border:'none',color:'#f87171',fontWeight:'bold',fontSize:18,cursor:'pointer'}}>×</button>
      </div>
      
      <div style={{
        padding: '12px 20px',
        overflowY: 'auto',
        maxHeight: 'calc(100vh - 160px)',
        scrollbarWidth: 'thin',
        scrollbarColor: '#475569 #1e293b',
      }}>
        <div><b>Rolling Context:</b><br/>{rollingContext.map((s,i) => <div key={i}>{s}</div>)}</div>
        <div style={{marginTop:12}}><b>Triggers:</b><br/>
          Pause: {String(triggers.pause)}<br/>
          Punctuation: {String(triggers.punctuation)}<br/>
          Keyword: {String(triggers.keyword)}
        </div>
        <div style={{marginTop:12}}><b>Context Analysis:</b><br/>
          Last 2: {contextAnalysis.lastTwo.join(' | ')}<br/>
          Related: {String(contextAnalysis.related)}<br/>
          Historical: {contextAnalysis.historical}
        </div>
        <div style={{marginTop:12}}><b>UI State:</b> {uiState}</div>
        <div style={{marginTop:12}}><b>Suggestion:</b> {suggestion}</div>
        <div style={{marginTop:12}}><b>User Feedback:</b> {userFeedback}</div>
        
        <div style={{
          marginTop:16, 
          padding: '8px 12px', 
          background: 'rgba(56,189,248,0.1)', 
          borderRadius: 6,
          borderLeft: '3px solid #38bdf8'
        }}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <b>History Summary (OpenAI):</b>
            {onGenerateSummary && (
              <button 
                onClick={onGenerateSummary}
                style={{
                  background: 'rgba(56,189,248,0.2)',
                  border: '1px solid #38bdf8',
                  color: '#38bdf8',
                  borderRadius: 4,
                  padding: '2px 6px',
                  fontSize: 11,
                  cursor: 'pointer',
                }}
              >
                Generate Now
              </button>
            )}
          </div>
          
          <div style={{
            fontSize: 12, 
            marginTop: 4, 
            padding: '4px 6px', 
            background: 'rgba(30,41,59,0.3)', 
            borderRadius: 4
          }}>
            Status: {summaryStatus} | History Count: {historyCount}
          </div>
          
          <div style={{fontSize: 13, marginTop: 6, lineHeight: 1.4}}>
            {historySummary}
          </div>
        </div>

        <div style={{marginTop:16}}><b>Implementation Checklist:</b>
          <ul style={{margin:0,paddingLeft:18}}>
            {checklist.map((item,i) => (
              <li key={i} style={{color:item.done?'#38bdf8':'#f87171'}}>
                {item.done ? '[x]' : '[ ]'} {item.label}
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      <div style={{
        padding: '8px 20px 16px 20px',
        borderTop: '1px solid #334155',
        fontSize: 12,
        opacity: 0.7,
      }}>
        <b>Shortcut:</b> Command + /
      </div>
    </div>
  );
}; 