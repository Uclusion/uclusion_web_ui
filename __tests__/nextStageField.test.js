import { nextStageField } from '../src/utils/nextStageField';

// The flags stage's own stages carry.
const stages = [
  { id: 'backlog', name: 'Backlog', allows_assignment: false, allows_issues: true },
  { id: 'approvable', name: 'Approvable', allows_assignment: true, allows_investment: true },
  { id: 'doable', name: 'Doable', allows_assignment: true, assignee_enter_only: true },
  { id: 'reviewable', name: 'Reviewable', allows_assignment: true, close_comments_on_entrance: true },
  { id: 'requires', name: 'Requires Input', allows_assignment: true, move_on_comment: true },
  { id: 'blocked', name: 'Blocked', allows_assignment: true, move_on_comment: true, allows_issues: true },
];
const marketStagesState = { market: stages };
const stage = (id) => stages.find((aStage) => aStage.id === id);

function field(currentStageId, formerStageId, assigned = ['user']) {
  return nextStageField(stage(currentStageId), formerStageId, assigned, 'market', marketStagesState);
}

// J-all-488: the field shows where the server returns a Debatable job, by the server's rule.
test('shows the former stage on Requires Input and Blocked', () => {
  expect(field('requires', 'doable')).toEqual({ value: 'doable', optionIds: ['approvable', 'doable'] });
  expect(field('blocked', 'approvable')).toEqual({ value: 'approvable', optionIds: ['approvable', 'doable'] });
});

test('shows Approvable when the former stage is Backlog, as the server returns it there', () => {
  expect(field('requires', 'backlog').value).toBe('approvable');
});

test('does not show on a stage that is not Debatable', () => {
  ['backlog', 'approvable', 'doable', 'reviewable'].forEach((id) => {
    expect(field(id, 'approvable')).toBeUndefined();
  });
});

test('offers Doable only when the job has an assignee', () => {
  expect(field('requires', 'approvable', []).optionIds).toEqual(['approvable']);
  expect(field('requires', 'approvable', ['user']).optionIds).toEqual(['approvable', 'doable']);
});

test('keeps a former stage that is not a choice so the field can show it', () => {
  expect(field('requires', 'reviewable')).toEqual({ value: 'reviewable',
    optionIds: ['reviewable', 'approvable', 'doable'] });
});

test('is empty when no former stage is recorded', () => {
  expect(field('requires', undefined).value).toBe('');
});
