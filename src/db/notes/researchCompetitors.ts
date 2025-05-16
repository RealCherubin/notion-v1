import { FAKE_WORKSPACE_DATA } from '../../data/fakeWorkspaceData';
const note = FAKE_WORKSPACE_DATA.find(d => d.id === 'note-research-competitors');
export const RESEARCH_COMPETITORS_NOTE = note ? note.content : []; 