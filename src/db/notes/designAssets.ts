import { FAKE_WORKSPACE_DATA } from '../../data/fakeWorkspaceData';
const note = FAKE_WORKSPACE_DATA.find(d => d.id === 'note-design-assets');
export const DESIGN_ASSETS_NOTE = note ? note.content : []; 