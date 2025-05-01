
import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { cn } from '@/lib/utils';
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

export function Editor({ note, setNote, className }: EditorProps) {
  const [isListening, setIsListening] = useState(false);
  const [micPosition, setMicPosition] = useState({ left: 0, top: 0 });
  const editorRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
  // Check for SpeechRecognition API support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error("Speech recognition not supported in this browser");
      return;
    }
    
    // Initialize speech recognition
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    
    recognitionRef.current.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join('');
      
      // Insert text at cursor position
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const textNode = document.createTextNode(transcript);
        range.deleteContents();
        range.insertNode(textNode);
        
        // Move cursor to end of inserted text
        range.setStartAfter(textNode);
        range.setEndAfter(textNode);
        selection.removeAllRanges();
        selection.addRange(range);
        
        // Update note content
        if (selection.anchorNode?.parentElement === titleRef.current) {
          setNote({
            ...note,
            title: titleRef.current?.textContent || ''
          });
        } else if (contentRef.current?.contains(selection.anchorNode as Node)) {
          setNote({
            ...note,
            content: contentRef.current?.innerHTML || ''
          });
        }
      }
    };
    
    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
      toast.error('Microphone error. Please try again.');
    };
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Handle title updates
  const handleTitleChange = () => {
    if (titleRef.current) {
      setNote({
        ...note,
        title: titleRef.current.textContent || ''
      });
    }
  };

  // Handle content updates
  const handleContentChange = () => {
    if (contentRef.current) {
      setNote({
        ...note,
        content: contentRef.current.innerHTML
      });
    }
  };

  // Handle clicking or selecting in the editor
  const handleEditorClick = () => {
    updateMicPosition();
  };

  // Update microphone button position
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

  // Toggle speech recognition
  const toggleSpeechRecognition = () => {
    if (!recognitionRef.current) {
      toast.error('Speech recognition not supported in your browser');
      return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      toast.success('Voice input stopped');
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      toast.success('Voice input activated');
    }
  };

  // Set up event listeners for selection changes
  useEffect(() => {
    const handleSelectionChange = () => {
      updateMicPosition();
    };
    
    document.addEventListener('selectionchange', handleSelectionChange);
    
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, []);

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
        onInput={handleTitleChange}
        onBlur={handleTitleChange}
        dangerouslySetInnerHTML={{ __html: note.title }}
      />
      
      {/* Content */}
      <div 
        ref={contentRef}
        contentEditable
        className="notion-editor prose max-w-full"
        data-placeholder="Start writing..."
        onInput={handleContentChange}
        onBlur={handleContentChange}
        dangerouslySetInnerHTML={{ __html: note.content.replace(/\n/g, '<br>') }}
      />
      
      {/* Mic button */}
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
    </div>
  );
}
