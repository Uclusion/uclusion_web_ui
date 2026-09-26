import React, { act, useState } from 'react';
import { createRoot } from 'react-dom/client';
import useCommentDiff from './useCommentDiff';

const note = { id: 'note', comment_type: 'REPORT' };
const notification = { id: 'UNREAD_COMMENT_note', marketId: 'market', commentId: 'note' };

function NotePreview({ comment = note, location }) {
  const [preference, setPreference] = useState({ showDiff: false });
  const [showDiff, toggleDiff] = useCommentDiff(comment, 'market', location,
    preference.showDiff, setPreference);
  return <button onClick={toggleDiff}>{showDiff ? 'Changes' : 'Current text'}</button>;
}

describe('note change display on notification entry', () => {
  let container;
  let root;
  const previousActEnvironment = global.IS_REACT_ACT_ENVIRONMENT;

  beforeAll(() => { global.IS_REACT_ACT_ENVIRONMENT = true; });
  afterAll(() => { global.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment; });
  beforeEach(() => {
    container = document.createElement('div');
    root = createRoot(container);
  });
  afterEach(() => act(() => root.unmount()));

  function render(location, comment = note) {
    act(() => root.render(<NotePreview location={location} comment={comment} />));
  }

  it('shows changes again for a later notification while preserving manual and ordinary-navigation choices', () => {
    const entry = { key: 'first', state: { notification: { ...notification, entryId: 'first' } } };
    render(entry);
    expect(container.textContent).toBe('Changes');
    act(() => container.querySelector('button').click());
    render(entry);
    expect(container.textContent).toBe('Current text');
    render({ ...entry, key: 'hash-cleanup' });
    expect(container.textContent).toBe('Current text');

    render({ key: 'second', state: { notification: { ...notification, entryId: 'second' } } });
    expect(container.textContent).toBe('Changes');
    render({ key: 'ordinary' });
    expect(container.textContent).toBe('Current text');
    act(() => container.querySelector('button').click());
    render({ key: 'another-ordinary' });
    expect(container.textContent).toBe('Changes');
  });

  it('leaves job notes and other notification targets at their saved preference', () => {
    render({ key: 'job', state: { notification } }, { ...note, investible_id: 'job' });
    expect(container.textContent).toBe('Current text');
    render({ key: 'other-note', state: { notification: { ...notification, commentId: 'other' } } });
    expect(container.textContent).toBe('Current text');
    render({ key: 'other-market', state: { notification: { ...notification, marketId: 'other' } } });
    expect(container.textContent).toBe('Current text');
  });
});
