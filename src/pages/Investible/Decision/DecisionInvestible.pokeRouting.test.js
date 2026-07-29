import React from 'react';
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
import { REPLY_TYPE } from '../../../constants/comments';
import DecisionInvestible from './DecisionInvestible';

const mockCommentBox = jest.fn(() => null);
const mockVoting = jest.fn(() => null);

jest.mock('../../../containers/CommentBox/CommentBox', () => (props) => mockCommentBox(props));
jest.mock('./Voting', () => (props) => mockVoting(props));
jest.mock('../../../utils/votingUtils', () => ({
  useInvestibleVoters: () => [{ id: 'existing-voter' }],
}));
jest.mock('../../../components/PageState/pageStateHooks', () => ({
  getPageReducerPage: (state, dispatch, id, defaultState = {}) => [
    state[id] || defaultState,
    jest.fn(),
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

function renderDecision() {
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
        <MemoryRouter initialEntries={['/market/inline-option-market']}>
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
                        }]}
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

  ReactDOMServer.renderToStaticMarkup(tree);
}

describe('DecisionInvestible option Poke AI routing', () => {
  beforeEach(() => {
    mockCommentBox.mockClear();
    mockVoting.mockClear();
  });

  it('passes the parent planning market and question code to every comment and vote route', () => {
    renderDecision();

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
  });
});
