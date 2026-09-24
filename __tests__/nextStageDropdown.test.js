import { nextStageDropdown } from '../src/utils/nextStageDropdown';

const stages = [
  { id: 'approvable', name: 'Approvable', allows_investment: true },
  { id: 'doable', name: 'Doable', assignee_enter_only: true },
  { id: 'blocked', name: 'Blocked', move_on_comment: true, allows_issues: true },
  { id: 'requires', name: 'Requires Input', move_on_comment: true },
];

function comment(id, creationStageId, extra = {}) {
  return { id, creation_stage_id: creationStageId, ...extra };
}

test('starts at the shared creation stage and offers Doable and Approvable when they differ', () => {
  const dropdown = nextStageDropdown([
    comment('q1', 'approvable'),
    comment('q2', 'approvable'),
    comment('done', 'doable', { resolved: true }),
    comment('plain', undefined),
  ], stages);
  expect(dropdown).toEqual({
    value: 'approvable',
    optionIds: ['approvable', 'doable'],
    commentIds: ['q1', 'q2'],
  });
});

test('offers both Doable and Approvable when the shared stage is neither', () => {
  const dropdown = nextStageDropdown([comment('q1', 'requires')], stages);
  expect(dropdown.optionIds).toEqual(['requires', 'doable', 'approvable']);
});

test('hides the field when unresolved creation stages disagree', () => {
  expect(nextStageDropdown([
    comment('q1', 'approvable'),
    comment('q2', 'doable'),
  ], stages)).toBeUndefined();
});

test('hides the field when no unresolved comment has a creation stage', () => {
  expect(nextStageDropdown([
    comment('q1', 'approvable', { resolved: true }),
    comment('q2', undefined),
  ], stages)).toBeUndefined();
});

test('ignores a reply whose root is resolved', () => {
  const dropdown = nextStageDropdown([
    comment('q1', 'doable'),
    comment('root', 'approvable', { resolved: true }),
    comment('reply', 'approvable', { root_comment_id: 'root' }),
  ], stages);
  expect(dropdown.commentIds).toEqual(['q1']);
  expect(dropdown.optionIds).toEqual(['doable', 'approvable']);
});
