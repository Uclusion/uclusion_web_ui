import { getMarketClient } from './marketLogin';
import { updateInvestment } from './marketInvestibles';
import { toastErrorAndThrow } from '../utils/userMessage';

jest.mock('./marketLogin', () => ({ getMarketClient: jest.fn() }));
jest.mock('../utils/userMessage', () => ({
  errorAndThrow: jest.fn(),
  toastErrorAndThrow: jest.fn((error) => {
    throw error;
  }),
}));

describe('updateInvestment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses the question-resolved message for an inactive inline market', async () => {
    const error = { status: 403 };
    const client = {
      markets: {
        updateInvestment: jest.fn().mockRejectedValue(error),
      },
    };
    getMarketClient.mockResolvedValue(client);

    await expect(updateInvestment({
      marketId: 'inline-market',
      investibleId: 'option-id',
      newQuantity: 4,
      currentQuantity: 0,
      reasonNeedsUpdate: false,
    }, 'errorQuestionResolved')).rejects.toBe(error);

    expect(toastErrorAndThrow).toHaveBeenCalledWith(error, 'errorQuestionResolved');
  });
});
