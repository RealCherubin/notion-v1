import React, { useEffect, useRef, useState, memo } from 'react';
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

// ** BEGIN Phase 3 Changes: fakeDocContent and performDocumentSearch **
// Moved fakeDocContent to module scope
const FAKE_DOC_CONTENT_Q3_PLAN = `
1. Revenue & Incentive Structure
Revenue Targets for April
₹35L (₹3,500,000)
₹40L (₹4,000,000)
₹45L (₹4,500,000)

Revenue Contribution per Employee & Task Allocation
Raj (Video & Photo Production) - ₹11,55,000 Revenue Responsibility (33%)
Primary Tasks: UGC Ads, Doctor Ads, Meta Ad Creatives
Key Focus: High-converting ad creatives to drive ROAS & reduce CAC
Saran (Video & Content Strategy) - ₹3,50,000 Revenue Responsibility (10%)
Primary Tasks: Doctor Collaborations, Bundle Visuals, Educational Content
Key Focus: PDP improvement, in-house educational videos, driving AOV
Yamini (Influencer & PR) - ₹5,95,000 Revenue Responsibility (17%)
Primary Tasks: Influencer Partnerships, PR Outreach, UGC Scaling
Key Focus: Lower CAC through organic growth & influencer-driven ads
Vijay (Ad Budget & ROAS Optimization) - ₹6,30,000 Revenue Responsibility (18%)
Primary Tasks: Budget Optimization, ROAS Scaling, Campaign Adjustments
Key Focus: High-ROAS ad scaling & bid strategy to maximize conversions
Kishore (Web Performance & SEO) - ₹2,45,000 Revenue Responsibility (7%)
Primary Tasks: Site Speed Optimization, PDP & Checkout UX, SEO Automation
Key Focus: Reducing bounce rate, improving conversions, growing organic traffic
Reegan (COD & Payment Optimization) - ₹5,80,000 Revenue Responsibility (8%)
Primary Tasks: COD AI Verification, Prepaid Conversions, Payment Fixes
Key Focus: Reducing COD failures & improving prepaid order volume
Kannan (Retention & Email Marketing) - ₹1,75,000 Revenue Responsibility (5%)
Primary Tasks: Email Flows, WhatsApp Retargeting, Repeat Purchase Automation
Key Focus: Increasing retention, growing lifetime value, boosting repeat orders

3. KPIs for Each Employee
Employee ROAS Target Sales Target CAC Target
Raj 2.8+ ₹11,55,000 Reduce CAC by 5-10%
Saran 2.5+ ₹3,50,000 Increase conversion rate by 5%
Yamini 3.0+ ₹5,95,000 Reduce influencer CAC by 10%
Vijay 3.2+ ₹6,30,000 Reduce CAC by 10%
Kishore Improve UX ₹2,45,000 Reduce bounce rate below 40%
Reegan N/A ₹2,80,000 Reduce COD cancellations by 15%
Kannan 5.0+ ₹1,75,000 Increase repeat purchase rate by 10%

4. Task Execution & Timeline
Task Owner Start Date End Date Revenue % Contribution
Plan & shoot 10+ influencer video assets Raj March 10 March 17 18%
Develop 10+ A/B tested ad variations Raj March 15 March 22 15%
Work with doctor collaborations for content Saran March 10 March 20 10%
Design in-house video content for Doctor Towels Saran March 15 March 30 10%
Identify & secure high-performing UGC influencers Yamini March 5 March 20 12%
Execute outreach for Forbes, Business Insider, LBB Yamini March 10 April 10 5%
Optimize budget allocation for Meta Ads Vijay March 10 March 22 18%
Identify bottlenecks & optimize website speed Kishore March 10 March 22 7%
Test & integrate AI-based COD verification tools Reegan March 10 March 25 8%
Automate abandoned cart & repeat purchase flows Kannan March 15 April 5 5%

5. Final Next Steps
Implement tracking system → Assign incentives & performance tracking based on revenue contribution.
Align incentives with KPI achievement → Bonus payouts based on sales targets & efficiency metrics.
Monitor execution weekly → Ensure all employees are meeting their deliverables within the set deadlines.
Prepare structured reporting → Weekly reports on ROAS, CAC, and revenue progress to keep accountability.

This summary finalizes revenue responsibility, execution timelines, and KPI-driven performance goals for each team member.
Total Incentive Pool (1% of Revenue)
₹35,000 at ₹35L
₹40,000 at ₹40L
₹45,000 at ₹45L
Individual Incentive Per Employee (Divided Equally Among 7 Members)
₹5,000 at ₹35L
₹5,714 at ₹40L
₹6,428 at ₹45L

2.(classified)
`;

const Q3_DOC_TITLE = 'Q3 Action Plan: Start, Scale, Stop';
const Q3_DOC_LINK = 'https://docs.google.com/document/d/1GAF017m6sUyvpy0bX9U7VNwWSWb4b7Uu5GTAqfuEHAQ/edit?usp=sharing';

async function performDocumentSearch(searchQuery: string, documentTitle: string): Promise<string> {
  console.log(`Simulating document search for query: "${searchQuery}" in doc: "${documentTitle}"`);
  if (documentTitle === Q3_DOC_TITLE) {
    // For now, ignore searchQuery and return the full fake content for the specific document
    // In a real scenario, this would fetch and filter based on the query
    return FAKE_DOC_CONTENT_Q3_PLAN;
  }
  return `Content for document "${documentTitle}" not found.`;
}
// ** END Phase 3 Changes **

function tokenize(text: string) {
  return text.split(/\s+/);
}

function getLastTokens(text: string, minTokens: number, maxTokens: number) {
  const tokens = tokenize(text);
  const count = Math.max(minTokens, Math.min(tokens.length, maxTokens));
  return tokens.slice(-count).join(' ');
}

// Utility: Get recent context (e.g., last 150 words)
function getRecentContext(text: string, wordLimit: number = 150): string {
  const words = text.split(/\s+/); // Split by whitespace
  const count = Math.min(words.length, wordLimit);
  return words.slice(-count).join(' ');
}

// Utility: Get structured recent context (current & previous paragraphs)
function getStructuredContext(fullText: string): { currentParagraph: string; previousParagraph: string } {
  // Simple paragraph split by double newline (adjust regex if needed for single newlines or other separators)
  const paragraphs = fullText.split(/\n\s*\n+/);
  const currentParagraph = paragraphs[paragraphs.length - 1]?.trim() || '';
  const previousParagraph = paragraphs[paragraphs.length - 2]?.trim() || '';
  return { currentParagraph, previousParagraph };
}

// Update fetchSmartBubble: Add specific simulated Doc content
async function fetchSmartBubble(
  currentParagraph: string, 
  previousParagraph: string, 
  styleProfile: string, 
  setDebug: any
): Promise<{suggestion: string, aiResponseType: string}> {
  const apiKey = getOpenAIApiKey();
  if (!apiKey) {
      setDebug((d: any) => ({...d, apiError: 'OpenAI API Key not found. Please set VITE_OPENAI_API_KEY in your .env file.'}));
      return { suggestion: '', aiResponseType: '' };
  }

  const pseudoSearchQuery = currentParagraph.substring(0, 75) + (previousParagraph ? " | " + previousParagraph.substring(0,75) : "");
  const retrievedDocContent = await performDocumentSearch(pseudoSearchQuery, Q3_DOC_TITLE);

  // Refined Prompt v7: Proactive suggestions and action focus
  const prompt = `
# ROLE & GOAL
You are an exceptionally perceptive and concise ambient Chief of Staff integrated into a document editor. Your goal is to subtly enhance the user's writing and workflow by anticipating needs. Offer high-value suggestions, answers, or *actionable insights* based on the user's writing context AND relevant information retrieved from their knowledge base documents. Prioritize quality, relevance, and proactivity. If no truly valuable suggestion emerges, output nothing.

# KNOWLEDGE BASE
*   You have access to a document titled: ${Q3_DOC_TITLE} (${Q3_DOC_LINK}).
*   Based on the current context, the following relevant information has been **retrieved** from this document (simulating a search query: "${pseudoSearchQuery.substring(0,100)}..."):
    \`\`\`
    ${retrievedDocContent || "No specific information retrieved or document not found."}
    \`\`\`

# CORE INSTRUCTIONS
1.  **Deep Context Analysis:** Analyze CURRENT_PARAGRAPH and PREVIOUS_PARAGRAPH, checking for relevance to the RETRIEVED KNOWLEDGE BASE content and looking for implied needs or tasks.
2.  **Prioritize Contextual & Proactive Help:** Focus suggestions on:
    *   **Answering Questions:** Synthesize information from editor context AND RETRIEVED KNOWLEDGE BASE. Base answers *strictly* on these texts. Infer meaning.
    *   **Connecting Ideas:** Suggest linking to ${Q3_DOC_TITLE} if context discusses topics in its RETRIEVED CONTENT.
    *   **Clarity/Conciseness/Flow:** Offer high-impact writing improvements.
    *   **Proactive Action Identification:** If the user's text implies a task, a need for communication (e.g., email, meeting), a reminder, or a section that could be summarized, *proactively suggest an action*. Formulate these clearly.
        *   Example User Text: "Need to remind Sarah about the report deadline next Monday."
        *   Your Suggestion: "[Action?] Remind Sarah: report deadline next Monday."
        *   Example User Text: "Let's discuss the budget with the finance team."
        *   Your Suggestion: "[Action?] Schedule meeting: Discuss budget with finance team."
3.  **Suggestion Criteria & Format:** 
    *   Concise (under 20 words), relevant, actionable.
    *   **Prefixes are CRITICAL for parsing:** 
        *   \`[Answer]\` for direct answers.
        *   \`[Link Doc?]\` for document linking suggestions.
        *   \`[Clarity]\` for direct text improvement suggestions (e.g., "[Clarity] Consider rephrasing to: ...").
        *   \`[Flow]\` for structural or logical flow advice.
        *   \`[Action?]\` for actionable tasks, reminders, meeting suggestions.
        *   \`[Summary?]\` if offering to summarize a section.
        *   \`[DraftEmail?]\` if offering to help draft an email based on context.
    *   Limit 1 suggestion per trigger.
4.  **Confidence/Silence:** Only respond if confident the suggestion is valuable and directly grounded in editor context or RETRIEVED KNOWLEDGE BASE. Otherwise, OUTPUT NOTHING.
5.  **Style:** Match USER_STYLE_PROFILE.

# Editor Context Provided:
USER_STYLE_PROFILE: ${styleProfile || 'neutral'}
PREVIOUS_PARAGRAPH:
---
${previousParagraph || '(No previous paragraph provided)'}
---
CURRENT_PARAGRAPH:
---
${currentParagraph}
---
`;

  console.log('>>> Attempting API call with RETRIEVED Doc knowledge prompt (Phase 3.1 - Proactive).');
  setDebug((d: any) => ({...d, apiInProgress: true, apiError: '', apiPrompt: prompt}));
  let finalResultText = '';
  let finalAiResponseType = 'Suggestion'; // Default

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
        max_tokens: 80, 
        temperature: 0.5, 
        top_p: 0.9,
      })
    });

    if (!res.ok) throw new Error(`OpenAI Error ${res.status}: ${await res.text()}`);
    
    const data = await res.json();
    finalResultText = data.choices?.[0]?.message?.content?.trim() || '';
    console.log('LLM Response:', finalResultText);

    if (finalResultText) {
       if (/^\\[Answer\\]/.test(finalResultText)) finalAiResponseType = 'Direct Answer';
       else if (/^\\[Link Doc\\?\\]/.test(finalResultText)) finalAiResponseType = 'Doc Link Suggestion';
       else if (/^\\[Summary\\?\\]/.test(finalResultText)) finalAiResponseType = 'Summary';
       else if (/^\\[Action\\?\\]/.test(finalResultText)) finalAiResponseType = 'Action Item';
       else if (/^\\[Clarity\\]/.test(finalResultText)) finalAiResponseType = 'Clarity';
       else if (/^\\[Flow\\]/.test(finalResultText)) finalAiResponseType = 'Flow';
       else if (/^\\[DraftEmail\\?\\]/.test(finalResultText)) finalAiResponseType = 'Draft Email';
    }
    setDebug((d: any) => ({...d, apiInProgress: false, lastAIResponse: finalResultText, apiError: '', aiResponseType: finalAiResponseType }));
    return { suggestion: finalResultText, aiResponseType: finalAiResponseType };

  } catch (err: any) {
    console.error('Error in fetchSmartBubble flow:', err);
    setDebug((d: any) => ({...d, apiInProgress: false, apiError: `Error: ${String(err.message || err)}`}));
    return { suggestion: '', aiResponseType: '' };
  }
}

// Bubble type for persistent bubbles
interface ActionButton {
  id: string; // e.g., 'ADD_TODO', 'DRAFT_EMAIL_CLIENT_UPDATE'
  label: string; // e.g., "Add to Todo", "Draft Email"
  // Optional: 'primary', 'secondary' for styling
  variant?: 'primary' | 'secondary' | 'destructive'; 
}

interface Bubble {
  id: string;
  position: { left: number; top: number };
  text: string; // The main suggestion text
  createdAt: number;
  expanded: boolean;
  suggestionType?: string; // e.g., 'ActionItem', 'Clarity', 'SummaryOffer'
  actions?: ActionButton[]; // Array of action buttons for this bubble
}

// Props for the new BubbleItem component
interface BubbleItemProps {
  bubble: Bubble;
  isFocused: boolean;
  isSelected: boolean;
  isDragged: boolean;
  hoverProximityPadding: number;
  onBubbleMouseEnter: (bubbleId: string) => void;
  onBubbleMouseLeave: (bubbleId: string) => void;
  onBubbleClick: (bubbleId: string) => void; // For focus and ensuring expansion
  onBubbleFocus: (bubbleId: string) => void;
  onBubbleBlur: () => void;
  onBubbleDragStart: (e: React.MouseEvent, bubble: Bubble) => void;
  onBubbleClose: (bubbleId: string) => void;
  onBubbleAction: (bubbleId: string, actionId: string) => void; // New prop for actions
}

const BubbleItem = memo<BubbleItemProps>(({ 
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
BubbleItem.displayName = 'BubbleItem'; // For better debugging in React DevTools

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
  const [isBubbleExpanded, setIsBubbleExpanded] = useState(false);
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
  const [draggedBubbleId, setDraggedBubbleId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{x: number, y: number}>({x: 0, y: 0});
  const collapseTimersRef = useRef<Record<string, NodeJS.Timeout>>({});
  const hoverProximityPadding = 10;
  
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

  // Modified addBubble to accept only one argument
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

    let actions: ActionButton[] = [
      { id: 'DISMISS', label: 'Dismiss', variant: 'secondary' }
    ];

    if (suggestionType === 'Action Item' || text.startsWith('[Action?]')) {
      actions.unshift({ id: 'ADD_TODO', label: 'Add To-Do', variant: 'primary' });
      // We could add more specific actions here based on text parsing later
    }
    if (suggestionType === 'Clarity' || text.startsWith('[Clarity]')){
      actions.unshift({id: 'APPLY_SUGGESTION', label: 'Apply Edit', variant: 'primary' });
    }
    // Add more conditions for other suggestionTypes like 'Doc Link Suggestion', 'Summary', etc.

    const newBubble: Bubble = {
        id: getUniqueId(),
        position: { left, top },
        text,
        createdAt: Date.now(),
        expanded: false,
      suggestionType,
      actions,
    };
    setBubbles(prev => [...prev, newBubble]);
    return newBubble.id; // Return the new bubble's ID
  };

  // Utility: Get the last complete sentence from the content
  function getLastSentence(text: string) {
    // Split by sentence-ending punctuation
    const sentences = text.match(/[^.!?\n]+[.!?\n]+/g);
    if (!sentences) return '';
    return sentences[sentences.length - 1].trim();
  }

  // Modified triggerSmartBubble: Remove performDocumentSearch param
  const triggerSmartBubble = async (triggeredByTimer: boolean = false) => {
    console.log(`triggerSmartBubble called. triggeredByTimer: ${triggeredByTimer}`);
    const now = Date.now();
    if (now - lastBubbleTimestamp.current < 5000) { // 5-second global cooldown
        console.log(`Bubble trigger throttled. Wait ${5000 - (now - lastBubbleTimestamp.current)}ms`); 
        return;
    }

    const fullContent = contentRef.current?.innerText || '';
    const { currentParagraph, previousParagraph } = getStructuredContext(fullContent);
    const lastSentence = getLastSentence(currentParagraph); 
    
    console.log(`Triggering Sentence: "${lastSentence}"`);
    console.log(`Current Para Snippet: "${currentParagraph.substring(0, 100)}..."`);
    console.log(`Previous Para Snippet: "${previousParagraph.substring(0, 100)}..."`);

    if (!lastSentence) {
        console.log('No valid last sentence found for trigger. Exiting.');
        return;
    }
    // Allow re-triggering for the same sentence if the previous bubble was dismissed/actioned.
    // The answeredSentences set is now more about preventing immediate re-fire for an active, non-interacted bubble.
    // If a bubble tied to 'lastSentence' still exists, don't re-trigger.
    const existingBubbleForSentence = bubbles.find(b => b.text.includes(lastSentence) || (lastAnsweredSentence === lastSentence && b.id === lastBubbleId));
    if (existingBubbleForSentence && !answeredSentences.has(lastSentence)) {
      console.log('A bubble for this sentence context might still be active or was recently active. Exiting.');
      return;
    }
    
    // If the sentence was explicitly answered by inserting text, don't re-trigger immediately.
    if (answeredSentences.has(lastSentence)) {
        console.log('Triggering sentence was recently acted upon (e.g., inserted). Exiting. Answered:', answeredSentences);
        return;
    }

    const endsWithPunctuation = /[.!?]$/.test(lastSentence.trim());
    console.log(`Ends with punctuation (.!?): ${endsWithPunctuation}`);

    // Keyword detection - Phase 3.2
    const keywords = ['task:', 'follow up', 'schedule', 'meeting', 'deadline', 'assign to', 'remember to', 'summarize', 'draft an email', 'question about'];
    const foundKeyword = keywords.some(kw => currentParagraph.toLowerCase().includes(kw.toLowerCase()));

    if (!triggeredByTimer && !endsWithPunctuation && !foundKeyword) {
        console.log('Punctuation/Keyword check failed (and not triggered by timer). Exiting trigger.');
        return;
    }
    if (triggeredByTimer && !foundKeyword && !endsWithPunctuation) {
        // If timer-triggered, still be a bit more lenient but prefer some signal
        console.log('Timer trigger, but no strong signal (punctuation/keyword). Exiting.');
        return;
    }
    
    console.log('>>> All checks passed. Calling fetchSmartBubble with structured context...');
    const { suggestion, aiResponseType } = await fetchSmartBubble(
        currentParagraph, 
        previousParagraph, 
        styleProfile, 
        setDebug
    ); // fetchSmartBubble now returns an object
    
    if (suggestion) {
      // setSmartBubble(suggestion); // Legacy, consider removing
      // setShowWhyBubble(true); // Legacy, consider removing
      // if (lastBubbleId) setBubbles(bs => bs.filter(b => b.id !== lastBubbleId)); // Old logic, new addBubble handles this better
      
      const newBubbleId = addBubble(suggestion, aiResponseType);
      setLastBubbleId(newBubbleId); // Keep track of the latest bubble added
      
      setLastAnsweredSentence(lastSentence); // Mark this sentence context as having a bubble
      // Don't add to answeredSentences here. Add it when an action *confirms* the suggestion (like insert or explicit dismiss for re-trigger prevention)
      lastBubbleTimestamp.current = now;
      console.log('Bubble added and timestamp updated.');
    } else {
      console.log('No suggestion returned from API.');
    }
  };

  // Bubble interaction handlers to be passed to BubbleItem
  const handleBubbleMouseEnter = (bubbleId: string) => {
    if (collapseTimersRef.current[bubbleId]) {
      clearTimeout(collapseTimersRef.current[bubbleId]);
      delete collapseTimersRef.current[bubbleId];
    }
    setBubbles(bs => bs.map(b => b.id === bubbleId ? { ...b, expanded: true } : b));
  };

  const handleBubbleMouseLeave = (bubbleId: string) => {
    collapseTimersRef.current[bubbleId] = setTimeout(() => {
      setBubbles(bs => bs.map(b => b.id === bubbleId ? { ...b, expanded: false } : b));
    }, 300); // 300ms delay before collapsing
  };

  const handleBubbleClick = (bubbleId: string) => {
    setFocusedBubbleId(bubbleId);
    if (collapseTimersRef.current[bubbleId]) {
      clearTimeout(collapseTimersRef.current[bubbleId]);
      delete collapseTimersRef.current[bubbleId];
    }
    setBubbles(bs => bs.map(b => b.id === bubbleId ? { ...b, expanded: true } : b));
  };

  const handleBubbleFocus = (bubbleId: string) => setFocusedBubbleId(bubbleId);
  const handleBubbleBlur = () => setFocusedBubbleId(null);

  const handleBubbleDragStart = (e: React.MouseEvent, bubble: Bubble) => {
    e.stopPropagation();
    setDraggedBubbleId(bubble.id);
    setDragOffset({ x: e.clientX - bubble.position.left, y: e.clientY - bubble.position.top });
    document.body.style.userSelect = 'none';
  };

  const handleBubbleClose = (bubbleId: string) => {
    setBubbles(bs => bs.filter(b => b.id !== bubbleId));
    if (focusedBubbleId === bubbleId) setFocusedBubbleId(null);
    // Also remove from answeredSentences if it was tied to a specific sentence for re-triggering later if needed
    // This part depends on how strictly we tie bubbles to sentences for the answeredSentences set
  };

  // Effect for dragged bubble (moved from renderBubbles)
  useEffect(() => {
    if (!draggedBubbleId) return;
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
  }, [draggedBubbleId, dragOffset, setBubbles]); // Added setBubbles to dependency array

  // Cleanup collapse timers on unmount
  useEffect(() => {
    return () => {
      Object.values(collapseTimersRef.current).forEach(clearTimeout);
    };
  }, []);

  // **Re-add the missing insertTextAtCursor function**
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
    // Need access to `note` and `setNote` if they are not global
    // Assuming they are available in this scope as props
    setNote({ ...note, content: contentRef.current.innerHTML }); 
  }

  // Tab key listener (should now find insertTextAtCursor)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (focusedBubbleId && e.key === 'Tab') {
        e.preventDefault();
        const bubble = bubbles.find(b => b.id === focusedBubbleId);
        if (bubble) {
          insertTextAtCursor(bubble.text); // This call should now work
          const bubbleTextForAnsweredSet = bubble.text; 
          setBubbles(bs => bs.filter(b => b.id !== focusedBubbleId));
          setFocusedBubbleId(null);
          setAnsweredSentences(prev => new Set(prev).add(bubbleTextForAnsweredSet)); 
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedBubbleId, bubbles, note, setNote]); // Added setNote dependency since insertTextAtCursor calls it

  // Fix content change listener: Correctly update answeredSentences set
  useEffect(() => {
    const handleContentChange = () => {
      const content = contentRef.current?.innerText || '';
      // Remove any answered sentences that are no longer present
      setAnsweredSentences(prev => {
        const currentAnswered = Array.from(prev);
        const stillPresent = currentAnswered.filter(s => content.includes(s));
        // If the last answered triggering sentence is no longer present, clear its bubble
        if (lastAnsweredSentence && !content.includes(lastAnsweredSentence)) {
          if (lastBubbleId) {
            setBubbles(bs => bs.filter(b => b.id !== lastBubbleId));
            setLastBubbleId(null); // Clear the ID of the removed bubble
          }
          setLastAnsweredSentence(null); // Clear the sentence itself
          // Don't modify the main answeredSentences set here based on lastAnsweredSentence,
          // it's handled by the filter above.
        }
        return new Set(stillPresent); // Return the new set
      });
    };
    // Use event listener on the contentRef for better targeting
    const contentEl = contentRef.current;
    contentEl?.addEventListener('input', handleContentChange);
    return () => {
      contentEl?.removeEventListener('input', handleContentChange);
    };
  }, [lastAnsweredSentence, lastBubbleId]); // Dependencies look reasonable now

  // Listen for Delete key to remove selected bubbles
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete') {
        e.preventDefault();
        if (selectedBubbleIds.size > 0) {
          const selectedBubbles = Array.from(selectedBubbleIds);
          setBubbles(bs => bs.filter(b => !selectedBubbleIds.has(b.id)));
          setSelectedBubbleIds(new Set());
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedBubbleIds, setBubbles]);

  // Listen for typing and selection changes for idle timer
  useEffect(() => {
    if (idleTimer.current) {
      clearTimeout(idleTimer.current);
    }
    idleTimer.current = setTimeout(() => {
      updateRollingContext();
    }, 5000);
    return () => {
      clearTimeout(idleTimer.current);
    };
  }, []);

  // Add onInput handler to contentEditable divs
  function handleInput() {
    updateRollingContext();
    resetIdleTimer();
  }

  // Update idle timer logic: remove calls to the undefined updateWhyBubblePosition
  const resetIdleTimer = () => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    setShowWhyBubble(false);
    setSmartBubble('');
    updateRollingContext(); 
    
    const content = contentRef.current?.innerText || '';
    const lastChar = content.trim().slice(-1);
    console.log(`resetIdleTimer called. Last char: "${lastChar}"`);
    
    if (/[.!?]/.test(lastChar)) {
      console.log('Punctuation detected, calling triggerSmartBubble(false) immediately.');
      // updateWhyBubblePosition(); // Removed - Position calculated in triggerSmartBubble/addBubble
      triggerSmartBubble(false); 
    } else {
      console.log('No punctuation. Setting 9s timer for triggerSmartBubble(true).');
      idleTimer.current = setTimeout(() => {
        console.log('9s timer fired. Calling triggerSmartBubble(true).');
        // updateWhyBubblePosition(); // Removed - Position calculated in triggerSmartBubble/addBubble
        triggerSmartBubble(true); 
      }, 9000); 
    }
  };

  // RenderBubbles function using BubbleItem
  const renderBubbles = () => {
    return (
    <>
      {bubbles.map(bubble => (
          <BubbleItem
            key={bubble.id}
            bubble={bubble}
            isFocused={focusedBubbleId === bubble.id}
            isSelected={selectedBubbleIds.has(bubble.id)}
            isDragged={draggedBubbleId === bubble.id}
            hoverProximityPadding={hoverProximityPadding}
            onBubbleMouseEnter={handleBubbleMouseEnter}
            onBubbleMouseLeave={handleBubbleMouseLeave}
            onBubbleClick={handleBubbleClick}
            onBubbleFocus={handleBubbleFocus}
            onBubbleBlur={handleBubbleBlur}
            onBubbleDragStart={handleBubbleDragStart}
            onBubbleClose={handleBubbleClose}
            onBubbleAction={handleBubbleAction} // Pass the new handler
          />
        ))}
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

  // **Add the missing selection box handlers here**
  const handleEditorMouseDown = (e: React.MouseEvent) => {
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
    const minX = Math.min(selectionBox.startX, selectionBox.endX);
    const maxX = Math.max(selectionBox.startX, selectionBox.endX);
    const minY = Math.min(selectionBox.startY, selectionBox.endY);
    const maxY = Math.max(selectionBox.startY, selectionBox.endY);
    const editorRect = editorRef.current?.getBoundingClientRect();
    if (!editorRect) {
       setSelectionBox(null); // Exit if editorRect is not available
       selectionStartRef.current = null;
       return;
    }
    const selected = new Set<string>();
    bubbles.forEach(bubble => {
      const bx = (bubble.position.left || 0) + editorRect.left; // Calculate screen position
      const by = (bubble.position.top || 0) + editorRect.top;
      const bubbleElement = document.querySelector(`.bubble[key='${bubble.id}']`); // Try to get actual size
      const bw = bubbleElement?.clientWidth || (bubble.expanded ? 80 : 12); // Estimate if not found
      const bh = bubbleElement?.clientHeight || (bubble.expanded ? 24 : 12);
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

  const handleBubbleAction = (bubbleId: string, actionId: string) => {
    const bubble = bubbles.find(b => b.id === bubbleId);
    if (!bubble) return;

    console.log(`Action triggered: ${actionId} for bubble: ${bubble.text}`);

    // --- Logic to handle different actions ---
    if (actionId === 'ADD_TODO') {
      // Placeholder: const taskText = extractTaskFromSuggestion(bubble.text);
      // showAddTaskModal(taskText); 
      toast.info(`Action: Add to-do (for "${bubble.text}")`);
    } else if (actionId === 'DRAFT_EMAIL') {
      // Placeholder: const emailPrompt = generateEmailPromptFromSuggestion(bubble.text);
      // openEmailDraftModal(emailPrompt);
      toast.info(`Action: Draft email (for "${bubble.text}")`);
    } else if (actionId === 'SUMMARIZE_SECTION') {
      // Placeholder: const sectionToSummarize = findRelevantSection(bubble.context); // Bubble might need more context
      // summarizeText(sectionToSummarize); 
      toast.info(`Action: Summarize (for "${bubble.text}")`);
    } else if (actionId === 'APPLY_SUGGESTION' && bubble.text.startsWith('[Clarity]')) {
       // Logic to attempt to apply a clarity suggestion
       // This is complex and depends on how the suggestion is formulated
       toast.info(`Action: Apply clarity edit (for "${bubble.text}")`);
    } else if (actionId === 'DISMISS' || actionId === 'IGNORE') {
      handleBubbleClose(bubbleId); // Reuse existing close logic
    }
    // ... other actions

    // Potentially close or modify the bubble after action
    if (actionId !== 'DISMISS' && actionId !== 'IGNORE') { // Keep bubble if action is dismiss/ignore
        setBubbles(prev => prev.filter(b => b.id !== bubbleId));
    }
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
      onMouseMove={selectionStartRef.current ? handleEditorMouseMove : undefined}
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
      
      {/* Why Bubble (legacy, fallback) - consider removing if BubbleItem is robust */}
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
            zIndex: 1000, // Ensure it's distinct from BubbleItem zIndex if they overlap
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
          onMouseEnter={() => setIsBubbleExpanded(true)} // This controls the legacy bubble's expansion
          onMouseLeave={() => setIsBubbleExpanded(false)}
          onClick={e => { e.stopPropagation(); setIsBubbleExpanded(true); }}
        >
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
      
      {renderBubbles()} {/* This now renders <BubbleItem /> components */}

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
