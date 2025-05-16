# AI Suggestion Interaction Specification

## Triggers
- **Natural Pauses:**
  - User stops typing for 10 seconds.
- **Punctuation:**
  - User enters sentence-ending punctuation (., !, ?, ,).
- **Repeated Friction:**
  - User types keywords indicating struggle (e.g., "unclear", "unsure", "again").

## Contexts
- **Immediate Context:**
  - The last two sentences typed by the user.
- **Historical Patterns:**
  - Previously observed user behaviors, recurring themes, or repeated struggles.
- **Emotional Signals:**
  - Detected through language (e.g., expressions of frustration, confusion, or uncertainty).

## UI States
- **Invisible (Passive Observation):**
  - No UI is shown; the system is silently monitoring.
- **Subtle Visual Cue (Subtle Awareness):**
  - A light floating dot appears when the system is ready to help, but does not interrupt.
- **Active Gentle Suggestion:**
  - A concise, empathetic floating card appears with a suggestion, reflection, or next step. Easily dismissible and non-intrusive.

## A2A Steps (Agent-to-Agent Communication)
*The A2A (Agent-to-Agent) process is a multi-step communication and reasoning flow between system agents to determine if, when, and how to engage the user:*

1. **Observation:**
   - Continuously monitor user input in real time.
2. **Context Check:**
   - Analyze the last two sentences and compare with historical/emotional context.
3. **Trigger Detection:**
   - Detect if a trigger event (pause, punctuation, friction keyword) has occurred.
4. **Context Retrieval:**
   - Retrieve relevant context (immediate, historical, emotional) for response generation.
5. **Response Composition:**
   - Compose a concise, empathetic, and contextually relevant suggestion or reflection.
6. **Learning Loop:**
   - Observe user interaction with the suggestion (dismiss, accept, ignore) and refine future responses accordingly. 