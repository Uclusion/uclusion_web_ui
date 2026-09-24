// Use Quill's bundled build so these tests exercise its real clipboard in Jest.
jest.mock('quill', () => require('quill/dist/quill.js'));

import Quill from 'quill';
import matchTableHeaderCell from './matchTableHeaderCell';

function importHtml(html, readOnly = false) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const editor = new Quill(container, { readOnly, modules: { toolbar: false, table: true } });
  editor.clipboard.addMatcher('th', matchTableHeaderCell);
  editor.clipboard.dangerouslyPasteHTML(html);
  return editor;
}

function cells(editor) {
  return [...editor.root.querySelectorAll('tr')]
    .map((row) => [...row.querySelectorAll('td')].map((cell) => cell.textContent));
}

afterEach(() => {
  document.body.replaceChildren();
});

// The shape markdown_to_quill_html stores for a Markdown table, as in R-all-3711.
const storedTable = '<table><thead><tr><th>Tool</th><th>Calls</th><th>JSON-RPC bytes</th></tr></thead>' +
  '<tbody><tr><td>get_job thread_only</td><td>10</td><td>31,443</td></tr></tbody></table>';

test.each([false, true])('keeps each header cell its own cell (readOnly=%s)', (readOnly) => {
  expect(cells(importHtml(storedTable, readOnly))).toEqual([
    ['Tool', 'Calls', 'JSON-RPC bytes'],
    ['get_job thread_only', '10', '31,443'],
  ]);
});

test('leaves a header cell that is already a line of its own alone', () => {
  const html = '<table><thead><tr><th><p>Tool</p></th><th><p>Calls</p></th></tr></thead>' +
    '<tbody><tr><td>a</td><td>b</td></tr></tbody></table>';
  expect(cells(importHtml(html))).toEqual([['Tool', 'Calls'], ['a', 'b']]);
});
