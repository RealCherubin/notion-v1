import { getOpenAIApiKey } from '@/lib/utils';
import { FAKE_WORKSPACE_DATA } from '@/data/fakeWorkspaceData';

export interface CherubinContext {
  currentParagraph: string;
  previousParagraph: string;
  styleProfile?: string;
  workspaceContext?: string;
}

export interface CherubinSuggestion {
  suggestion: string;
  aiResponseType: string;
}

const SYSTEM_PROMPT = `You are a helpful, knowledgeable assistant. Answer the user's question as clearly and directly as possible.`;

export async function getCherubinSuggestion(
  context: CherubinContext,
  triggerType: 'hotkey' | 'pause',
  setDebug?: (d: any) => void
): Promise<CherubinSuggestion> {
  const apiKey = getOpenAIApiKey();
  if (!apiKey) {
    setDebug?.((d: any) => ({ ...d, apiError: 'OpenAI API Key not found.' }));
    return { suggestion: '', aiResponseType: '' };
  }

  // Build the prompt using SYSTEM_PROMPT and context
  setDebug?.((d: any) => ({ ...d, apiPrompt: context.currentParagraph }));

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: context.currentParagraph }
        ],
        max_tokens: 80,
        temperature: 0.5,
        top_p: 0.9,
      })
    });

    if (!res.ok) throw new Error(`OpenAI Error ${res.status}: ${await res.text()}`);
    const data = await res.json();
    const suggestion = data.choices?.[0]?.message?.content?.trim() || '';
    // Parse aiResponseType as before
    let aiResponseType = 'Suggestion';
    if (/^\[Answer\]/.test(suggestion)) aiResponseType = 'Direct Answer';
    else if (/^\[Link Doc\?\]/.test(suggestion)) aiResponseType = 'Doc Link Suggestion';
    else if (/^\[Summary\?\]/.test(suggestion)) aiResponseType = 'Summary';
    else if (/^\[AskCalendar_Details\?\]/.test(suggestion)) aiResponseType = 'Calendar_MissingInfo';
    else if (/^\[Action\?\]/.test(suggestion)) aiResponseType = 'Action Item';
    else if (/^\[Clarity\]/.test(suggestion)) aiResponseType = 'Clarity';
    else if (/^\[Flow\]/.test(suggestion)) aiResponseType = 'Flow';
    else if (/^\[DraftEmail\?\]/.test(suggestion)) aiResponseType = 'Draft Email';
    else if (/^\[Probe\?\]/.test(suggestion)) aiResponseType = 'ProbingQuestion';
    setDebug?.((d: any) => ({ ...d, lastAIResponse: suggestion, aiResponseType }));
    return { suggestion, aiResponseType };
  } catch (err: any) {
    setDebug?.((d: any) => ({ ...d, apiError: String(err) }));
    return { suggestion: '', aiResponseType: '' };
  }
} 