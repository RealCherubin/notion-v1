import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { cn, getOpenAIApiKey } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';

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

const MIN_TOKENS = 1;
const MAX_TOKENS = 500;

function tokenize(text: string) {
  return text.split(/\s+/);
}

function getLastTokens(text: string, minTokens: number, maxTokens: number) {
  const tokens = tokenize(text);
  const count = Math.max(minTokens, Math.min(tokens.length, maxTokens));
  return tokens.slice(-count).join(' ');
}

async function fetchSmartBubble(context: string, styleProfile: string, setDebug: any) {
  const apiKey = getOpenAIApiKey();
  const prompt = `
You are a writing assistant. Given the user's recent writing (below), detect uncertainty, topic shifts, or mistakes. 
If you detect any, EITHER:
- Ask one concise clarifying question, OR
- Offer one high-impact suggestion (grammar, factual cite, stylistic lift).
Match the user's style: ${styleProfile}
Never interrupt mid-sentence; only respond after punctuation or a long pause.

USER_CONTEXT (live stream):
${context}
`;
  setDebug((d: any) => ({...d, apiInProgress: true, apiError: '', apiPrompt: prompt}));
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 60,
        temperature: 0.7,
      })
    });
    if (!res.ok) {
      const err = await res.text();
      setDebug((d: any) => ({...d, apiInProgress: false, apiError: err}));
      return '';
    }
    const data = await res.json();
    const result = data.choices?.[0]?.message?.content?.trim();
    // Determine response type
    let aiResponseType = '';
    if (result) {
      if (/\?$/.test(result.trim())) {
        aiResponseType = 'Clarifying Question';
      } else if (/^[A-Z][a-zA-Z\s\-']{1,40}$/.test(result.trim()) && !/\./.test(result.trim())) {
        aiResponseType = 'Direct Answer';
      } else {
        aiResponseType = 'Suggestion';
      }
    }
    setDebug((d: any) => ({...d, apiInProgress: false, lastAIResponse: result, apiError: '', aiResponseType }));
    return result;
  } catch (err: any) {
    setDebug((d: any) => ({...d, apiInProgress: false, apiError: String(err)}));
    return '';
  }
}

export function Editor({ note, setNote, className }: EditorProps) {
  const [isListening, setIsListening] = useState(false);
  const [micPosition, setMicPosition] = useState({ left: 0, top: 0 });
  const [showWhyBubble, setShowWhyBubble] = useState(false);
  const [whyBubblePos, setWhyBubblePos] = useState({ left: 0, top: 0 });
  const [whyHover, setWhyHover] = useState(false);
  const idleTimer = useRef<NodeJS.Timeout | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [smartBubble, setSmartBubble] = useState('');
  const [rollingContext, setRollingContext] = useState('');
  const [styleProfile, setStyleProfile] = useState(''); // You can set this from user profile or sample
  const [debug, setDebug] = useState({
    apiInProgress: false,
    apiError: '',
    lastAIResponse: '',
    apiPrompt: '',
    contextWordCount: 0,
    aiResponseType: '',
  });
  
  // Utility: Save/restore selection (for future programmatic changes)
  function saveSelection() {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      return sel.getRangeAt(0);
    }
    return null;
  }
  function restoreSelection(range: Range | null) {
    if (range) {
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }

  // Only update contentEditable when switching notes
  useEffect(() => {
    if (titleRef.current && note.title !== titleRef.current.textContent) {
      titleRef.current.textContent = note.title;
    }
    if (contentRef.current && note.content !== contentRef.current.innerHTML) {
      contentRef.current.innerHTML = note.content.replace(/\n/g, '<br>');
    }
  }, [note.id]);

  // Handle title/content blur to update state
  const handleTitleBlur = () => {
    setNote({ ...note, title: titleRef.current?.textContent || '' });
  };
  const handleContentBlur = () => {
    setNote({ ...note, content: contentRef.current?.innerHTML || '' });
  };

  // Handle clicking or selecting in the editor
  const handleEditorClick = () => {
    updateMicPosition();
  };

  // Update microphone button position (kept for future voice mode)
  const updateMicPosition = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (rect.left && rect.top) {
        const editorRect = editorRef.current?.getBoundingClientRect();
        if (editorRect) {
          setMicPosition({
            left: rect.left - editorRect.left,
            top: rect.top - editorRect.top
          });
        }
      }
    }
  };

  // Update rolling context on blur or input
  const updateRollingContext = () => {
    const content = contentRef.current?.innerText || '';
    const context = getLastTokens(content, MIN_TOKENS, MAX_TOKENS);
    setRollingContext(context);
    setDebug((d) => ({...d, contextWordCount: tokenize(context).length}));
  };

  // Smart bubble trigger logic
  const triggerSmartBubble = async () => {
    if (!rollingContext || tokenize(rollingContext).length < MIN_TOKENS) return;
    const suggestion = await fetchSmartBubble(rollingContext, styleProfile, setDebug);
    if (suggestion) setSmartBubble(suggestion);
    setShowWhyBubble(true);
  };

  // Handle user activity (typing, clicking, etc.)
  const resetIdleTimer = () => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    setShowWhyBubble(false);
    setSmartBubble('');
    updateRollingContext();
    // Only trigger if last char is punctuation or after 4s pause
    const content = contentRef.current?.innerText || '';
    const lastChar = content.trim().slice(-1);
    if (/[.!?]/.test(lastChar)) {
      updateWhyBubblePosition();
      triggerSmartBubble();
    } else {
      idleTimer.current = setTimeout(() => {
        updateWhyBubblePosition();
        triggerSmartBubble();
      }, 4000);
    }
  };

  // Listen for typing and selection changes
  useEffect(() => {
    const handleUserActivity = () => {
      resetIdleTimer();
    };
    document.addEventListener('keydown', handleUserActivity);
    document.addEventListener('mousedown', handleUserActivity);
    document.addEventListener('selectionchange', handleUserActivity);
    return () => {
      document.removeEventListener('keydown', handleUserActivity);
      document.removeEventListener('mousedown', handleUserActivity);
      document.removeEventListener('selectionchange', handleUserActivity);
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, []);

  // Update bubble position every time before showing
  function updateWhyBubblePosition() {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const editorRect = editorRef.current?.getBoundingClientRect();
      if (editorRect) {
        setWhyBubblePos({
          left: rect.right - editorRect.left + 8,
          top: rect.top - editorRect.top - 8
        });
      }
    }
  }

  // Add onInput handler to contentEditable divs
  function handleInput() {
    updateRollingContext();
    resetIdleTimer();
  }

  return (
    <div 
      ref={editorRef}
      className={cn(
        "relative h-full overflow-y-auto px-4 md:px-16 py-12",
        className
      )}
      onClick={handleEditorClick}
    >
      {/* Title */}
      <div 
        ref={titleRef}
        contentEditable
        className="notion-editor text-4xl font-bold mb-4 outline-none"
        data-placeholder="Untitled"
        onBlur={handleTitleBlur}
        suppressContentEditableWarning
        onInput={handleInput}
      />
      
      {/* Content */}
      <div 
        ref={contentRef}
        contentEditable
        className="notion-editor prose max-w-full"
        data-placeholder="Start writing..."
        onBlur={handleContentBlur}
        suppressContentEditableWarning
        onInput={handleInput}
      />
      
      {/* Why Bubble */}
      {showWhyBubble && (
        <div
          style={{
            position: 'absolute',
            left: whyBubblePos.left,
            top: whyBubblePos.top,
            background: '#2563eb',
            color: 'white',
            borderRadius: '16px',
            padding: '4px 10px',
            fontSize: '0.5rem',
            fontWeight: 300,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            display: 'flex',
            alignItems: 'center',
            zIndex: 1000,
            cursor: 'default',
            transition: 'opacity 0.2s',
            opacity: 1,
            gap: '8px',
            userSelect: 'none',
          }}
          onMouseEnter={() => setWhyHover(true)}
          onMouseLeave={() => setWhyHover(false)}
        >
          {smartBubble || 'Why?'}
          {whyHover && (
            <span
              style={{
                marginLeft: 8,
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '1.1em',
                opacity: 0.1,
              }}
              onClick={() => { setShowWhyBubble(false); setSmartBubble(''); }}
              title="Close"
            >
              ×
            </span>
          )}
        </div>
      )}
      
      {/* Mic button */}
      {/*
      <Button
        variant="ghost"
        size="sm"
        className="mic-button"
        style={{ 
          left: `${micPosition.left + 10}px`, 
          top: `${micPosition.top - 30}px`,
          display: window.getSelection()?.toString() ? 'flex' : 'none'
        }}
        onClick={(e) => {
          e.stopPropagation(); 
          toggleSpeechRecognition();
        }}
      >
        {isListening ? (
          <MicOff className="h-3.5 w-3.5 text-notion-accent" />
        ) : (
          <Mic className="h-3.5 w-3.5" />
        )}
      </Button>
      */}

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
      }}>
        <div><b>AI Debug Dashboard</b></div>
        <div>API in progress: {debug.apiInProgress ? 'Yes' : 'No'}</div>
        <div>Context words: {debug.contextWordCount}</div>
        <div>Last AI response: <span style={{color:'#38bdf8'}}>{debug.lastAIResponse}</span></div>
        <div>AI response type: <span style={{color:'#fbbf24'}}>{debug.aiResponseType}</span></div>
        <div>API error: <span style={{color:'#f87171'}}>{debug.apiError}</span></div>
        <div style={{marginTop:8}}><details><summary>Prompt</summary><pre style={{whiteSpace:'pre-wrap'}}>{debug.apiPrompt}</pre></details></div>
      </div>
    </div>
  );
}
