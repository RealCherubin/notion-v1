import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Editor } from '../editor/Editor';
import { cn } from '@/lib/utils';
import { FAKE_WORKSPACE_DATA } from '@/data/fakeWorkspaceData';

interface NotepadLayoutProps {
  className?: string;
}

export function NotepadLayout({ className }: NotepadLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  // Use the first page as the initial note
  const [currentNote, setCurrentNote] = useState(FAKE_WORKSPACE_DATA[0]);
  
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
