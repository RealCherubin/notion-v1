import React, { memo } from 'react';

// Props for the new BubbleItem component
export interface BubbleItemProps {
  bubble: {
    id: string;
    position: { left: number; top: number };
    text: string;
    createdAt: number;
    expanded: boolean;
    suggestionType?: string;
    actions?: Array<{ id: string; label: string; variant?: string }>;
  };
  isFocused: boolean;
  isSelected: boolean;
  isDragged: boolean;
  hoverProximityPadding: number;
  onBubbleMouseEnter: (bubbleId: string) => void;
  onBubbleMouseLeave: (bubbleId: string) => void;
  onBubbleClick: (bubbleId: string) => void;
  onBubbleFocus: (bubbleId: string) => void;
  onBubbleBlur: () => void;
  onBubbleDragStart: (e: React.MouseEvent, bubble: any) => void;
  onBubbleClose: (bubbleId: string) => void;
  onBubbleAction: (bubbleId: string, actionId: string) => void;
}

export const BubbleItem = memo<BubbleItemProps>(({ 
  bubble, 
  isFocused, 
  isSelected, 
  isDragged, 
  hoverProximityPadding,
  onBubbleMouseEnter,
  onBubbleMouseLeave,
  onBubbleClick,
  onBubbleFocus,
  onBubbleBlur,
  onBubbleDragStart,
  onBubbleClose,
  onBubbleAction
}) => {
  return (
    <div // Outer hover target
      key={`${bubble.id}-hover-target`}
      style={{
        position: 'absolute',
        left: bubble.position.left - (bubble.expanded ? 0 : hoverProximityPadding),
        top: bubble.position.top - (bubble.expanded ? 0 : hoverProximityPadding),
        width: bubble.expanded ? 'auto' : 12 + (hoverProximityPadding * 2),
        height: bubble.expanded ? 'auto' : 12 + (hoverProximityPadding * 2),
        zIndex: 999,
        cursor: 'pointer',
      }}
      onMouseEnter={() => onBubbleMouseEnter(bubble.id)}
      onMouseLeave={() => onBubbleMouseLeave(bubble.id)}
    >
      <div // Inner visible bubble
        key={bubble.id}
        className={`bubble${isSelected ? ' bubble-selected' : ''}`}
        tabIndex={0}
        style={{
          position: bubble.expanded ? 'relative' : 'absolute',
          left: bubble.expanded ? 0 : hoverProximityPadding,
          top: bubble.expanded ? 0 : hoverProximityPadding,
          background: isSelected ? '#f87171' : bubble.expanded ? '#333030' : '#b0b0b0',
          color: 'white',
          borderRadius: bubble.expanded ? '16px' : '50%',
          padding: bubble.expanded ? '8px 12px' : 0,
          width: bubble.expanded ? 'auto' : 12,
          height: bubble.expanded ? 'auto' : 12,
          minWidth: bubble.expanded ? '160px' : 12,
          maxWidth: bubble.expanded ? '380px' : 12,
          display: bubble.expanded ? 'flex' : 'block',
          flexDirection: bubble.expanded ? 'column' : undefined,
          alignItems: bubble.expanded ? 'stretch' : undefined,
          justifyContent: bubble.expanded ? 'flex-start' : undefined,
          gap: bubble.expanded ? '8px' : 0,
          fontSize: bubble.expanded ? '0.6rem' : 0,
          fontWeight: 300,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          zIndex: 1000,
          cursor: isDragged ? 'grabbing' : 'grab',
          transition: 'all 0.18s cubic-bezier(.4,2,.6,1)',
          opacity: 1,
          userSelect: 'none',
          whiteSpace: bubble.expanded ? 'pre-wrap' : 'nowrap',
          overflow: 'visible',
          textOverflow: 'clip',
          outline: isFocused ? '2px solid #38bdf8' : isSelected ? '2px solid #f87171' : 'none',
        }}
        onFocus={() => onBubbleFocus(bubble.id)}
        onBlur={onBubbleBlur}
        onMouseDown={e => onBubbleDragStart(e, bubble)}
        onClick={e => { e.stopPropagation(); onBubbleClick(bubble.id); }}
      >
        {bubble.expanded && (
          <>
            <div style={{ 
              display: 'flex', 
              alignItems: 'flex-start',
              width: '100%', 
              justifyContent: 'space-between',
            }}>
              {(() => {
                const displayText = bubble.text || 'Why?'; 
                return <span style={{ 
                  color: 'white', 
                  opacity: 0.9,
                  flexGrow: 1, 
                  marginRight: '10px',
                  fontSize: '0.65rem'
                }}>{displayText}</span>;
              })()}
              <span
                style={{
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '1.2em',
                  opacity: 0.3,
                  padding: '0px 2px',
                  lineHeight: '1',
                  alignSelf: 'flex-start',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.3')}
                onClick={e => {
                  e.stopPropagation();
                  onBubbleClose(bubble.id);
                }}
                title="Close"
              >
                ×
              </span>
            </div>
            {isFocused && !bubble.actions?.length && (
              <span style={{ marginTop: '4px', color: '#b0b0b0', fontSize: '10px', fontWeight: 500, alignSelf: 'flex-start' }}>
                Press <kbd style={{background:'#222',padding:'2px 6px',borderRadius:3}}>Tab</kbd> to insert
              </span>
            )}
            {bubble.actions && bubble.actions.length > 0 && (
              <div style={{ 
                display: 'flex', 
                gap: '8px', 
                flexWrap: 'wrap', 
                width: '100%',
                justifyContent: 'flex-start',
              }}>
                {bubble.actions.map(action => (
                  <button
                    key={action.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onBubbleAction(bubble.id, action.id);
                    }}
                    style={{
                      background: action.variant === 'primary' ? '#38bdf8' : '#555',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '5px 10px',
                      fontSize: '0.65rem',
                      cursor: 'pointer',
                      opacity: 0.9,
                      minWidth: '45px',
                      textAlign: 'center',
                      lineHeight: '1.2',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.9')}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
});
BubbleItem.displayName = 'BubbleItem'; 