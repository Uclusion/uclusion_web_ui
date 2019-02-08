import { combineReducers } from 'redux';
import { formatInvestibles } from './actions';

const items = (state = [], action) => {
  switch (action.type) {
    default:
      return state;
  }
};

export const getInvestibles = state => formatInvestibles(state.items);

export default combineReducers({
  items,
});
