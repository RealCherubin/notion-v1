
import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Editor } from './Editor';
import { cn } from '@/lib/utils';

interface NotepadLayoutProps {
  className?: string;
}

export function NotepadLayout({ className }: NotepadLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentNote, setCurrentNote] = useState({
    id: '1',
    title: 'Welcome to Notion-like',
    content: "This is your first note. Start typing to edit it.\n\nYou can use the microphone icon to dictate text."
  });
  
  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className={cn("flex h-screen w-full bg-notion-background", className)}>
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        toggleSidebar={toggleSidebar} 
        currentNoteId={currentNote.id}
        setCurrentNote={setCurrentNote}
      />
      <Editor 
        note={currentNote} 
        setNote={setCurrentNote}
        className={cn(
          "flex-1 transition-all duration-200",
          isSidebarCollapsed ? "ml-[60px]" : "ml-[250px]"
        )}
      />
    </div>
  );
}
