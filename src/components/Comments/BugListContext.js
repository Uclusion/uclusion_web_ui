import _ from 'lodash'

const UPDATE_PAGE = 'UPDATE_PAGE';
const UPDATE_TAB = 'SET_TAB';
const EXPAND_ALL_ON_PAGE = 'EXPAND_ALL_ON_PAGE';
const CONTRACT_ALL_ON_PAGE = 'CONTRACT_ALL_ON_PAGE';
const EXPAND_OR_CONTRACT = 'EXPAND_OR_CONTRACT';
const PIN = 'PIN';

export const PAGE_SIZE = 15;

export function setPage(pageNum) {
  return {
    type: UPDATE_PAGE,
    pageNum
  };
}

export function setTab(tabNum) {
  return {
    type: UPDATE_TAB,
    tabNum
  };
}

export function expandAll(items) {
  return {
    type: EXPAND_ALL_ON_PAGE,
    items
  };
}

export function contractAll(items) {
  return {
    type: CONTRACT_ALL_ON_PAGE,
    items
  };
}

export function expandOrContract(id) {
  return {
    type: EXPAND_OR_CONTRACT,
    id
  };
}

export function pin(id) {
  return {
    type: PIN,
    id
  };
}

function toggleExpandRow(state, action) {
  const { id } = action;
  const { expansionState } = state;
  let newExpandedState;
  if (expansionState[id] === undefined) {
    newExpandedState = {...expansionState, [id]: true};
  } else {
    newExpandedState = _.omit(expansionState, id);
  }
  return { ...state, expansionState: newExpandedState }
}

function pinId(state, action) {
  const { id } = action;
  const { expansionState } = state;
  const newExpandedState = {...expansionState, [id]: true};
  return { ...state, pinned: id, expansionState: newExpandedState }
}

function updateTab(state, action) {
  const { pageState, defaultPage } = state;
  const { tabNum } = action;
  const pageNum = pageState[tabNum] === undefined ? defaultPage : pageState[tabNum];
  return { ..._.omit(state, 'pinned'), page: pageNum, tabIndex: tabNum };
}

function updatePage(state, action) {
  const { pageNum, tabIndex, pageState } = action;
  const newPageState = {...pageState, [tabIndex]: pageNum};
  return { ..._.omit(state, 'pinned'), page: pageNum, pageState: newPageState };
}

function expandPage(state, action, isExpand) {
  const { expansionState } = state;
  const { items } = action;
  const newExpanded = { ...expansionState };
  if (!_.isEmpty(items)) {
    items.forEach((message) => {
      newExpanded[message.id] = isExpand;
    });
  }
  return { ...state, expansionState: newExpanded };
}

function getReducer() {
  return (state, action) => {
    switch (action.type) {
      case UPDATE_PAGE:
        return updatePage(state, action);
      case UPDATE_TAB:
        return updateTab(state, action);
      case EXPAND_ALL_ON_PAGE:
        return expandPage(state, action, true);
      case CONTRACT_ALL_ON_PAGE:
        return expandPage(state, action, false);
      case EXPAND_OR_CONTRACT:
        return toggleExpandRow(state, action);
      case PIN:
        return pinId(state, action);
      default:
        return state;
    }
  };
}

export default getReducer;