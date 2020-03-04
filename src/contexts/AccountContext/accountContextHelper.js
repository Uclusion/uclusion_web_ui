import _ from 'lodash';
import { PRODUCT_TIER_FREE } from '../../constants/billing';

export function canCreate(state) {
  if (_.isEmpty(state)) {
    return false;
  }
  const { tier } = state;
  return tier !== PRODUCT_TIER_FREE;
}

export function getTier(state) {
  if (_.isEmpty(state)) {
    return undefined;
  }
  return state.tier;
}

export function getId(state) {
  if (_.isEmpty(state)) {
    return undefined;
  }
  return state.id;
}