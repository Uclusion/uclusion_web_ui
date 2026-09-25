import {
  changeInvestibleStageOnCommentClose,
  doesCommentResolutionRestoreStage,
  isAssistanceRespondedByHuman,
  moveToTaskPayload
} from './commentFunctions';
import { ISSUE_TYPE, QUESTION_TYPE, TODO_TYPE } from '../constants/comments';

const planningMarketId = 'planning-market';
const inlineMarketId = 'inline-option-market';
const aiUserId = 'ai-user';
const humanUserId = 'human-user';
const workflowAssigned = [humanUserId];

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

function assistanceComment(id, createdBy, commentType = QUESTION_TYPE) {
  return comment(id, createdBy, '2026-08-20T10:00:00Z', {
    comment_type: commentType,
  });
}

describe('doesCommentResolutionRestoreStage', () => {
  const activePresences = [
    presence(aiUserId, ''),
    presence(humanUserId, 'human@example.com'),
  ];
  const stages = [
    { id: 'doable-stage', name: 'Doable' },
    { id: 'requires-input-stage', name: 'Requires Input', move_on_comment: true },
    { id: 'backlog-stage', name: 'Backlog', allows_issues: true },
    { id: 'reviewable-stage', name: 'Reviewable' },
  ];
  const stageContext = {
    stages,
    currentStage: stages[1],
    formerStageId: stages[0].id,
  };

  it('restores after resolving the only question even when its AI presence is banned', () => {
    const aiQuestion = assistanceComment('ai-question', aiUserId);
    const bannedAIPresences = [
      { ...presence(aiUserId, ''), market_banned: true },
      presence(humanUserId, 'human@example.com'),
    ];

    expect(doesCommentResolutionRestoreStage(
      aiQuestion,
      [aiQuestion],
      workflowAssigned,
      bannedAIPresences
    )).toBe(true);
  });

  it('does not restore while another active AI question remains open', () => {
    const currentQuestion = assistanceComment('current-question', aiUserId);
    const otherQuestion = assistanceComment('other-question', aiUserId, QUESTION_TYPE);
    otherQuestion.creation_stage_id = 'doable-stage';

    expect(doesCommentResolutionRestoreStage(
      currentQuestion,
      [currentQuestion, otherQuestion],
      workflowAssigned,
      activePresences,
      stageContext
    )).toBe(false);
  });

  it('counts an open AI question whichever stage it was opened in', () => {
    // B-all-673: like an assignee's question, it locks while the job is in a locking lane
    const currentQuestion = assistanceComment('current-question', humanUserId);
    const backlogAIQuestion = assistanceComment('backlog-ai-question', aiUserId);
    backlogAIQuestion.creation_stage_id = 'backlog-stage';

    expect(doesCommentResolutionRestoreStage(
      currentQuestion,
      [currentQuestion, backlogAIQuestion],
      workflowAssigned,
      activePresences,
      stageContext
    )).toBe(false);
  });

  it('keeps an AI question created in Approvable as a blocker', () => {
    // B-all-673: no one should approve a job while an AI question is open
    const approvableStages = [...stages, { id: 'approvable-stage', name: 'Approvable', allows_investment: true }];
    const currentQuestion = assistanceComment('current-question', humanUserId);
    const approvableAIQuestion = assistanceComment('approvable-ai-question', aiUserId);
    approvableAIQuestion.creation_stage_id = 'approvable-stage';

    expect(doesCommentResolutionRestoreStage(
      currentQuestion,
      [currentQuestion, approvableAIQuestion],
      workflowAssigned,
      activePresences,
      { stages: approvableStages, currentStage: stages[1], formerStageId: 'approvable-stage' }
    )).toBe(false);
  });

  it('keeps an AI question as a blocker while stage context is unavailable', () => {
    const currentQuestion = assistanceComment('current-question', humanUserId);
    const aiQuestion = assistanceComment('ai-question', aiUserId);
    aiQuestion.creation_stage_id = 'backlog-stage';

    expect(doesCommentResolutionRestoreStage(
      currentQuestion,
      [currentQuestion, aiQuestion],
      workflowAssigned,
      activePresences,
      { stages: [], currentStage: {}, formerStageId: 'doable-stage' }
    )).toBe(false);
  });

  it('does not restore when the job is no longer in Requires Input', () => {
    const currentQuestion = assistanceComment('current-question', aiUserId);

    expect(doesCommentResolutionRestoreStage(
      currentQuestion,
      [currentQuestion],
      workflowAssigned,
      activePresences,
      { stages, currentStage: stages[0], formerStageId: 'requires-input-stage' }
    )).toBe(false);
  });

  it('does not restore when resolving an unassigned question while an assigned question remains', () => {
    const currentQuestion = assistanceComment('current-question', 'other-human');
    const assignedQuestion = assistanceComment('assigned-question', humanUserId);

    expect(doesCommentResolutionRestoreStage(
      currentQuestion,
      [currentQuestion, assignedQuestion],
      workflowAssigned,
      activePresences
    )).toBe(false);
  });

  it('ignores another AI question after that AI is banned', () => {
    const currentQuestion = assistanceComment('current-question', humanUserId);
    const bannedAIQuestion = assistanceComment('banned-ai-question', aiUserId);
    const bannedAIPresences = activePresences.map((marketPresence) =>
      marketPresence.id === aiUserId ? { ...marketPresence, market_banned: true } : marketPresence
    );

    expect(doesCommentResolutionRestoreStage(
      currentQuestion,
      [currentQuestion, bannedAIQuestion],
      workflowAssigned,
      bannedAIPresences
    )).toBe(true);
  });

  it('ignores a remaining unassigned human question like the backend', () => {
    const currentQuestion = assistanceComment('current-question', aiUserId);
    const otherQuestion = assistanceComment('other-question', 'other-human');

    expect(doesCommentResolutionRestoreStage(
      currentQuestion,
      [currentQuestion, otherQuestion],
      workflowAssigned,
      activePresences
    )).toBe(true);
  });

  it('does not restore from Blocking while any workflow comment remains open', () => {
    const currentIssue = assistanceComment('current-issue', humanUserId, ISSUE_TYPE);
    const otherQuestion = assistanceComment('other-question', aiUserId);

    expect(doesCommentResolutionRestoreStage(
      currentIssue,
      [currentIssue, otherQuestion],
      workflowAssigned,
      activePresences
    )).toBe(false);
  });
});

describe('changeInvestibleStageOnCommentClose', () => {
  it('updates the target market without dropping other market infos', () => {
    const dispatch = jest.fn();
    const otherMarketInfo = { id: 'other-info', market_id: 'other-market', stage: 'other-stage' };
    const targetMarketInfo = {
      id: 'target-info',
      market_id: planningMarketId,
      stage: 'requires-input-stage',
      former_stage_id: 'doable-stage',
      assigned: [humanUserId],
    };

    changeInvestibleStageOnCommentClose(
      [otherMarketInfo, targetMarketInfo],
      {
        id: 'job-1',
        created_at: '2026-08-20T10:00:00Z',
        updated_at: '2026-08-20T10:00:00Z',
      },
      dispatch,
      '2026-08-20T10:01:00Z',
      { [planningMarketId]: [{ id: 'doable-stage', name: 'Doable', allows_assignment: true }] },
      planningMarketId
    );

    expect(dispatch).toHaveBeenCalledTimes(1);
    const { investibles } = dispatch.mock.calls[0][0];
    expect(investibles[0].market_infos).toEqual(expect.arrayContaining([
      otherMarketInfo,
      expect.objectContaining({ market_id: planningMarketId, stage: 'doable-stage' }),
    ]));
  });
});

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


describe('moveToTaskPayload (B-all-658)', () => {
  it('declares the reopen when the suggestion is resolved', () => {
    const payload = moveToTaskPayload('market-1', 'comment-1', true);

    // Without this the PATCH is refused with 403 Comment resolved and the move
    // silently does nothing, which is the reported defect.
    expect(payload.resolved).toBe(false);
    expect(payload.commentType).toBe(TODO_TYPE);
    expect(payload.marketId).toBe('market-1');
    expect(payload.commentId).toBe('comment-1');
  });

  it('sends no reopen for a comment that is already open', () => {
    const payload = moveToTaskPayload('market-1', 'comment-1', false);

    // An ordinary move must not carry a reopen, or it would clobber a resolve
    // another person made while this move was in flight.
    expect('resolved' in payload).toBe(false);
    expect(payload.commentType).toBe(TODO_TYPE);
  });
});
