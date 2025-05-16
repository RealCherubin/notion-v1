import { FAKE_WORKSPACE_DATA } from '../../data/fakeWorkspaceData';
const note = FAKE_WORKSPACE_DATA.find(d => d.id === 'note-client-feedback');
export const CLIENT_FEEDBACK_NOTE = note ? note.content : []; 