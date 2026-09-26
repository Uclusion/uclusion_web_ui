import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import ReactDOMServer from 'react-dom/server';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router';
import { ThemeProvider, createTheme } from '@material-ui/core/styles';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { DiffContext } from '../../../contexts/DiffContext/DiffContext';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { JUSTIFY_TYPE, REPLY_TYPE } from '../../../constants/comments';
import DecisionInvestible from './DecisionInvestible';
import { ScrollContext } from '../../../contexts/ScrollContext';

const mockCommentBox = jest.fn(() => null);
const mockVoting = jest.fn(() => null);
const mockUpdatePageState = jest.fn();

jest.mock('../../../containers/CommentBox/CommentBox', () => (props) => mockCommentBox(props));
jest.mock('./Voting', () => (props) => mockVoting(props));
jest.mock('../../../utils/votingUtils', () => ({
  useInvestibleVoters: () => [{ id: 'existing-voter' }],
}));
jest.mock('../../../components/PageState/pageStateHooks', () => ({
  getPageReducerPage: (state, dispatch, id, defaultState = {}) => [
    state[id] || defaultState,
    mockUpdatePageState,
    jest.fn(),
  ],
  usePageStateReducer: () => [{}, jest.fn()],
}));
jest.mock('../InvestibleBodyEdit', () => ({
  useInvestibleEditStyles: () => ({
    container: 'container',
    containerEditable: 'containerEditable',
    title: 'title',
  }),
}));
jest.mock('../../../components/AddNewWizards/WizardStylesContext', () => ({
  wizardStyles: () => ({ actionNext: 'actionNext' }),
}));
jest.mock('../../../components/AddNewWizards/DecisionComment/AddCommentStep', () => ({
  hasDecisionComment: () => false,
}));
jest.mock('../../../components/CardType', () => () => null);
jest.mock('../../../components/Files/AttachedFilesList', () => () => null);
jest.mock('../../../components/Descriptions/DescriptionOrDiff', () => () => null);
jest.mock('../../../components/Buttons/SpinningIconLabelButton', () => () => null);
jest.mock('../../../components/SpinBlocking/SpinningButton', () => () => null);
jest.mock('../../Dialog/EditMarketButton', () => () => null);
jest.mock('../../Dialog/InvesibleCommentLinker', () => () => null);
jest.mock('@material-ui/core', () => ({
  ...jest.requireActual('@material-ui/core'),
  useMediaQuery: () => false,
}));

function renderDecision(notification, hashFragment) {
  const noOp = jest.fn();
  const inlineMarketId = 'inline-option-market';
  const planningMarketId = 'parent-planning-market';
  const parentComment = {
    id: 'parent-question',
    investible_id: 'job-id',
    ticket_code: 'Q-all-500',
  };
  const stages = {
    [inlineMarketId]: [
      { id: 'proposed', allows_investment: false },
      { id: 'voting', allows_investment: true },
    ],
  };
  const tree = (
    <ThemeProvider theme={createTheme()}>
      <IntlProvider locale="en" messages={{
        comments: 'Comments',
        created_by: 'Created by',
        decisionInvestibleOthersVoting: 'Approvals',
      }}>
        <MemoryRouter initialEntries={[{ pathname: '/market/inline-option-market', state: { notification } }]}>
          <InvestiblesContext.Provider value={[{}, noOp]}>
            <CommentsContext.Provider value={[{ [planningMarketId]: [parentComment] }, noOp]}>
              <DiffContext.Provider value={[{}, noOp]}>
                <NotificationsContext.Provider value={[{ messages: [] }, noOp]}>
                  <OperationInProgressContext.Provider value={[false, noOp]}>
                    <MarketStagesContext.Provider value={[stages, noOp]}>
                      <DecisionInvestible
                        market={{
                          id: inlineMarketId,
                          market_stage: 'Active',
                          parent_comment_id: parentComment.id,
                          parent_comment_market_id: planningMarketId,
                        }}
                        fullInvestible={{
                          investible: {
                            id: 'option-id',
                            name: 'Option',
                            created_by: 'human-user',
                            attached_files: [],
                            description: '<p>Option body</p>',
                          },
                          market_infos: [{ market_id: inlineMarketId, stage: 'voting' }],
                        }}
                        marketPresences={[{
                          id: 'human-user',
                          current_user: true,
                          investments: [],
                        }]}
                        investibleComments={[{
                          id: 'option-reply',
                          comment_type: REPLY_TYPE,
                          created_by: 'ai-user',
                          reply_id: 'vote-reason',
                        }, ...(notification ? [{ id: 'vote-reason', comment_type: JUSTIFY_TYPE }] : [])]}
                        userId="human-user"
                        removeActions
                      />
                    </MarketStagesContext.Provider>
                  </OperationInProgressContext.Provider>
                </NotificationsContext.Provider>
              </DiffContext.Provider>
            </CommentsContext.Provider>
          </InvestiblesContext.Provider>
        </MemoryRouter>
      </IntlProvider>
    </ThemeProvider>
  );

  return <ScrollContext.Provider value={[hashFragment]}>{tree}</ScrollContext.Provider>;
}

describe('DecisionInvestible option Poke AI routing', () => {
  beforeEach(() => {
    mockCommentBox.mockClear();
    mockVoting.mockClear();
    mockUpdatePageState.mockClear();
  });

  it('passes the parent planning market and question code to every comment and vote route', () => {
    ReactDOMServer.renderToStaticMarkup(renderDecision());

    expect(mockCommentBox).toHaveBeenCalled();
    mockCommentBox.mock.calls.forEach(([props]) => {
      expect(props).toEqual(expect.objectContaining({
        marketId: 'inline-option-market',
        pokeAIMarketId: 'parent-planning-market',
        pokeAIParentTicketCode: 'Q-all-500',
      }));
    });
    expect(mockVoting).toHaveBeenCalledWith(expect.objectContaining({
      market: expect.objectContaining({ id: 'inline-option-market' }),
      pokeAIMarketId: 'parent-planning-market',
      pokeAIParentTicketCode: 'Q-all-500',
    }));

    const previousActEnvironment = window.IS_REACT_ACT_ENVIRONMENT;
    window.IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div');
    const root = createRoot(container);
    const notification = { id: 'UNREAD_REPLY_option-reply', entryId: 'entry-1',
      marketId: 'inline-option-market', commentId: 'vote-reason' };
    try {
      act(() => root.render(renderDecision(notification, 'optionoption-id')));
      expect(container.querySelector('#optionoption-id').style.backgroundColor).toBe('rgb(251, 246, 216)');
      expect(mockUpdatePageState).toHaveBeenCalledWith({ useCompression: false });
      mockUpdatePageState.mockClear();
      // Rerenders and a later user collapse must not reapply the same notification entry.
      act(() => root.render(renderDecision(notification)));
      expect(container.querySelector('#optionoption-id').style.backgroundColor).toBe('');
      expect(mockUpdatePageState).not.toHaveBeenCalled();
    } finally {
      act(() => root.unmount());
      window.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
    }
  });
});
