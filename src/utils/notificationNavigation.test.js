import { getNotificationDestination } from './notificationNavigation';

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
