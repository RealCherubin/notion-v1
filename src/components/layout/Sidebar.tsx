
import React from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  PlusCircle, 
  Search, 
  File,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface Note {
  id: string;
  title: string;
  content: string;
}

interface SidebarProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  currentNoteId: string;
  setCurrentNote: (note: Note) => void;
}

export function Sidebar({ isCollapsed, toggleSidebar, currentNoteId, setCurrentNote }: SidebarProps) {
  // Mock data for notes
  const sampleNotes: Note[] = [
    { id: '1', title: 'Welcome to Notion-like', content: "This is your first note. Start typing to edit it.\n\nYou can use the microphone icon to dictate text." },
    { id: '2', title: 'Meeting notes', content: "Team meeting agenda:\n- Project updates\n- Upcoming deadlines\n- Questions" },
    { id: '3', title: 'Ideas', content: "New project ideas:\n1. Mobile app\n2. Desktop integration\n3. Voice commands" },
  ];

  return (
    <div 
      className={cn(
        "fixed top-0 left-0 h-full bg-notion-sidebarBackground border-r border-notion-sidebarBorder transition-all duration-200 z-10",
        isCollapsed ? "w-[60px]" : "w-[250px]"
      )}
    >
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-notion-sidebarBorder">
          {!isCollapsed && (
            <span className="font-medium">Notion-like</span>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0" 
            onClick={toggleSidebar}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
        
        {/* Search */}
        {!isCollapsed && (
          <div className="p-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-notion-hover rounded-md">
              <Search className="h-3.5 w-3.5 text-notion-lightText" />
              <span className="text-sm text-notion-lightText">Search</span>
            </div>
          </div>
        )}
        
        {/* Quick Links */}
        <div className="mt-2 px-1">
          {isCollapsed ? (
            <div className="flex flex-col items-center gap-4 py-3">
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <PlusCircle className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Search className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Clock className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="sidebar-note-item">
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="text-sm">New page</span>
              </div>
              <div className="sidebar-note-item">
                <Clock className="h-3.5 w-3.5" />
                <span className="text-sm">Recent</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Pages */}
        <div className="mt-4 flex-1 overflow-y-auto px-1">
          <div className="flex items-center justify-between px-3 py-1">
            {!isCollapsed && <span className="text-xs font-medium text-notion-lightText">PAGES</span>}
            {!isCollapsed && (
              <Button variant="ghost" size="icon" className="h-4 w-4 p-0">
                <PlusCircle className="h-3.5 w-3.5 text-notion-lightText" />
              </Button>
            )}
          </div>
          
          <div className="mt-1">
            {sampleNotes.map((note) => (
              <div 
                key={note.id}
                className={cn(
                  "sidebar-note-item",
                  note.id === currentNoteId && "bg-notion-hover font-medium"
                )}
                onClick={() => setCurrentNote(note)}
              >
                {isCollapsed ? (
                  <File className="h-4 w-4" />
                ) : (
                  <>
                    <File className="h-3.5 w-3.5 shrink-0" />
                    <span className="text-sm truncate">{note.title}</span>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
