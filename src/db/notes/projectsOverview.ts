import { FAKE_WORKSPACE_DATA } from '../../data/fakeWorkspaceData';
const note = FAKE_WORKSPACE_DATA.find(d => d.id === 'note-projects-overview');
export const PROJECTS_OVERVIEW_NOTE = note ? note.content : []; 