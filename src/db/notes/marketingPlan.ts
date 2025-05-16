import { FAKE_WORKSPACE_DATA } from '../../data/fakeWorkspaceData';
const note = FAKE_WORKSPACE_DATA.find(d => d.id === 'note-marketing-plan');
export const MARKETING_PLAN_NOTE = note ? note.content : []; 