import { FAKE_WORKSPACE_DATA } from '../data/fakeWorkspaceData';

const tasksTable = FAKE_WORKSPACE_DATA.find(d => d.id === 'tasks-db');
export const TASKS = tasksTable ? tasksTable.rows : [];
export const TASKS_COLUMNS = tasksTable ? tasksTable.columns : []; 