import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { IntlProvider } from 'react-intl';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext';
import SpinningButton from './SpinningButton';

const mockButton = jest.fn(() => null);

jest.mock('@material-ui/core', () => {
  const React = require('react');
  return {
    Button: (props) => {
      mockButton(props);
      return React.createElement('button', { id: props.id }, props.children);
    },
    CircularProgress: () => null,
    Tooltip: ({ children }) => React.createElement(React.Fragment, null, children),
    useMediaQuery: () => false,
    useTheme: () => ({
      breakpoints: { down: () => '(max-width: 960px)' },
      typography: { fontSize: 14 },
    }),
  };
});

jest.mock('../Buttons/FocusRippleButton', () => () => null);

describe('SpinningButton', () => {
  beforeEach(() => {
    mockButton.mockClear();
  });

  it('forwards the click event and returns the callback result', () => {
    const result = { handled: true };
    const onClick = jest.fn(() => result);
    const setOperationRunning = jest.fn();
    ReactDOMServer.renderToString(
      <IntlProvider locale="en" messages={{}}>
        <OperationInProgressContext.Provider value={[false, setOperationRunning]}>
          <SpinningButton id="allDone" onClick={onClick}>All done</SpinningButton>
        </OperationInProgressContext.Provider>
      </IntlProvider>
    );
    const buttonProps = mockButton.mock.calls[0][0];
    const event = { currentTarget: { id: 'allDone' } };

    expect(buttonProps.onClick(event)).toBe(result);
    expect(onClick).toHaveBeenCalledWith(event);
    expect(setOperationRunning).toHaveBeenCalledWith('allDone');
  });
});
