import { REPLY_TYPE, TODO_TYPE } from '../../../constants/comments';
import { getResolvedTodoThreadComments, isTodoRoot } from './marketTodoUtils';

const root = {
  id: 'root',
  comment_type: TODO_TYPE,
  group_id: 'group',
  resolved: true,
};
const groupedTask = {
  id: 'grouped-task',
  comment_type: TODO_TYPE,
  group_id: 'group',
  resolved: true,
  reply_id: 'root',
  root_comment_id: 'root',
};
const reply = {
  id: 'reply',
  comment_type: REPLY_TYPE,
  group_id: 'group',
  reply_id: 'grouped-task',
  root_comment_id: 'root',
};

test('only top-level TODO comments are roots', () => {
  expect(isTodoRoot(root)).toBe(true);
  expect(isTodoRoot(groupedTask)).toBe(false);
});

test('resolved TODO threads keep descendants without promoting grouped tasks to roots', () => {
  const anotherRoot = {...root, id: 'other-root', group_id: 'other-group'};
  const comments = getResolvedTodoThreadComments(
    [root, groupedTask, reply, anotherRoot],
    'group',
  );

  expect(comments).toEqual([root, groupedTask, reply]);
  expect(comments.filter(isTodoRoot)).toEqual([root]);
});

test('self-referential promoted roots are not duplicated as descendants', () => {
  const promotedRoot = {...root, root_comment_id: 'root'};
  expect(getResolvedTodoThreadComments([promotedRoot], 'group')).toEqual([promotedRoot]);
});
