import { getTicketRedirectUrl } from './marketIdPathFunctions';

const marketId = 'planning-market';
const ticketCode = 'J-all-372';
const investibleId = 'job-id';
const questionCode = 'Q-all-341';
const ticketState = {
  [`${marketId}/${ticketCode}`]: {
    marketId,
    investibleId,
  },
  [`${marketId}/${questionCode}`]: {
    marketId,
    groupId: 'group-id',
    commentId: 'question-id',
  },
};

describe('canonical ticket redirects', () => {
  it('preserves a vote anchor when resolving a canonical job URL', () => {
    expect(getTicketRedirectUrl(
      `/${marketId}/${ticketCode}`,
      '#cvhuman-user',
      ticketState,
      {},
      {}
    )).toBe(`/dialog/${marketId}/${investibleId}#cvhuman-user`);
  });

  it('leaves an ordinary canonical job URL unchanged', () => {
    expect(getTicketRedirectUrl(
      `/${marketId}/${ticketCode}`,
      '',
      ticketState,
      {},
      {}
    )).toBe(`/dialog/${marketId}/${investibleId}`);
  });

  it('lands an option anchor on the option instead of the question comment', () => {
    expect(getTicketRedirectUrl(
      `/${marketId}/${questionCode}`,
      '#optionoption-id',
      ticketState,
      {},
      {}
    )).toBe(`/dialog/${marketId}?groupId=group-id#optionoption-id`);
  });
});
