import React, { useRef, useState } from 'react';
import { getCherubinSuggestion, CherubinContext } from '@/agent/CherubinAgent';
import { useHotkey } from '@/hooks/useHotkey';
import { usePauseFriction } from '@/hooks/usePauseFriction';
import { BubbleItem } from './BubbleItem';
import { cn } from '@/lib/utils';
import { FAKE_WORKSPACE_DATA } from '@/data/fakeWorkspaceData';

// --- Types ---
interface Note {
  id: string;
  title: string;
  content: string;
}
interface EditorProps {
  note: Note;
  setNote: (note: Note) => void;
  className?: string;
}
interface Bubble {
  id: string;
  position: { left: number; top: number };
  text: string;
  createdAt: number;
  expanded: boolean;
  suggestionType?: string;
}

// --- Utility Functions ---
function getStructuredContext(fullText: string): { currentParagraph: string; previousParagraph: string } {
  const paragraphs = fullText.split(/\n\s*\n+/);
  const currentParagraph = paragraphs[paragraphs.length - 1]?.trim() || '';
  const previousParagraph = paragraphs[paragraphs.length - 2]?.trim() || '';
  return { currentParagraph, previousParagraph };
}
function getLastSentence(text: string) {
  const sentences = text.match(/[^.!?\n]+[.!?\n]+/g);
  if (!sentences) return '';
  return sentences[sentences.length - 1].trim();
}
function getUniqueId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// Utility: Extract keywords from a string
function extractKeywords(text: string): string[] {
  return Array.from(
    new Set(
      text
        .toLowerCase()
        .split(/\W+/)
        .filter(word => word.length > 3)
    )
  );
}

// Utility: Filter workspace context for items containing any of the keywords
function filterWorkspaceContextByKeywords(workspaceData: any[], keywords: string[]) {
  const allTextItems = [];
  for (const item of workspaceData) {
    if (item.type === 'note' && Array.isArray(item.content)) {
      allTextItems.push({ ...item, text: item.content.join(' ') });
    } else if (item.type === 'table' && Array.isArray(item.rows)) {
      for (const row of item.rows) {
        allTextItems.push({ ...item, text: row.join(' ') });
      }
    }
  }
  return allTextItems.filter(item =>
    keywords.some(kw => item.text.toLowerCase().includes(kw))
  );
}

// Add a helper to build CherubinContext with workspaceContext
function buildCherubinContext(currentParagraph: string, previousParagraph: string, setLastExtractedContext: any): CherubinContext {
  const keywords = extractKeywords(currentParagraph);
  const filteredContext = filterWorkspaceContextByKeywords(FAKE_WORKSPACE_DATA, keywords);
  const contextSummary = filteredContext.slice(0, 3).map(item =>
    `Type: ${item.type}\nTitle: ${item.title || ''}\nContent: ${item.text}\n`
  ).join('\n---\n');
  setLastExtractedContext({
    currentParagraph,
    previousParagraph,
    keywords,
    workspaceContext: contextSummary,
  });
  return {
    currentParagraph,
    previousParagraph,
    workspaceContext: contextSummary,
  };
}

// Utility: Get first N words
function getFirstNWords(text: string, n: number) {
  const words = text.split(/\s+/);
  return words.slice(0, n).join(' ') + (words.length > n ? '...' : '');
}

// --- Main Editor Component ---
export function Editor({ note, setNote, className }: EditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [debug, setDebug] = useState({
    apiInProgress: false,
    apiError: '',
    lastAIResponse: '',
    apiPrompt: '',
    aiResponseType: '',
  });
  const [cherubinModal, setCherubinModal] = useState<{
    visible: boolean;
    suggestion: string;
    position: { left: number; top: number; caretHeight: number };
  }>({ visible: false, suggestion: '', position: { left: 0, top: 0, caretHeight: 0 } });
  const [lastExtractedContext, setLastExtractedContext] = useState({
    currentParagraph: '',
    previousParagraph: '',
    keywords: [],
    workspaceContext: '',
  });
  const [showContextDetails, setShowContextDetails] = useState(false);
  const [modalExpanded, setModalExpanded] = useState(false);

  // --- Bubble Logic ---
  const addBubble = (text: string, suggestionType?: string): string => {
    const selection = window.getSelection();
    let left = 100, top = 100;
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const editorRect = editorRef.current?.getBoundingClientRect();
      if (editorRect) {
        left = rect.right - editorRect.left + 8;
        top = rect.top - editorRect.top - 8;
      }
    }
    const newBubble: Bubble = {
        id: getUniqueId(),
        position: { left, top },
        text,
        createdAt: Date.now(),
        expanded: false,
      suggestionType,
    };
    setBubbles(prev => [...prev, newBubble]);
    return newBubble.id;
  };

  // --- Hotkey: Cmd+I or Ctrl+I triggers Cherubin modal ---
  useHotkey('i', async () => {
    const content = contentRef.current?.innerText || '';
    const { currentParagraph, previousParagraph } = getStructuredContext(content);
    const context = buildCherubinContext(currentParagraph, previousParagraph, setLastExtractedContext);
    let left = 300, top = 200, caretHeight = 24;
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const editorRect = editorRef.current?.getBoundingClientRect();
      if (editorRect) {
        left = rect.left - editorRect.left + rect.width / 2;
        top = rect.top - editorRect.top;
        caretHeight = rect.height;
      }
    }
    setDebug(d => ({ ...d, apiInProgress: true }));
    const { suggestion } = await getCherubinSuggestion(context, 'hotkey', setDebug);
    setCherubinModal({ visible: true, suggestion, position: { left, top, caretHeight } });
    setDebug(d => ({ ...d, apiInProgress: false }));
  });

  // --- Pause/Friction Trigger ---
  const pauseFrictionTrigger = async () => {
    const content = contentRef.current?.innerText || '';
    const { currentParagraph, previousParagraph } = getStructuredContext(content);
    const context = buildCherubinContext(currentParagraph, previousParagraph, setLastExtractedContext);
    const { suggestion } = await getCherubinSuggestion(context, 'pause', setDebug);
    if (suggestion) addBubble(suggestion, 'CherubinPause');
  };
  const resetPauseFriction = usePauseFriction(pauseFrictionTrigger, 12000);

  // --- Content Change/Idle Timer ---
  function handleInput() {
    resetPauseFriction();
  }

  // --- Main Render ---
  return (
    <div 
      ref={editorRef}
      className={cn("relative h-full overflow-y-auto px-4 md:px-16 py-12", className)}
    >
      {/* Title */}
      <div 
        ref={titleRef}
        contentEditable
        className="notion-editor text-4xl font-bold mb-4 outline-none"
        data-placeholder="Untitled"
        suppressContentEditableWarning
        onBlur={() => setNote({ ...note, title: titleRef.current?.textContent || '' })}
        onInput={handleInput}
      />
      {/* Content */}
        <div 
          ref={contentRef}
          contentEditable
          className="notion-editor prose max-w-full"
          data-placeholder="Start writing..."
          suppressContentEditableWarning
        onBlur={() => setNote({ ...note, content: contentRef.current?.innerHTML || '' })}
          onInput={handleInput}
        />
      {/* AI Suggestion Bubbles */}
      {bubbles.map(bubble => (
        <BubbleItem
          key={bubble.id}
          bubble={bubble}
          isFocused={false}
          isSelected={false}
          isDragged={false}
          hoverProximityPadding={10}
          onBubbleMouseEnter={() => {}}
          onBubbleMouseLeave={() => {}}
          onBubbleClick={() => {}}
          onBubbleFocus={() => {}}
          onBubbleBlur={() => {}}
          onBubbleDragStart={() => {}}
          onBubbleClose={() => setBubbles(bs => bs.filter(b => b.id !== bubble.id))}
          onBubbleAction={() => {}}
        />
      ))}
      {/* Cherubin Modal (hotkey trigger) */}
      {cherubinModal.visible && (
        <div
          style={{
            position: 'absolute',
            left: cherubinModal.position.left,
            top: cherubinModal.position.top - (modalExpanded ? 80 : 32),
            background: '#d4d4d4',
            borderRadius: 16,
            padding: '0 10px',
            minHeight: modalExpanded ? 80 : 32,
            minWidth: 180,
            maxWidth: 320,
            display: 'flex',
            alignItems: 'center',
            boxShadow: 'none',
            border: 'none',
            zIndex: 2000,
            fontSize: '10px',
            fontWeight: 500,
            color: '#111',
            transition: 'min-width 0.2s, min-height 0.2s',
          }}
        >
          {/* Circle Icon */}
          <div
            style={{
              width: 8,
              height: 8,
              background: '#222',
              borderRadius: '50%',
              marginRight: 8,
              marginLeft: -6,
            }}
          />
          {/* Suggestion Text */}
          <div
            style={{
              flex: 1,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              overflow: 'hidden',
              whiteSpace: modalExpanded ? 'pre-wrap' : 'nowrap',
              textOverflow: 'ellipsis',
              fontSize: '10px',
              transition: 'font-size 0.2s',
            }}
          >
            {modalExpanded
              ? getFirstNWords(cherubinModal.suggestion || '', 30)
              : getFirstNWords(cherubinModal.suggestion || '', 5)}
          </div>
          {/* Expand Icon */}
          <button
            onClick={() => setModalExpanded(e => !e)}
            style={{
              width: 18,
              height: 18,
              background: '#fff',
              border: 'none',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: 8,
              cursor: 'pointer',
              fontSize: 12,
              color: '#888',
              boxShadow: 'none',
            }}
            title={modalExpanded ? 'Collapse' : 'Expand'}
          >
            <span style={{ fontSize: 12 }}>{modalExpanded ? '🗕' : '↗'}</span>
          </button>
        </div>
      )}
      {/* Debug Dashboard */}
      <div style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        background: 'rgba(30,41,59,0.95)',
        color: 'white',
        borderRadius: 8,
        padding: 12,
        fontSize: 12,
        zIndex: 9999,
        minWidth: 260,
        maxWidth: showContextDetails ? 800 : 400,
        boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
        fontFamily: 'monospace',
        opacity: 0.95,
        maxHeight: showContextDetails ? '90vh' : '60vh',
        overflowY: 'auto',
      }}>
        <div><b>AI Debug Dashboard</b></div>
        <button onClick={() => setShowContextDetails(s => !s)} style={{margin:'8px 0',padding:'4px 8px',borderRadius:4,background:'#334155',color:'#fff',border:'none',cursor:'pointer'}}>
          {showContextDetails ? 'Hide' : 'Show'} Extracted Context
        </button>
        {showContextDetails && (
          <div style={{ background: '#222', color: '#fff', padding: 8, borderRadius: 4, marginTop: 8, maxHeight: '60vh', overflowY: 'auto' }}>
            <div><b>Current Paragraph:</b> <pre>{lastExtractedContext.currentParagraph}</pre></div>
            <div><b>Previous Paragraph:</b> <pre>{lastExtractedContext.previousParagraph}</pre></div>
            <div><b>Keywords:</b> {lastExtractedContext.keywords.join(', ')}</div>
            <div>
              <b>Workspace Context:</b>
              <pre>{lastExtractedContext.workspaceContext}</pre>
          </div>
        </div>
        )}
        <div>API in progress: {debug.apiInProgress ? 'Yes' : 'No'}</div>
        <div>Last AI response: <span style={{ color: '#38bdf8' }}>{debug.lastAIResponse}</span></div>
        <div>AI response type: <span style={{ color: '#fbbf24' }}>{debug.aiResponseType}</span></div>
        <div>API error: <span style={{ color: '#f87171' }}>{debug.apiError}</span></div>
        <div style={{ marginTop: 8 }}><details><summary>Prompt</summary><pre style={{ whiteSpace: 'pre-wrap' }}>{debug.apiPrompt}</pre></details></div>
        <div style={{ marginTop: 8 }}><details><summary>Bubbles</summary><pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(bubbles, null, 2)}</pre></details></div>
      </div>
    </div>
  );
}