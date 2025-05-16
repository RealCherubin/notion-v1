import { FAKE_WORKSPACE_DATA } from '../../data/fakeWorkspaceData';
const note = FAKE_WORKSPACE_DATA.find(d => d.id === 'note-brainstorm');
export const BRAINSTORM_NOTE = note ? note.content : []; 