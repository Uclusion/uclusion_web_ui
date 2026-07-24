import {
  clearSignupMarketSubType,
  withSignupMarketSubType
} from './redirectUtils';
import { TEST_SUB_TYPE } from '../constants/markets';

export function isTestSignup(marketSubType) {
  return marketSubType === TEST_SUB_TYPE;
}

export function withSignupTestObject(signupData, marketSubType) {
  if (!isTestSignup(marketSubType)) {
    return signupData;
  }
  return {
    ...signupData,
    test_object: true
  };
}

export function resolveSignupTestObject(testObject, storedMarketSubType) {
  return testObject === undefined ?
    isTestSignup(storedMarketSubType) : testObject;
}

export function createMarketFromSignup(createMarket, marketInfo) {
  const signupMarketInfo = withSignupMarketSubType(marketInfo);
  return createMarket(signupMarketInfo)
    .then((marketDetails) => {
      clearSignupMarketSubType();
      return marketDetails;
    });
}
