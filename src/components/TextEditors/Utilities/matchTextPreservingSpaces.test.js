// Use Quill's bundled build so these tests exercise its real clipboard in Jest.
jest.mock('quill', () => require('quill/dist/quill.js'));

import Quill from 'quill';
import CustomCodeBlock from '../CustomCodeBlock';
import matchTextPreservingSpaces from './matchTextPreservingSpaces';

Quill.register(CustomCodeBlock, true);

function importHtml(html, readOnly = false) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const editor = new Quill(container, { readOnly, modules: { toolbar: false } });
  editor.clipboard.addMatcher(Node.TEXT_NODE, matchTextPreservingSpaces);
  editor.clipboard.dangerouslyPasteHTML(html);
  return editor;
}

afterEach(() => {
  document.body.replaceChildren();
});

// The four stored list items in R-Marketing-510 that displayed as seven items.
const archivedItems = [
  'A work list was presented: answer with the number of J-Demo-1.',
  'A new question exists with options and the agent has voted on one: add the\n   briefed suggestion for that option, under that option.',
  'That option has been rewritten and the suggestion resolved: cast the briefed\n   vote, with its reason, on that same option.',
  'The capsule records the decision: tell the agent there is nothing further and\n   ask for its report.',
];

test.each([false, true])('keeps the archived list at four items (readOnly=%s)', (readOnly) => {
  const html = `<ol>${archivedItems.map(text =>
    `<li data-list="ordered"><span class="ql-ui"></span>${text}</li>`).join('')}</ol>`;
  const editor = importHtml(html, readOnly);

  expect(editor.root.querySelectorAll('li[data-list="ordered"]')).toHaveLength(4);
  expect(editor.getText()).toBe(
    'A work list was presented: answer with the number of J-Demo-1.\n' +
    'A new question exists with options and the agent has voted on one: add the    briefed suggestion for that option, under that option.\n' +
    'That option has been rewritten and the suggestion resolved: cast the briefed    vote, with its reason, on that same option.\n' +
    'The capsule records the decision: tell the agent there is nothing further and    ask for its report.\n'
  );
});

test('preserves repeated spaces, tabs and inline formatting in an existing list', () => {
  const editor = importHtml('<ol><li>  First  <strong>bold  words</strong>\t end  </li><li>Second</li></ol>');

  expect(editor.root.querySelectorAll('li')).toHaveLength(2);
  expect(editor.getText()).toBe('  First  bold  words\t end  \nSecond\n');
  expect(editor.root.querySelector('strong').textContent).toBe('bold  words');
});

test('joins source continuations in a bulleted list without changing its list type', () => {
  const editor = importHtml('<ul><li>First\r\ncontinuation</li><li>Second\rcontinuation</li></ul>');

  expect(editor.root.querySelectorAll('li[data-list="bullet"]')).toHaveLength(2);
  expect(editor.getText()).toBe('First continuation\nSecond continuation\n');
});

test('retains explicit break and paragraph boundaries inside list items', () => {
  const editor = importHtml('<ol><li>First<br>Second</li><li><p>Third</p><p>Fourth</p></li></ol>');

  expect(editor.root.querySelectorAll('li')).toHaveLength(4);
  expect(editor.getText()).toBe('First\nSecond\nThird\nFourth\n');
});

test.each(['pre', 'div class="ql-code-block"'])('retains preformatted newlines inside a list (%s)', (tag) => {
  const closingTag = tag.split(' ')[0];
  const editor = importHtml(`<ol><li><${tag}>  first\n    second</${closingTag}></li></ol>`);

  expect(editor.getText()).toBe('  first\n    second\n');
});

test('keeps the existing whitespace behavior outside lists', () => {
  const editor = importHtml('<p>  First\n    second  </p><pre>  code\n    continuation</pre>');

  expect(editor.getText()).toBe('  First\n    second  \n  code\n    continuation\n');
});
