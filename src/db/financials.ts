import { FAKE_WORKSPACE_DATA } from '../data/fakeWorkspaceData';

const financialsTable = FAKE_WORKSPACE_DATA.find(d => d.id === 'financials-2024');
export const FINANCIALS = financialsTable ? financialsTable.rows : [];
export const FINANCIALS_COLUMNS = financialsTable ? financialsTable.columns : []; 