import { createMemoryHistory } from 'history';
import { getLinkTargetName, getTicketRedirectUrl, navigate, removeHash } from './marketIdPathFunctions';

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

describe('short code link hover names (S-all-321)', () => {
  const commentsState = {
    [marketId]: [
      { id: 'question-id', body: '<p>Which transport should the handover use?</p>' },
    ],
  };
  const investiblesState = {
    [investibleId]: { investible: { id: investibleId, name: 'Attach every vote' } },
  };

  it('names a job link from the investible it points at', () => {
    expect(getLinkTargetName(`/dialog/${marketId}/${investibleId}`, ticketState,
      commentsState, investiblesState)).toBe('Attach every vote');
  });

  it('names a comment link from the body it anchors on', () => {
    expect(getLinkTargetName(`/dialog/${marketId}/${investibleId}#cquestion-id`, ticketState,
      commentsState, investiblesState)).toBe('Which transport should the handover use?');
  });

  it('gives no name for a target this session has not loaded', () => {
    expect(getLinkTargetName(`/dialog/${marketId}/never-loaded`, ticketState,
      commentsState, investiblesState)).toBeUndefined();
  });

  it('gives no name for a link that is not a Uclusion object', () => {
    expect(getLinkTargetName('https://example.com/elsewhere', ticketState,
      commentsState, investiblesState)).toBeUndefined();
  });
});


it('preserves a notification entry through scroll cleanup and gives a repeated entry a new identity', () => {
  const history = createMemoryHistory({ initialEntries: ['/inbox'] });
  const url = '/dialog/market/view#cnote';
  const notification = { id: 'UNREAD_COMMENT_note', marketId: 'market', commentId: 'note' };
  navigate(history, url, false, false, { notification });
  const firstEntry = history.location.state.notification;
  removeHash(history);
  expect(history.location.hash).toBe('');
  expect(history.location.state.notification).toEqual(firstEntry);
  navigate(history, url, false, false, { notification });
  expect(history.location.state.notification.entryId).not.toBe(firstEntry.entryId);
  expect(history.location.state.notification).toEqual({ ...notification, entryId: expect.any(String) });
});
