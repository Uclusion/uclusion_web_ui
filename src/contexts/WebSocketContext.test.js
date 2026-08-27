import React from 'react';
import ReactDOMServer from 'react-dom/server';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { getMarketToken } from '../api/marketLogin';
import { MarketPresencesContext } from './MarketPresencesContext/MarketPresencesContext';
import { MarketsContext } from './MarketsContext/MarketsContext';
import { OnlineStateContext } from './OnlineStateContext';
import { sendPokeAI, WebSocketProvider } from './WebSocketContext';

jest.mock('react-use-websocket', () => ({
  __esModule: true,
  ...jest.requireActual('react-use-websocket'),
  default: jest.fn(),
}));

jest.mock('../api/marketLogin', () => ({
  getMarketToken: jest.fn(),
}));

function renderWebSocketProvider(online) {
  useWebSocket.mockReturnValue({
    getWebSocket: jest.fn(),
    sendMessage: jest.fn(),
  });
  return ReactDOMServer.renderToString(
    <MarketsContext.Provider value={[{ marketDetails: [] }]}>
      <MarketPresencesContext.Provider value={[{}]}>
        <OnlineStateContext.Provider value={[online]}>
          <WebSocketProvider config={{
            webSockets: {
              reconnectInterval: 2000,
              wsUrl: 'wss://example.test',
            },
          }}>
            <span />
          </WebSocketProvider>
        </OnlineStateContext.Provider>
      </MarketPresencesContext.Provider>
    </MarketsContext.Provider>
  );
}

describe('WebSocketProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retries indefinitely with capped exponential backoff', () => {
    renderWebSocketProvider(true);

    const [url, options] = useWebSocket.mock.calls[0];
    expect(url).toBe('wss://example.test');
    expect(options.reconnectAttempts).toBe(Infinity);
    expect([0, 1, 2, 3, 4, 5].map(options.reconnectInterval)).toEqual([
      2000,
      4000,
      8000,
      16000,
      30000,
      30000,
    ]);
  });

  it('uses browser online state to stop and restart the connection', () => {
    renderWebSocketProvider(false);
    renderWebSocketProvider(true);

    expect(useWebSocket.mock.calls[0][2]).toBe(false);
    expect(useWebSocket.mock.calls[1][2]).toBe(true);
  });
});

describe('sendPokeAI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends the exact authenticated poke_ai websocket payload', async () => {
    getMarketToken.mockResolvedValue('market-token');
    const sendMessage = jest.fn();
    const getWebSocket = jest.fn(() => ({ readyState: ReadyState.OPEN }));

    await sendPokeAI(sendMessage, getWebSocket, 'market-id', 'Start T-all-2395');

    expect(getMarketToken).toHaveBeenCalledWith('market-id');
    expect(getWebSocket).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith(
      '{"action":"poke_ai","identity":"market-token","message":"Start T-all-2395"}',
      false
    );
  });

  it.each([
    ['closed', () => ({ readyState: ReadyState.CLOSED })],
    ['absent', () => null],
  ])('does not send when the live websocket is %s', async (_state, socket) => {
    getMarketToken.mockResolvedValue('market-token');
    const sendMessage = jest.fn();
    const getWebSocket = jest.fn(socket);

    await expect(sendPokeAI(
      sendMessage,
      getWebSocket,
      'market-id',
      'Start B-all-590'
    )).rejects.toThrow('WebSocket is not connected');

    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('does not send when market login fails', async () => {
    const error = new Error('login failed');
    getMarketToken.mockRejectedValue(error);
    const sendMessage = jest.fn();
    const getWebSocket = jest.fn();

    await expect(sendPokeAI(
      sendMessage,
      getWebSocket,
      'market-id',
      'Start J-all-364'
    )).rejects.toBe(error);
    expect(getWebSocket).not.toHaveBeenCalled();
    expect(sendMessage).not.toHaveBeenCalled();
  });
});
