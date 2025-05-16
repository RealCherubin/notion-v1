import { FAKE_WORKSPACE_DATA } from '../../data/fakeWorkspaceData';
const note = FAKE_WORKSPACE_DATA.find(d => d.id === 'note-meeting-2024-06-01');
export const MEETING_20240601_NOTE = note ? note.content : []; 