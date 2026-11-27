import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { createMemoryHistory } from 'history';
import { Router } from 'react-router';
import { IntlProvider } from 'react-intl';
import { createTheme, ThemeProvider } from '@material-ui/core/styles';
import Options from './Options';
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext';
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext';
import { MarketStagesContext } from '../../contexts/MarketStagesContext/MarketStagesContext';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import { MarketGroupsContext } from '../../contexts/MarketGroupsContext/MarketGroupsContext';
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext';
import { setUclusionLocalStorageItem } from '../localStorageUtils';
import messages from '../../config/locales/en';

// Keep the actual option list, selection callbacks, ordering and saved page state.
jest.mock('../../pages/Investible/Decision/DecisionInvestible', () => ({ fullInvestible }) =>
  <div data-option-body={fullInvestible.investible.id}>{fullInvestible.investible.description}</div>);
jest.mock('../../pages/Dialog/Decision/OptionMenu', () => () => null);
jest.mock('../Avatars/GravatarGroup', () => () => null);
jest.mock('@material-ui/core', () => ({
  ...jest.requireActual('@material-ui/core'),
  useMediaQuery: () => false,
}));

const inlineId = 'inline';
const inlineMarket = { id: inlineId, market_stage: 'Active', market_type: 'DECISION' };
const option = (id, name, stage = 'approvable') => ({
  investible: { id, name, description: `${name} body` },
  market_infos: [{ market_id: inlineId, investible_id: id, stage }],
});
const a = option('option-a', 'A');
const b = option('option-b', 'B');
const proposed = option('option-proposed', 'Proposed', 'proposed');
const stages = [{ id: 'approvable', allows_investment: true },
  { id: 'proposed', allows_investment: false }];
const noOp = () => {};
let cleanup;
let oldScrollIntoView;
let oldActEnvironment;

beforeEach(() => {
  oldActEnvironment = window.IS_REACT_ACT_ENVIRONMENT;
  window.IS_REACT_ACT_ENVIRONMENT = true;
  oldScrollIntoView = Element.prototype.scrollIntoView;
  Element.prototype.scrollIntoView = jest.fn();
  setUclusionLocalStorageItem('options', {});
});
afterEach(() => {
  cleanup?.();
  cleanup = undefined;
  Element.prototype.scrollIntoView = oldScrollIntoView;
  window.IS_REACT_ACT_ENVIRONMENT = oldActEnvironment;
});

function renderOptions(initial = {}) {
  cleanup?.();
  let data = { options: [], votedId: undefined, useCompression: false, ...initial };
  const history = createMemoryHistory({ initialEntries: ['/dialog/workspace/job'] });
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  function tree() {
    const presences = [{ id: 'human', email: 'human@example.com', investments: data.votedId ?
      [{ investible_id: data.votedId, quantity: 5 }] : [] }];
    const providers = [
      [CommentsContext, [{ [inlineId]: [{ id: 'nested-b', investible_id: b.investible.id }] }, noOp]],
      [InvestiblesContext, [Object.fromEntries(data.options.map((value) => [value.investible.id, value])), noOp]],
      [MarketStagesContext, [{ [inlineId]: stages }, noOp]],
      [MarketPresencesContext, [{ [inlineId]: presences }, noOp]],
      [MarketsContext, [{ marketDetails: [inlineMarket] }, noOp]],
      [MarketGroupsContext, [{}, noOp]],
      [NotificationsContext, [{ messages: [] }, noOp]],
      [OperationInProgressContext, [false, noOp]],
    ];
    return <ThemeProvider theme={createTheme()}><IntlProvider locale="en" messages={messages}>
      <Router history={history}>{providers.reduceRight((children, [Context, value]) =>
        <Context.Provider value={value}>{children}</Context.Provider>,
      <Options anInlineMarket={inlineMarket} marketId="workspace" investibleId="job"
        inArchives={false} isEditable={false} isSent removeActions
        useCompression={data.useCompression} selectedInvestibleIdParent={data.parentId} />)}</Router>
    </IntlProvider></ThemeProvider>;
  }
  const update = (changes = {}) => {
    data = { ...data, ...changes };
    act(() => root.render(tree()));
  };
  cleanup = () => {
    act(() => root.unmount());
    container.remove();
  };
  update();
  return { container, history, update };
}

it('keeps the opened option through incoming votes while preserving explicit targets and default resets (B-all-742)', () => {
  let page = renderOptions();
  const expanded = () => Array.from(page.container.querySelectorAll('[data-option-body]'))
    .map((node) => node.getAttribute('data-option-body'));
  expect(expanded()).toEqual([]);
  page.update({ options: [a, b, proposed] });
  expect(expanded()).toEqual([a.investible.id]);

  page.update({ votedId: b.investible.id });
  expect(Array.from(page.container.querySelectorAll('[id^="linkoption-"]')).map((node) => node.id))
    .toEqual(['linkoption-b', 'linkoption-a']);
  expect(expanded()).toEqual([a.investible.id]);

  // An automatic default is not a saved preference when this question is mounted again.
  page = renderOptions({ options: [a, b, proposed], votedId: b.investible.id });
  expect(expanded()).toEqual([b.investible.id]);
  page.update({ useCompression: true, votedId: a.investible.id });
  expect(expanded()).toEqual([]);
  page.update({ useCompression: false });
  expect(expanded()).toEqual([a.investible.id]);
  page.update({ options: [b, proposed] });
  expect(expanded()).toEqual([b.investible.id]);

  // Proposed has no automatic fallback. Returning to Approvable retains its current default.
  act(() => page.container.querySelectorAll('[role="tab"]')[1].click());
  expect(expanded()).toEqual([]);
  act(() => page.container.querySelectorAll('[role="tab"]')[0].click());
  expect(expanded()).toEqual([b.investible.id]);

  page.update({ options: [a, b, proposed] });
  act(() => page.container.querySelector('#linkoption-a').click());
  page.update({ votedId: b.investible.id });
  expect(expanded()).toEqual([a.investible.id]);
  act(() => page.container.querySelector('#linkoption-a').click());
  page.update({ votedId: a.investible.id });
  expect(expanded()).toEqual([]);
  page = renderOptions({ options: [a, b, proposed], votedId: b.investible.id });
  expect(expanded()).toEqual([]);

  // Inbox parents and deliberate anchors retain their existing selection paths.
  setUclusionLocalStorageItem('options', {});
  page = renderOptions({ options: [a, b, proposed], parentId: b.investible.id });
  expect(expanded()).toEqual([b.investible.id]);
  page.update({ parentId: undefined });
  act(() => page.history.push('/dialog/workspace/job#optionoption-a'));
  expect(expanded()).toEqual([a.investible.id]);
  act(() => page.history.push('/dialog/workspace/job#cnested-b', {
    searchMatch: { marketId: inlineId, commentId: 'nested-b' },
  }));
  expect(expanded()).toEqual([b.investible.id]);
});
