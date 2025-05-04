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
When giving an answer, always state the definitive answer first, with no filler or hedging. Never say things like 'as of my last knowledge' or 'I am an AI'. If the user asks a direct question, respond with the answer only (e.g., 'Joe Biden').

You are a writing assistant. Given the user's recent writing (below), detect uncertainty, topic shifts, or mistakes. 
If you detect uncertainty, topic shifts, or mistakes, offer one high-impact suggestion (grammar, factual cite, stylistic lift). 
If the user asks a question, always provide the most direct, likely answer based on the context, even if the input is ambiguous. Never ask the user to clarify; always make your best guess and state it directly.

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

// Bubble type for persistent bubbles
interface Bubble {
  id: string;
  position: { left: number; top: number };
  text: string;
  createdAt: number;
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
  const [expandedBubbleId, setExpandedBubbleId] = useState<string | null>(null);
  const [showBubbleModal, setShowBubbleModal] = useState(false);
  // Persistent bubbles state
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  // Add state to track last answered sentence and its bubble
  const [lastAnsweredSentence, setLastAnsweredSentence] = useState<string | null>(null);
  const [lastBubbleId, setLastBubbleId] = useState<string | null>(null);
  // Track all previously answered sentences
  const [answeredSentences, setAnsweredSentences] = useState<Set<string>>(new Set());
  // Add state to track which bubble is focused for keyboard actions
  const [focusedBubbleId, setFocusedBubbleId] = useState<string | null>(null);
  // Add a ref to throttle bubble creation
  const lastBubbleTimestamp = useRef<number>(0);
  // State for selection box and selected bubbles
  const [selectionBox, setSelectionBox] = useState<{startX: number, startY: number, endX: number, endY: number} | null>(null);
  const [selectedBubbleIds, setSelectedBubbleIds] = useState<Set<string>>(new Set());
  const selectionStartRef = useRef<{x: number, y: number} | null>(null);
  
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

  // Fallback unique id generator if uuid is not available
  function getUniqueId() {
    return (
      Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
    );
  }

  // Add a new bubble at the current cursor position with the suggestion text
  const addBubble = (text: string) => {
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
    setBubbles(prev => [
      ...prev,
      {
        id: getUniqueId(),
        position: { left, top },
        text,
        createdAt: Date.now(),
      }
    ]);
  };

  // Utility: Get the last complete sentence from the content
  function getLastSentence(text: string) {
    // Split by sentence-ending punctuation
    const sentences = text.match(/[^.!?\n]+[.!?\n]+/g);
    if (!sentences) return '';
    return sentences[sentences.length - 1].trim();
  }

  // Modified triggerSmartBubble to throttle bubble creation and ensure bubble is removed after insert
  const triggerSmartBubble = async () => {
    const now = Date.now();
    if (now - lastBubbleTimestamp.current < 5000) return; // Throttle: 1 bubble per 5s
    const content = contentRef.current?.innerText || '';
    const lastSentence = getLastSentence(content);
    if (!lastSentence || answeredSentences.has(lastSentence)) return;
    // Only answer if the sentence ends with a question mark or period/exclamation
    if (!/[.!?]$/.test(lastSentence)) return;
    // Use only the last sentence as context
    const suggestion = await fetchSmartBubble(lastSentence, styleProfile, setDebug);
    if (suggestion) {
      setSmartBubble(suggestion);
      setShowWhyBubble(true); // legacy fallback
      // Remove previous bubble if exists
      if (lastBubbleId) setBubbles(bs => bs.filter(b => b.id !== lastBubbleId));
      // Add new bubble
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
      const bubbleId = getUniqueId();
      setBubbles(prev => [
        ...prev,
        {
          id: bubbleId,
          position: { left, top },
          text: suggestion,
          createdAt: Date.now(),
        }
      ]);
      setLastAnsweredSentence(lastSentence);
      setLastBubbleId(bubbleId);
      setAnsweredSentences(prev => new Set(prev).add(lastSentence));
      lastBubbleTimestamp.current = now;
    }
  };

  // Remove bubble/context if user deletes or jumps to another sentence
  useEffect(() => {
    const handleContentChange = () => {
      const content = contentRef.current?.innerText || '';
      // Remove any answered sentences that are no longer present
      setAnsweredSentences(prev => {
        const newSet = new Set(Array.from(prev).filter(s => content.includes(s)));
        // If the last answered sentence is no longer present, remove bubble/context
        if (lastAnsweredSentence && !content.includes(lastAnsweredSentence)) {
          setLastAnsweredSentence(null);
          setSmartBubble('');
          setShowWhyBubble(false);
          if (lastBubbleId) setBubbles(bs => bs.filter(b => b.id !== lastBubbleId));
          setLastBubbleId(null);
        }
        return newSet;
      });
    };
    document.addEventListener('input', handleContentChange);
    return () => {
      document.removeEventListener('input', handleContentChange);
    };
  }, [lastAnsweredSentence, lastBubbleId]);

  // Update idle timer logic: pop bubble immediately after punctuation, or after 9s pause if no punctuation
  const resetIdleTimer = () => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    setShowWhyBubble(false);
    setSmartBubble('');
    updateRollingContext();
    // If last char is punctuation, pop bubble immediately
    const content = contentRef.current?.innerText || '';
    const lastChar = content.trim().slice(-1);
    if (/[.!?]/.test(lastChar)) {
      updateWhyBubblePosition();
      triggerSmartBubble();
    } else {
      idleTimer.current = setTimeout(() => {
        updateWhyBubblePosition();
        triggerSmartBubble();
      }, 9000); // 9 second pause
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

  // Utility to insert text at the current cursor position in the content editor
  function insertTextAtCursor(text: string) {
    const sel = window.getSelection();
    if (!sel || !contentRef.current) return;
    const range = sel.getRangeAt(0);
    range.deleteContents();
    range.insertNode(document.createTextNode(text));
    // Move cursor to end of inserted text
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
    // Update note content
    setNote({ ...note, content: contentRef.current.innerHTML });
  }

  // Listen for Tab key when a bubble is focused
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (focusedBubbleId && e.key === 'Tab') {
        e.preventDefault();
        const bubble = bubbles.find(b => b.id === focusedBubbleId);
        if (bubble) {
          insertTextAtCursor(bubble.text);
          // Remove the bubble after insertion and mark sentence as answered
          setBubbles(bs => bs.filter(b => b.id !== focusedBubbleId));
          setFocusedBubbleId(null);
          setAnsweredSentences(prev => new Set(prev).add(bubble.text));
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedBubbleId, bubbles, note]);

  // Mouse event handlers for selection box
  const handleEditorMouseDown = (e: React.MouseEvent) => {
    // Only start selection if not clicking on a bubble
    if ((e.target as HTMLElement).closest('.bubble')) return;
    selectionStartRef.current = { x: e.clientX, y: e.clientY };
    setSelectionBox({ startX: e.clientX, startY: e.clientY, endX: e.clientX, endY: e.clientY });
    setSelectedBubbleIds(new Set());
  };
  const handleEditorMouseMove = (e: React.MouseEvent) => {
    if (!selectionStartRef.current) return;
    setSelectionBox(box => box ? { ...box, endX: e.clientX, endY: e.clientY } : null);
  };
  const handleEditorMouseUp = () => {
    if (!selectionBox) return;
    // Calculate which bubbles are inside the selection box
    const minX = Math.min(selectionBox.startX, selectionBox.endX);
    const maxX = Math.max(selectionBox.startX, selectionBox.endX);
    const minY = Math.min(selectionBox.startY, selectionBox.endY);
    const maxY = Math.max(selectionBox.startY, selectionBox.endY);
    const editorRect = editorRef.current?.getBoundingClientRect();
    if (!editorRect) return setSelectionBox(null);
    const selected = new Set<string>();
    bubbles.forEach(bubble => {
      const bx = (bubble.position.left || 0) + (editorRect.left || 0);
      const by = (bubble.position.top || 0) + (editorRect.top || 0);
      // Assume bubble is 40x24px (approximate), adjust as needed
      const bw = 40, bh = 24;
      if (
        bx + bw > minX && bx < maxX &&
        by + bh > minY && by < maxY
      ) {
        selected.add(bubble.id);
      }
    });
    setSelectedBubbleIds(selected);
    setSelectionBox(null);
    selectionStartRef.current = null;
  };

  // Listen for Delete key to remove selected bubbles
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedBubbleIds.size > 0 && (e.key === 'Delete' || e.key === 'Backspace')) {
        setBubbles(bs => bs.filter(b => !selectedBubbleIds.has(b.id)));
        setSelectedBubbleIds(new Set());
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedBubbleIds]);

  // Render all persistent bubbles
  const renderBubbles = () => {
    // Track which bubble is being dragged
    const [draggedBubbleId, setDraggedBubbleId] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState<{x: number, y: number}>({x: 0, y: 0});

    // Mouse event handlers
    const handleMouseDown = (e: React.MouseEvent, bubble: Bubble) => {
      e.stopPropagation();
      setDraggedBubbleId(bubble.id);
      setDragOffset({
        x: e.clientX - bubble.position.left,
        y: e.clientY - bubble.position.top
      });
      document.body.style.userSelect = 'none';
    };

    useEffect(() => {
      if (draggedBubbleId) {
        const handleMouseMove = (e: MouseEvent) => {
          setBubbles(bs => bs.map(b =>
            b.id === draggedBubbleId
              ? { ...b, position: { left: e.clientX - dragOffset.x, top: e.clientY - dragOffset.y } }
              : b
          ));
        };
        const handleMouseUp = () => {
          setDraggedBubbleId(null);
          document.body.style.userSelect = '';
        };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('mouseup', handleMouseUp);
        };
      }
    }, [draggedBubbleId, dragOffset]);

    return (
      <>
        {bubbles.map(bubble => {
          const isExpanded = expandedBubbleId === bubble.id && !selectedBubbleIds.has(bubble.id) && draggedBubbleId !== bubble.id;
          const isSelected = selectedBubbleIds.has(bubble.id) && draggedBubbleId !== bubble.id;
          const isDragging = draggedBubbleId === bubble.id;
          return (
            <div
              key={bubble.id}
              className={`bubble${isSelected ? ' bubble-selected' : ''}`}
              tabIndex={0}
              style={{
                position: 'absolute',
                left: bubble.position.left,
                top: bubble.position.top,
                background: isDragging ? '#38bdf8' : isSelected ? '#f87171' : isExpanded ? '#333030' : '#b0b0b0',
                color: 'white',
                borderRadius: isExpanded ? '16px' : '50%',
                padding: isExpanded ? '4px 10px' : 0,
                width: isExpanded ? 'auto' : 12,
                height: isExpanded ? 'auto' : 12,
                minWidth: 0,
                minHeight: 0,
                maxWidth: isExpanded ? 'none' : 12,
                maxHeight: isExpanded ? 'none' : 12,
                fontSize: isExpanded ? '0.5rem' : 0,
                fontWeight: 300,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                cursor: isDragging ? 'grabbing' : 'grab',
                transition: 'all 0.18s cubic-bezier(.4,2,.6,1)',
                opacity: 1,
                gap: isExpanded ? '8px' : 0,
                userSelect: 'none',
                whiteSpace: isExpanded ? 'pre-wrap' : 'nowrap',
                overflow: isExpanded ? 'visible' : 'hidden',
                textOverflow: isExpanded ? 'clip' : 'clip',
                outline: isDragging ? '2px solid #38bdf8' : isSelected ? '2px solid #f87171' : 'none',
              }}
              onFocus={() => setExpandedBubbleId(bubble.id)}
              onBlur={() => setExpandedBubbleId(null)}
              onMouseDown={e => handleMouseDown(e, bubble)}
              onMouseEnter={() => setExpandedBubbleId(bubble.id)}
              onMouseLeave={() => setExpandedBubbleId(null)}
              onClick={e => { e.stopPropagation(); setExpandedBubbleId(bubble.id); setFocusedBubbleId(bubble.id); }}
            >
              {isExpanded && (
                <>
                  {(() => {
                    const words = (bubble.text || 'Why?').split(' ');
                    const isLong = words.length > 5;
                    const displayText = isExpanded || !isLong ? (bubble.text || 'Why?') : words.slice(0, 5).join(' ') + '...';
                    return <span style={isExpanded ? { color: 'white', opacity: 0.5 } : {}}>{displayText}</span>;
                  })()}
                  {/* Tab-to-insert hint */}
                  {focusedBubbleId === bubble.id && (
                    <span style={{ marginLeft: 8, color: '#b0b0b0', fontSize: '5px', fontWeight: 500 }}>
                      Press <kbd style={{background:'#222',padding:'2px 6px',borderRadius:3}}>Tab</kbd> to insert
                    </span>
                  )}
                  <span
                    style={{
                      marginLeft: 8,
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '1.1em',
                      opacity: 0.1,
                    }}
                    onClick={e => {
                      e.stopPropagation();
                      setBubbles(bs => bs.filter(b => b.id !== bubble.id));
                    }}
                    title="Close"
                  >
                    ×
                  </span>
                </>
              )}
            </div>
          );
        })}
        {/* Render selection box */}
        {selectionBox && (
          <div
            style={{
              position: 'fixed',
              left: Math.min(selectionBox.startX, selectionBox.endX),
              top: Math.min(selectionBox.startY, selectionBox.endY),
              width: Math.abs(selectionBox.endX - selectionBox.startX),
              height: Math.abs(selectionBox.endY - selectionBox.startY),
              background: 'rgba(56,189,248,0.15)',
              border: '1.5px dashed #38bdf8',
              zIndex: 2000,
              pointerEvents: 'none',
            }}
          />
        )}
      </>
    );
  };

  // Handle keydown events (placeholder)
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    // Add logic here if needed
  };

  return (
    <div 
      ref={editorRef}
      className={cn(
        "relative h-full overflow-y-auto px-4 md:px-16 py-12",
        className
      )}
      onClick={handleEditorClick}
      onMouseDown={handleEditorMouseDown}
      onMouseMove={selectionBox ? handleEditorMouseMove : undefined}
      onMouseUp={handleEditorMouseUp}
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
      
      {/* Why Bubble (legacy, fallback) */}
      {showWhyBubble && (
        <div
          style={{
            position: 'absolute',
            left: whyBubblePos.left,
            top: whyBubblePos.top,
            background: '#333030',
            color: 'white',
            borderRadius: '16px',
            padding: '4px 10px',
            fontSize: '0.5rem',
            fontWeight: 300,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            display: 'flex',
            alignItems: 'center',
            zIndex: 1000,
            cursor: 'pointer',
            transition: 'opacity 0.2s',
            opacity: 1,
            gap: '8px',
            userSelect: 'none',
            minWidth: 0,
            maxWidth: 'none',
            whiteSpace: isBubbleExpanded ? 'pre-wrap' : 'nowrap',
            overflow: isBubbleExpanded ? 'visible' : 'visible',
            textOverflow: isBubbleExpanded ? 'clip' : 'clip',
          }}
          onMouseEnter={() => setIsBubbleExpanded(true)}
          onMouseLeave={() => setIsBubbleExpanded(false)}
          onClick={e => { e.stopPropagation(); setIsBubbleExpanded(true); }}
        >
          {/* Bubble content: show max 5 words, expand to full on hover/click */}
          {(() => {
            const words = (smartBubble || 'Why?').split(' ');
            const isLong = words.length > 5;
            const displayText = isBubbleExpanded || !isLong ? (smartBubble || 'Why?') : words.slice(0, 5).join(' ') + '...';
            return <span
              style={isBubbleExpanded ? { color: 'white', opacity: 0.5 } : {}}
            >{displayText}</span>;
          })()}
          {whyHover && (
            <span
              style={{
                marginLeft: 8,
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '1.1em',
                opacity: 0.1,
              }}
              onClick={e => { e.stopPropagation(); setShowWhyBubble(false); setSmartBubble(''); setIsBubbleExpanded(false); }}
              title="Close"
            >
              ×
            </span>
          )}
        </div>
      )}
      {/* End legacy bubble code */}
      
      {/* Persistent Bubbles */}
      {renderBubbles()}
      
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
        <div style={{marginTop:8}}><details><summary>Bubbles</summary><pre style={{whiteSpace:'pre-wrap'}}>{JSON.stringify(bubbles, null, 2)}</pre></details></div>
      </div>
    </div>
  );
}
