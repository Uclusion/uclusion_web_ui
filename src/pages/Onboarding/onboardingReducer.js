import { getUclusionLocalStorageItem, setUclusionLocalStorageItem } from '../../components/utils';

const RESET_VALUES = 'RESET_VALUES';
const UPDATE_VALUES = 'UPDATE_VALUES';

export function updateValues(newValues){
  return {
    type: UPDATE_VALUES,
    newValues,
  };
}

export function resetValues() {
  return {
    type: RESET_VALUES,
  };
}

function computeNewState(state, action) {
  const { type } = action;
  switch (type) {
    case UPDATE_VALUES:
      return {
        ...state,
        ...action.newValues,
      };
    case RESET_VALUES:
      return {};
    default:
      return state;
  }
}

export function getStoredData(wizardName) {
  return getUclusionLocalStorageItem(`WizardStorage_${wizardName}`);
}

export function generateReducer(wizardName) {
  return (state, action) => {
    const newState = computeNewState(state, action);
    setUclusionLocalStorageItem(`WizardStorage_${wizardName}`, newState);
    return newState;
  }
}
