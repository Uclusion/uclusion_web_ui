import { buildHashMentions } from '../src/components/TextEditors/Utilities/hashMentions';
import {
  ISSUE_TYPE,
  JUSTIFY_TYPE,
  REPLY_TYPE,
  SUGGEST_CHANGE_TYPE,
  TODO_TYPE,
} from '../src/constants/comments';

const origin = 'https://example.test';
const marketId = 'm1';

function job(id, name, ticketCode, deleted = false) {
  return {
    investible: { id, name },
    market_infos: [{ market_id: marketId, ticket_code: ticketCode, deleted }],
  };
}

function comment(fields) {
  return {
    group_id: 'g1',
    body: '<p>Body.</p>',
    ...fields,
  };
}

const investibles = [
  job('job-1', 'More natural demo', 'J-all-41'),
  job('job-2', 'Gone', 'J-all-2', true),
];

const comments = [
  comment({
    id: 'bug-1',
    comment_type: TODO_TYPE,
    ticket_code: 'B-all-666',
    body: '<p>The finder only works for jobs.</p><p>Steps stay out of the name.</p>',
  }),
  comment({
    id: 'task-1',
    comment_type: TODO_TYPE,
    investible_id: 'job-1',
    ticket_code: 'T-all-1',
    body: '<p>On a job.</p>',
  }),
  comment({
    id: 'reply-1',
    comment_type: REPLY_TYPE,
    reply_id: 'bug-1',
    ticket_code: 'C-all-1',
    body: '<p>A reply.</p>',
  }),
  comment({
    id: 'justify-1',
    comment_type: JUSTIFY_TYPE,
    ticket_code: 'E-all-1',
    body: '<p>Because the vote needed a reason.</p>',
  }),
  comment({
    id: 'sug-1',
    comment_type: SUGGEST_CHANGE_TYPE,
    resolved: true,
    ticket_code: 'S-all-9',
    body: '<p>Still findable.</p>',
  }),
  comment({
    id: 'bug-resolved',
    comment_type: TODO_TYPE,
    resolved: true,
    ticket_code: 'B-all-2',
    body: '<p>Resolved finder bug.</p>',
  }),
  comment({
    id: 'issue-1',
    comment_type: ISSUE_TYPE,
    investible_id: 'job-1',
    ticket_code: 'B-all-1',
    body: '<p>Blocker on a job.</p>',
  }),
];

function idsFor(searchTerm) {
  return buildHashMentions(investibles, comments, marketId, searchTerm, origin).map((item) => item.id);
}

it('lists open jobs and open standalone comments', () => {
  expect(idsFor('')).toEqual(['job-1', 'bug-1']);
});

it('leaves resolved comments out', () => {
  expect(idsFor('findable')).toEqual([]);
  expect(idsFor('S-all-9')).toEqual([]);
  expect(idsFor('B-all-2')).toEqual([]);
});

it('matches a standalone bug by its words and by its code', () => {
  const found = buildHashMentions(investibles, comments, marketId, 'finder', origin);
  expect(found).toHaveLength(1);
  const [bug] = found;
  expect(bug).toMatchObject({
    id: 'bug-1',
    value: 'The finder only works for jobs.',
    ticketCode: 'B-all-666',
    link: 'https://example.test/m1/B-all-666',
  });
  expect(idsFor('666')).toEqual(['bug-1']);
});

it('leaves replies and justifications out even when they are not on a job', () => {
  expect(idsFor('reply')).toEqual([]);
  expect(idsFor('C-all-1')).toEqual([]);
  expect(idsFor('reason')).toEqual([]);
  expect(idsFor('E-all-1')).toEqual([]);
});

it('does not match a word that is only in a later paragraph', () => {
  expect(idsFor('steps')).toEqual([]);
});

it('keeps a job match on name or code and drops a deleted job', () => {
  expect(idsFor('demo')).toEqual(['job-1']);
  expect(idsFor('J-all-2')).toEqual([]);
  const [jobRow] = buildHashMentions(investibles, comments, marketId, 'J-all-41', origin);
  expect(jobRow.link).toBe('https://example.test/m1/J-all-41');
});
