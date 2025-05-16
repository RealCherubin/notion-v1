import React from 'react';

interface CalendarInviteBubbleProps {
  what: string;
  when: string;
  who: string[];
  onSendInvites: () => void;
  onDismiss: () // Placeholder for a dismiss action, similar to other bubbles
}

const CalendarInviteBubble: React.FC<CalendarInviteBubbleProps> = ({
  what,
  when,
  who,
  onSendInvites,
  onDismiss
}) => {
  const bubbleStyle: React.CSSProperties = {
    backgroundColor: '#282828', // Dark background
    color: '#FFFFFF', // White text
    padding: '16px',
    borderRadius: '8px',
    fontFamily: 'Arial, sans-serif',
    width: '320px', // Approximate width from image
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '8px',
  };

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '16px',
    minWidth: '60px', // To align the input-like fields
  };

  const inputPillStyle: React.CSSProperties = {
    backgroundColor: '#404040', // Darker gray for input background
    padding: '6px 10px',
    borderRadius: '6px',
    fontSize: '14px',
    flexGrow: 1,
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  };
  
  const whoPillStyle: React.CSSProperties = {
    backgroundColor: '#505050', // Slightly lighter for individual names
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '14px',
  };

  const footerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '12px',
  };

  const calendarIconStyle: React.CSSProperties = {
    fontSize: '24px', // Placeholder for icon
    // In a real scenario, you'd use an SVG or icon font
    // For the image provided: white icon with a number 7 in a circle
    // This is a simplified placeholder
    backgroundColor: '#FFFFFF',
    color: '#000000',
    borderRadius: '50%',
    width: '30px',
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
  };

  const buttonStyle: React.CSSProperties = {
    backgroundColor: '#505050', // Button color from image
    color: '#FFFFFF',
    border: 'none',
    padding: '10px 16px',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
    fontWeight: 'bold',
  };

  return (
    <div style={bubbleStyle}>
      <div style={titleStyle}>Send calendar invite</div>

      <div style={rowStyle}>
        <div style={labelStyle}>What:</div>
        <div style={{...inputPillStyle, flexGrow: 1}}>{what}</div>
      </div>

      <div style={rowStyle}>
        <div style={labelStyle}>When:</div>
        <div style={{...inputPillStyle, flexGrow: 1}}>{when}</div>
      </div>

      <div style={rowStyle}>
        <div style={labelStyle}>Who:</div>
        <div style={inputPillStyle}>
          {who.map((person, index) => (
            <span key={index} style={whoPillStyle}>{person}</span>
          ))}
        </div>
      </div>

      <div style={footerStyle}>
        <div style={calendarIconStyle}>7</div> {/* Placeholder icon */}
        <button style={buttonStyle} onClick={onSendInvites}>
          Send invites
        </button>
      </div>
    </div>
  );
};

export default CalendarInviteBubble;

// Example Usage (for testing, not part of the component itself):
/*
<CalendarInviteBubble
  what="Discuss PR article increases."
  when="May 5, 2025"
  who={['Cherubin', 'Simon']}
  onSendInvites={() => console.log('Send Invites clicked')}
  onDismiss={() => console.log('Dismiss clicked')}
/>
*/ 