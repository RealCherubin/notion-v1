import React, { useRef, useState } from 'react';
import { getCherubinSuggestion, CherubinContext } from '@/agent/CherubinAgent';
import { useHotkey } from '@/hooks/useHotkey';
import { usePauseFriction } from '@/hooks/usePauseFriction';
import { BubbleItem } from './BubbleItem';
import { cn } from '@/lib/utils';

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

  // --- AI Suggestion Trigger ---
  const triggerSmartBubble = async (triggeredByTimer: boolean = false) => {
    const fullContent = contentRef.current?.innerText || '';
    const { currentParagraph, previousParagraph } = getStructuredContext(fullContent);
    const lastSentence = getLastSentence(currentParagraph);
    if (!lastSentence) return;
    const context: CherubinContext = { currentParagraph, previousParagraph };
    setDebug(d => ({ ...d, apiInProgress: true }));
    const { suggestion, aiResponseType } = await getCherubinSuggestion(context, triggeredByTimer ? 'pause' : 'hotkey', setDebug);
    setDebug(d => ({ ...d, apiInProgress: false }));
    if (suggestion) {
      addBubble(suggestion, aiResponseType);
    }
  };

  // --- Hotkey: Cmd+I or Ctrl+I triggers Cherubin modal ---
  useHotkey('i', async () => {
    const content = contentRef.current?.innerText || '';
    const { currentParagraph, previousParagraph } = getStructuredContext(content);
    const context: CherubinContext = { currentParagraph, previousParagraph };
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
    const context: CherubinContext = { currentParagraph, previousParagraph };
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
            left: cherubinModal.position.left - 160,
            top: cherubinModal.position.top - 72,
            width: 320,
            minHeight: 64,
            background: '#23272f',
            color: 'white',
            borderRadius: 16,
            border: '1.5px solid #38bdf8',
            boxShadow: '0 8px 32px rgba(30,41,59,0.18)',
            padding: '28px 32px 24px 32px',
            zIndex: 2000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.1em',
            fontWeight: 500,
          }}
        >
          <div style={{ marginBottom: 16, textAlign: 'center', whiteSpace: 'pre-wrap' }}>
            {cherubinModal.suggestion || 'No suggestion.'}
          </div>
          <button
            onClick={() => setCherubinModal(m => ({ ...m, visible: false }))}
            style={{
              marginTop: 8,
              background: '#38bdf8',
              color: '#23272f',
              border: 'none',
              borderRadius: 8,
              padding: '8px 24px',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '1em'
            }}
          >
            Close
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
        maxWidth: 400,
        boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
        fontFamily: 'monospace',
        opacity: 0.95,
        maxHeight: '60vh',
        overflowY: 'auto',
      }}>
        <div><b>AI Debug Dashboard</b></div>
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