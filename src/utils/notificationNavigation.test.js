import { getNotificationDestination, unrespondedOrderWithinJobs } from './notificationNavigation';

const marketId = 'workspace';
const question = { id: 'question', comment_type: 'QUESTION', investible_id: 'job', group_id: 'view' };
const reply = { id: 'reply', comment_type: 'REPLY', reply_id: question.id, investible_id: 'job' };
const message = { type: 'UNREAD_COMMENT', type_object_id: 'UNREAD_COMMENT_question',
  market_id: marketId, comment_id: question.id };

it('opens a question and its reply at distinct anchors with their shared root provenance', () => {
  const comments = { [marketId]: [question, reply] };
  expect(getNotificationDestination(message, comments, {})).toEqual({
    url: '/dialog/workspace/job#cquestion',
    notification: { id: message.type_object_id, marketId, commentId: question.id }
  });
  const replyMessage = { ...message, type: 'UNREAD_REPLY', type_object_id: 'UNREAD_REPLY_reply', comment_id: reply.id };
  expect(getNotificationDestination(replyMessage, comments, {})).toEqual({
    url: '/dialog/workspace/job#creply',
    notification: { id: replyMessage.type_object_id, marketId, commentId: question.id }
  });

  // Objects outside the direct-routing scope retain their existing destinations.
  expect(getNotificationDestination(message, {}, {})).toBeUndefined();
  expect(getNotificationDestination(message, {
    [marketId]: [{ ...question, comment_type: 'TODO' }]
  }, {})).toBeUndefined();
  expect(getNotificationDestination(message, {
    [marketId]: [{ ...question, comment_type: 'ISSUE' }]
  }, {})).toBeUndefined();
  expect(getNotificationDestination({ ...message, type: 'REPORT_REQUIRED' }, {
    [marketId]: [{ ...question, comment_type: 'REPORT' }]
  }, {})).toBeUndefined();
});

it('opens inline question requests, new options and option replies on their containing question page', () => {
  const inlineMarket = { id: 'inline', parent_comment_id: question.id, parent_comment_market_id: marketId };
  const markets = { marketDetails: [inlineMarket] };
  const optionComment = { id: 'option-comment', comment_type: 'JUSTIFY', investible_id: 'option' };
  const optionReply = { ...reply, id: 'option-reply', reply_id: optionComment.id, investible_id: 'option' };
  const comments = { [marketId]: [question], inline: [optionComment, optionReply] };
  const request = { ...message, type: 'UNREAD_JOB_APPROVAL_REQUEST', market_id: 'inline', comment_market_id: marketId };
  expect(getNotificationDestination(request, comments, markets)?.url).toBe('/dialog/workspace/job#cquestion');
  expect(getNotificationDestination({ ...message, type: 'UNREAD_OPTION', comment_market_id: 'inline',
    decision_investible_id: 'option' }, comments, markets)?.url).toBe('/dialog/workspace/job#optionoption');
  const destination = getNotificationDestination({ ...message, type: 'UNREAD_REPLY',
    comment_market_id: 'inline', comment_id: optionReply.id }, comments, markets);
  expect(destination).toEqual({
    url: '/dialog/workspace/job#coption-reply',
    notification: { id: message.type_object_id, marketId: 'inline', commentId: optionComment.id }
  });
});

// B-all-681: within one job, Next message follows the Unresponded order, oldest created first.
describe('unrespondedOrderWithinJobs', () => {
  const root = (id, createdAt, extra = {}) => ({ id, comment_type: 'QUESTION', investible_id: 'job',
    created_at: createdAt, ...extra });
  const notified = (id, type = 'UNREAD_COMMENT') => ({ type, type_object_id: `${type}_${id}`,
    market_id: marketId, comment_id: id });
  const older = root('older', '2026-09-01T00:00:00Z');
  const newer = root('newer', '2026-09-02T00:00:00Z');
  const olderReply = { id: 'older-reply', comment_type: 'REPLY', reply_id: older.id, investible_id: 'job',
    created_at: '2026-09-03T00:00:00Z' };
  const order = (messages, comments) =>
    unrespondedOrderWithinJobs(messages, { [marketId]: comments }, {}).map((item) => item.comment_id);

  it('opens the oldest created question first, whatever the update order', () => {
    expect(order([notified('newer'), notified('older')], [older, newer])).toEqual(['older', 'newer']);
  });

  it('sorts a reply notification with its question', () => {
    expect(order([notified('newer'), notified('older-reply', 'UNREAD_REPLY')], [older, newer, olderReply]))
      .toEqual(['older-reply', 'newer']);
  });

  it('counts suggestions and blockers but not resolved questions', () => {
    const suggestion = root('suggestion', '2026-08-01T00:00:00Z', { comment_type: 'SUGGEST' });
    const blocker = root('blocker', '2026-08-02T00:00:00Z', { comment_type: 'ISSUE' });
    const resolved = root('resolved', '2026-07-01T00:00:00Z', { resolved: true });
    expect(order([notified('newer'), notified('resolved'), notified('blocker'), notified('suggestion')],
      [newer, resolved, blocker, suggestion])).toEqual(['suggestion', 'resolved', 'blocker', 'newer']);
  });

  it('keeps other notifications and other jobs where they were', () => {
    const otherJob = root('other-job', '2026-01-01T00:00:00Z', { investible_id: 'other' });
    const task = root('task', '2026-01-01T00:00:00Z', { comment_type: 'TODO' });
    expect(order([notified('newer'), notified('task'), notified('other-job'), notified('older')],
      [older, newer, task, otherJob])).toEqual(['older', 'task', 'other-job', 'newer']);
  });
});

