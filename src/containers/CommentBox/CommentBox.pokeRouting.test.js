import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext';
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import { MarketStagesContext } from '../../contexts/MarketStagesContext/MarketStagesContext';
import { SearchResultsContext } from '../../contexts/SearchResultsContext/SearchResultsContext';
import { QUESTION_TYPE } from '../../constants/comments';
import CommentBox from './CommentBox';

const mockComment = jest.fn(() => null);

jest.mock('../../components/Comments/Comment', () => (props) => mockComment(props));
jest.mock('react-hotkeys-hook', () => ({
  useHotkeys: () => {},
}));

describe('CommentBox option Poke AI routing', () => {
  beforeEach(() => {
    mockComment.mockClear();
  });

  it('forwards the planning market and parent question code to each root comment', () => {
    const noOp = jest.fn();
    const root = {
      id: 'option-question',
      comment_type: QUESTION_TYPE,
      created_by: 'ai-user',
      updated_at: '2026-07-28T10:00:00Z',
      resolved: false,
    };
    const tree = (
      <SearchResultsContext.Provider value={[{
        search: '',
        results: [],
        parentResults: [],
      }, noOp]}>
        <MarketStagesContext.Provider value={[{}, noOp]}>
          <CommentsContext.Provider value={[{}, noOp]}>
            <InvestiblesContext.Provider value={[{}, noOp]}>
              <MarketPresencesContext.Provider value={[{}, noOp]}>
                <CommentBox
                  comments={[root]}
                  marketId="inline-option-market"
                  pokeAIMarketId="parent-planning-market"
                  pokeAIParentTicketCode="Q-all-500"
                />
              </MarketPresencesContext.Provider>
            </InvestiblesContext.Provider>
          </CommentsContext.Provider>
        </MarketStagesContext.Provider>
      </SearchResultsContext.Provider>
    );

    ReactDOMServer.renderToStaticMarkup(tree);

    expect(mockComment).toHaveBeenCalledWith(expect.objectContaining({
      comment: expect.objectContaining({ id: root.id }),
      marketId: 'inline-option-market',
      pokeAIMarketId: 'parent-planning-market',
      pokeAIParentTicketCode: 'Q-all-500',
    }));
  });

  it('derives the job parent code from marketInfo for investible comments', () => {
    // J-all-380: a Start on a job comment carries the enclosing job.
    const noOp = jest.fn();
    const root = {
      id: 'job-question',
      comment_type: QUESTION_TYPE,
      created_by: 'human-user',
      updated_at: '2026-07-28T10:00:00Z',
      resolved: false,
    };
    const tree = (
      <SearchResultsContext.Provider value={[{
        search: '',
        results: [],
        parentResults: [],
      }, noOp]}>
        <MarketStagesContext.Provider value={[{}, noOp]}>
          <CommentsContext.Provider value={[{}, noOp]}>
            <InvestiblesContext.Provider value={[{}, noOp]}>
              <MarketPresencesContext.Provider value={[{}, noOp]}>
                <CommentBox
                  comments={[root]}
                  marketId="planning-market"
                  marketInfo={{ ticket_code: 'J-all-1' }}
                />
              </MarketPresencesContext.Provider>
            </InvestiblesContext.Provider>
          </CommentsContext.Provider>
        </MarketStagesContext.Provider>
      </SearchResultsContext.Provider>
    );

    ReactDOMServer.renderToStaticMarkup(tree);

    expect(mockComment).toHaveBeenCalledWith(expect.objectContaining({
      comment: expect.objectContaining({ id: root.id }),
      marketId: 'planning-market',
      pokeAIParentTicketCode: 'J-all-1',
    }));
  });
});
