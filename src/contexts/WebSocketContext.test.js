import { getMarketToken } from '../api/marketLogin';
import { sendPokeAI } from './WebSocketContext';

jest.mock('../api/marketLogin', () => ({
  getMarketToken: jest.fn(),
}));

describe('sendPokeAI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends the exact authenticated poke_ai websocket payload', async () => {
    getMarketToken.mockResolvedValue('market-token');
    const sendMessage = jest.fn();

    await sendPokeAI(sendMessage, 'market-id', 'Start T-all-2395');

    expect(getMarketToken).toHaveBeenCalledWith('market-id');
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith(
      '{"action":"poke_ai","identity":"market-token","message":"Start T-all-2395"}'
    );
  });

  it('does not send when market login fails', async () => {
    const error = new Error('login failed');
    getMarketToken.mockRejectedValue(error);
    const sendMessage = jest.fn();

    await expect(sendPokeAI(sendMessage, 'market-id', 'Start J-all-364')).rejects.toBe(error);
    expect(sendMessage).not.toHaveBeenCalled();
  });
});
