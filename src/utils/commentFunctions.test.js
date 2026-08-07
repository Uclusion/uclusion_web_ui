import { isAssistanceRespondedByHuman } from './commentFunctions';

const planningMarketId = 'planning-market';
const inlineMarketId = 'inline-option-market';
const aiUserId = 'ai-user';
const humanUserId = 'human-user';

function presence(id, email, investments = []) {
  return { id, email, investments };
}

function comment(id, createdBy, updatedAt, extra = {}) {
  return {
    id,
    created_by: createdBy,
    updated_at: updatedAt,
    is_sent: true,
    resolved: false,
    ...extra,
  };
}

describe('isAssistanceRespondedByHuman option chronology', () => {
  const parentQuestion = comment('parent-question', aiUserId, '2026-07-28T10:00:00Z', {
    inline_market_id: inlineMarketId,
  });
  const marketPresences = [
    presence(aiUserId, ''),
    presence(humanUserId, 'human@example.com'),
  ];
  const marketPresencesState = {
    [planningMarketId]: marketPresences,
    [inlineMarketId]: marketPresences,
  };

  it('uses comments and replies inside options as turns on the parent question', () => {
    const aiOptionQuestion = comment('option-question', aiUserId, '2026-07-28T10:01:00Z', {
      investible_id: 'option-id',
    });
    const humanOptionReply = comment('option-reply', humanUserId, '2026-07-28T10:02:00Z', {
      investible_id: 'option-id',
      reply_id: aiOptionQuestion.id,
      root_comment_id: aiOptionQuestion.id,
    });
    const aiFollowUp = comment('option-ai-follow-up', aiUserId, '2026-07-28T10:03:00Z', {
      investible_id: 'option-id',
      reply_id: humanOptionReply.id,
      root_comment_id: aiOptionQuestion.id,
    });

    expect(isAssistanceRespondedByHuman(
      parentQuestion,
      [parentQuestion],
      marketPresences,
      marketPresencesState,
      { [inlineMarketId]: [aiOptionQuestion, humanOptionReply] }
    )).toBe(true);

    expect(isAssistanceRespondedByHuman(
      parentQuestion,
      [parentQuestion],
      marketPresences,
      marketPresencesState,
      { [inlineMarketId]: [aiOptionQuestion, humanOptionReply, aiFollowUp] }
    )).toBe(false);
  });

  it('does not let comments outside an option change the parent state', () => {
    const marketLevelComment = comment('inline-market-comment', humanUserId, '2026-07-28T10:02:00Z');

    expect(isAssistanceRespondedByHuman(
      parentQuestion,
      [parentQuestion],
      marketPresences,
      marketPresencesState,
      { [inlineMarketId]: [marketLevelComment] }
    )).toBe(false);
  });

  it('treats resolving nested assistance as activity by the resolver', () => {
    const resolvedAIQuestion = comment(
      'resolved-option-question',
      aiUserId,
      '2026-07-28T10:02:00Z',
      {
        investible_id: 'option-id',
        resolved: true,
        updated_by: humanUserId,
      }
    );

    expect(isAssistanceRespondedByHuman(
      parentQuestion,
      [parentQuestion],
      marketPresences,
      marketPresencesState,
      { [inlineMarketId]: [resolvedAIQuestion] }
    )).toBe(true);

    expect(isAssistanceRespondedByHuman(
      parentQuestion,
      [parentQuestion],
      marketPresences,
      marketPresencesState,
      {
        [inlineMarketId]: [{
          ...resolvedAIQuestion,
          auto_closed: true,
        }],
      }
    )).toBe(false);
  });

  it('ignores deleted and unsent activity retained in the inline comments context', () => {
    const deletedHumanComment = comment('deleted-option-comment', humanUserId, '2026-07-28T10:02:00Z', {
      investible_id: 'option-id',
      deleted: true,
    });
    const unsentHumanComment = comment('draft-option-comment', humanUserId, '2026-07-28T10:03:00Z', {
      investible_id: 'option-id',
      is_sent: false,
    });

    expect(isAssistanceRespondedByHuman(
      parentQuestion,
      [parentQuestion],
      marketPresences,
      marketPresencesState,
      { [inlineMarketId]: [deletedHumanComment, unsentHumanComment] }
    )).toBe(false);
  });

  it('uses vote investments instead of vote reasons or address-only records as activity', () => {
    const humanVoteReason = comment('vote-reason', humanUserId, '2026-07-28T10:03:00Z', {
      investible_id: 'option-id',
      comment_type: 'JUSTIFY',
    });
    const presencesWithAddressOnly = [
      presence(aiUserId, ''),
      presence(humanUserId, 'human@example.com', [{
        updated_at: '2026-07-28T10:04:00Z',
      }]),
    ];

    expect(isAssistanceRespondedByHuman(
      parentQuestion,
      [parentQuestion],
      marketPresences,
      { ...marketPresencesState, [inlineMarketId]: presencesWithAddressOnly },
      { [inlineMarketId]: [humanVoteReason] }
    )).toBe(false);
  });

  it('keeps a question Responded when the AI changes its option vote', () => {
    const aiOptionQuestion = comment('option-question', aiUserId, '2026-07-28T10:01:00Z', {
      investible_id: 'option-id',
    });
    const afterHumanVote = [
      presence(aiUserId, ''),
      presence(humanUserId, 'human@example.com', [{
        investible_id: 'option-id',
        quantity: 5,
        updated_at: '2026-07-28T10:02:00Z',
      }]),
    ];
    const afterAIFollowUpVote = [
      presence(aiUserId, '', [{
        investible_id: 'option-id',
        quantity: 4,
        updated_at: '2026-07-28T10:03:00Z',
      }]),
      ...afterHumanVote.slice(1),
    ];

    expect(isAssistanceRespondedByHuman(
      parentQuestion,
      [parentQuestion],
      marketPresences,
      { ...marketPresencesState, [inlineMarketId]: afterHumanVote },
      { [inlineMarketId]: [aiOptionQuestion] }
    )).toBe(true);

    expect(isAssistanceRespondedByHuman(
      parentQuestion,
      [parentQuestion],
      marketPresences,
      { ...marketPresencesState, [inlineMarketId]: afterAIFollowUpVote },
      { [inlineMarketId]: [aiOptionQuestion] }
    )).toBe(true);
  });

  it('keeps a voted question Responded when the AI replies inside an option', () => {
    const aiOptionQuestion = comment('option-question', aiUserId, '2026-07-28T10:01:00Z', {
      investible_id: 'option-id',
    });
    const aiClarification = comment('option-ai-clarification', aiUserId, '2026-07-28T10:03:00Z', {
      investible_id: 'option-id',
      reply_id: aiOptionQuestion.id,
      root_comment_id: aiOptionQuestion.id,
    });
    const afterHumanVote = [
      presence(aiUserId, ''),
      presence(humanUserId, 'human@example.com', [{
        investible_id: 'option-id',
        quantity: 5,
        updated_at: '2026-07-28T10:02:00Z',
      }]),
    ];

    // T-all-2449: the vote already answered the question, so a later AI clarification inside an
    // option must not flip it back to Unresponded
    expect(isAssistanceRespondedByHuman(
      parentQuestion,
      [parentQuestion],
      marketPresences,
      { ...marketPresencesState, [inlineMarketId]: afterHumanVote },
      { [inlineMarketId]: [aiOptionQuestion, aiClarification] }
    )).toBe(true);

    // An AI edit of the question itself is a real new turn and still reopens it
    const editedQuestion = { ...parentQuestion, updated_at: '2026-07-28T10:04:00Z' };
    expect(isAssistanceRespondedByHuman(
      editedQuestion,
      [editedQuestion],
      marketPresences,
      { ...marketPresencesState, [inlineMarketId]: afterHumanVote },
      { [inlineMarketId]: [aiOptionQuestion, aiClarification] }
    )).toBe(false);
  });
});
