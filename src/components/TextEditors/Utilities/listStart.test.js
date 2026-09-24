// Use Quill's bundled build so this exercises the real clipboard and editor.
jest.mock('quill', () => require('quill/dist/quill.js'));

import Quill from 'quill';
import { listStart, ListStartKeyboard, matchListStart } from './listStart';

Quill.register(listStart);
Quill.register('modules/keyboard', ListStartKeyboard, true);

function importHtml(html, readOnly) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const editor = new Quill(container, { readOnly, modules: { toolbar: false } });
  editor.clipboard.addMatcher('ol', matchListStart);
  editor.clipboard.dangerouslyPasteHTML(html);
  return editor;
}

afterEach(() => document.body.replaceChildren());

test('preserves list starts through read-only, editing, save and reload', () => {
  const html = '<ol><li data-list="ordered" data-list-start="3">Clear notifications</li>' +
    '<li data-list="bullet" class="ql-indent-1">Only after recording</li>' +
    '<li data-list="ordered">Move the job</li>' +
    '<li data-list="ordered" class="ql-indent-1" data-list-start="5">Nested fifth</li>' +
    '<li data-list="ordered" class="ql-indent-1">Nested sixth</li></ol>' +
    '<p>Ordinary list</p><ol><li data-list="ordered">First</li><li data-list="ordered">Second</li></ol>';
  for (const readOnly of [true, false]) {
    const editor = importHtml(html, readOnly);
    if (!readOnly) editor.insertText(6, 'the ', 'user');
    // Stored HTML need not retain CSS custom properties; import derives them.
    const saved = editor.root.innerHTML.replace(/ style="[^"]*"/g, '');
    const reloaded = importHtml(saved, readOnly);
    for (const current of [editor, reloaded]) {
      const items = [...current.root.querySelectorAll('li')];
      expect(items.map(item => item.getAttribute('data-list-start'))).toEqual([
        '3', null, null, '5', null, null, null,
      ]);
      expect(items.map(item => item.getAttribute('data-list'))).toEqual([
        'ordered', 'bullet', 'ordered', 'ordered', 'ordered', 'ordered', 'ordered',
      ]);
      expect(items.map(item => item.className)).toEqual([
        '', 'ql-indent-1', '', 'ql-indent-1', 'ql-indent-1', '', '',
      ]);
      expect(current.getText()).toContain(readOnly ? 'Clear notifications' : 'Clear the notifications');
      expect(items[0].style.getPropertyValue('--ql-list-start')).toBe('3');
      expect(items[3].style.getPropertyValue('--ql-list-start')).toBe('5');
    }
  }

  const pasted = importHtml('<ol start="3"><li>Third<ol start="7"><li>Seventh</li><li>Eighth</li></ol></li>' +
    '<li>Fourth</li></ol><ol><li>Restart</li><li>Second</li></ol><p>Zero start</p>' +
    '<ol start="0"><li>Zeroth</li><li>First</li></ol>', false);
  for (const current of [pasted, importHtml(pasted.root.innerHTML, true)]) {
    expect([...current.root.querySelectorAll('li')].map(item => item.getAttribute('data-list-start'))).toEqual([
      '3', '7', null, null, '1', null, '0', null,
    ]);
  }

  const split = importHtml('<ol><li data-list="ordered" data-list-start="3">Third</li>' +
    '<li data-list="ordered">Fourth</li></ol>', false);
  split.keyboard.handleEnter({ index: 5, length: 0 }, { format: split.getFormat(5) });
  split.insertText(6, 'Inserted action', 'user');
  for (const current of [split, importHtml(split.root.innerHTML, true)]) {
    expect(current.getText()).toBe('Third\nInserted action\nFourth\n');
    expect([...current.root.querySelectorAll('li')].map(item => item.getAttribute('data-list-start'))).toEqual([
      '3', null, null,
    ]);
  }
});
