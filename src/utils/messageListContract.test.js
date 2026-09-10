import fs from 'fs';
import path from 'path';
import { findMessagesForCommentIds, getUnreadCount } from './messageUtils';
import { getThreads } from './commentFunctions';

// J-all-440 changed this helper family to take a message list instead of messagesState,
// but getUnreadCount forwards its second argument to findMessageForCommentId, and MarketTodos kept
// passing the state object to it. Every bug sub-tab badge then blew up on (messages || []).filter,
// which took stage down. The source scan below enforces the contract at each call site, because a
// unit test on the helpers cannot see what a caller hands them.

const ROOT = { id: 'root-1', root_comment_id: 'root-1' };
const REPLY = { id: 'reply-1', root_comment_id: 'root-1' };

const unread = (commentId) => ({ comment_id: commentId, is_highlighted: true });
const read = (commentId) => ({ comment_id: commentId, is_highlighted: false });

describe('getUnreadCount', () => {
  it('counts a highlighted message on a root comment', () => {
    expect(getUnreadCount([ROOT], [unread('root-1')])).toEqual(1);
  });

  it('counts a highlighted message on a reply folded in by getThreads (S-all-199)', () => {
    expect(getUnreadCount(getThreads([ROOT], [ROOT, REPLY]), [unread('reply-1')])).toEqual(1);
  });

  it('ignores messages that are not highlighted', () => {
    expect(getUnreadCount([ROOT], [read('root-1')])).toEqual(0);
  });

  it('ignores messages for comments outside the supplied thread', () => {
    expect(getUnreadCount([ROOT], [unread('root-2')])).toEqual(0);
  });

  it('treats a missing message list as no unread', () => {
    expect(getUnreadCount([ROOT], undefined)).toEqual(0);
  });
});

// The sort in MarketTodos passed a bare comment.id to this id-LIST helper. String
// .includes still matched the primary comment_id by luck, but _.intersection drops a primitive
// string (array-like, yet not an object), so the comment_list branch never fired and a batched
// notification never counted toward a bug row's position.
describe('findMessagesForCommentIds', () => {
  const batched = { comment_id: 'other-1', comment_list: ['root-1', 'root-9'], is_highlighted: true };

  it('matches a message on its primary comment_id', () => {
    const found = findMessagesForCommentIds(['root-1'], [{ comment_id: 'root-1', is_highlighted: true }], true);
    expect(found).toHaveLength(1);
  });

  it('matches a message that only carries the id in its comment_list', () => {
    expect(findMessagesForCommentIds(['root-1'], [batched], true)).toEqual([batched]);
  });

  it('finds nothing for an id absent from both comment_id and comment_list', () => {
    expect(findMessagesForCommentIds(['root-2'], [batched], true)).toEqual([]);
  });

  it('does not match on a substring of an id', () => {
    expect(findMessagesForCommentIds(['root-1'], [{ comment_id: 'root', is_highlighted: true }], true)).toEqual([]);
  });
});

// Helpers whose second argument is a message list, not messagesState.
const LIST_TAKING_HELPERS = [
  'findMessagesForGroupId',
  'findMessagesForInvestibleIds',
  'findMessagesForInvestibleId',
  'findMessagesForCommentIds',
  'findMessageForCommentId',
  'getUnreadCount'
];

// A bare context object handed to a list parameter - the exact shape that crashed.
const STATE_SHAPED = ['messagesState', 'state'];

function sourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return sourceFiles(full);
    }
    return entry.name.endsWith('.js') && !entry.name.endsWith('.test.js') ? [full] : [];
  });
}

// Splits the top-level arguments of a call whose opening paren is at `open`, so that a nested
// call such as getThreads(redComments, comments) stays one argument.
function topLevelArgs(source, open) {
  const args = [];
  let depth = 0;
  let current = '';
  for (let i = open; i < source.length; i++) {
    const char = source[i];
    if (char === '(' || char === '[' || char === '{') {
      depth++;
      if (depth === 1) {
        continue;
      }
    } else if (char === ')' || char === ']' || char === '}') {
      depth--;
      if (depth === 0) {
        args.push(current);
        return args;
      }
    }
    if (depth === 1 && char === ',') {
      args.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  return args;
}

// Helpers whose FIRST argument is a list of ids. A bare `foo.id` there is the defect above.
const ID_LIST_HELPERS = ['findMessagesForInvestibleIds', 'findMessagesForCommentIds'];

describe('message list helper call sites (J-all-440 contract)', () => {
  const files = sourceFiles(path.join(__dirname, '..'));

  function callSites(helper) {
    const sites = [];
    files.forEach((file) => {
      const source = fs.readFileSync(file, 'utf8');
      const pattern = new RegExp(`(?<![\\w.])${helper}\\s*\\(`, 'g');
      let match;
      while ((match = pattern.exec(source)) !== null) {
        // Skip the declaration itself, which names parameters rather than passing values.
        if (/(?:function|const|let|var)\s+$/.test(source.slice(0, match.index))) {
          continue;
        }
        sites.push({
          args: topLevelArgs(source, match.index + match[0].length - 1),
          where: `${path.relative(path.join(__dirname, '..'), file)}:${source.slice(0, match.index).split('\n').length}`
        });
      }
    });
    return sites;
  }

  it.each(ID_LIST_HELPERS)('%s is always handed a list of ids, never a single id', (helper) => {
    const offenders = callSites(helper)
      .filter(({ args }) => /\.id$/.test((args[0] || '').trim()))
      .map(({ args, where }) => `${where} -> ${helper}(${args[0].trim()}, ...)`);
    expect(offenders).toEqual([]);
  });

  it.each(LIST_TAKING_HELPERS)('%s is never handed messagesState itself', (helper) => {
    const offenders = [];
    files.forEach((file) => {
      const source = fs.readFileSync(file, 'utf8');
      const pattern = new RegExp(`(?<![\\w.])${helper}\\s*\\(`, 'g');
      let match;
      while ((match = pattern.exec(source)) !== null) {
        const open = match.index + match[0].length - 1;
        // Skip the declaration itself, which names the parameter rather than passing a value.
        if (/(?:function|const|let|var)\s+$/.test(source.slice(0, match.index))) {
          continue;
        }
        const secondArg = (topLevelArgs(source, open)[1] || '').trim();
        if (STATE_SHAPED.includes(secondArg)) {
          const line = source.slice(0, match.index).split('\n').length;
          offenders.push(`${path.relative(path.join(__dirname, '..'), file)}:${line} -> ${helper}(..., ${secondArg})`);
        }
      }
    });
    expect(offenders).toEqual([]);
  });
});
