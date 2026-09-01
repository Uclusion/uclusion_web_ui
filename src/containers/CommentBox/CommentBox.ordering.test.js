import {
  ISSUE_TYPE,
  QUESTION_TYPE,
  REPLY_TYPE,
  SUGGEST_CHANGE_TYPE
} from '../../constants/comments';
import { getSortedRoots } from './CommentBox';

jest.mock('../../components/Comments/Comment', () => () => null);
jest.mock('react-hotkeys-hook', () => ({
  useHotkeys: () => {},
}));

const searchResults = {
  search: '',
  results: [],
  parentResults: [],
};

const oldest = {
  id: 'a-oldest-question',
  comment_type: QUESTION_TYPE,
  created_at: '2026-08-20T10:00:00Z',
  updated_at: '2026-08-20T14:00:00Z',
};
const middle = {
  id: 'middle-issue',
  comment_type: ISSUE_TYPE,
  created_at: '2026-08-20T11:00:00Z',
  updated_at: '2026-08-20T11:00:00Z',
};
const newest = {
  id: 'newest-suggestion',
  comment_type: SUGGEST_CHANGE_TYPE,
  created_at: '2026-08-20T12:00:00Z',
  updated_at: '2026-08-20T12:00:00Z',
};
const replyToOldest = {
  id: 'reply-to-oldest',
  comment_type: REPLY_TYPE,
  root_comment_id: oldest.id,
  reply_id: oldest.id,
  created_at: '2026-08-20T15:00:00Z',
  updated_at: '2026-08-20T15:00:00Z',
};
const comments = [newest, replyToOldest, middle, oldest];

describe('getSortedRoots', () => {
  it('orders roots oldest-first using only root creation time', () => {
    const sorted = getSortedRoots(comments, searchResults, false, false, false, undefined, false, true);

    expect(sorted.map((comment) => comment.id)).toEqual([
      oldest.id,
      middle.id,
      newest.id,
    ]);
  });

  it('keeps latest-activity ordering available for responded comments', () => {
    const sorted = getSortedRoots(comments, searchResults, false, false, true);

    expect(sorted.map((comment) => comment.id)).toEqual([
      oldest.id,
      newest.id,
      middle.id,
    ]);
  });
});
