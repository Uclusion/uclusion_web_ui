import React, { act, useContext } from 'react';
import { createRoot } from 'react-dom/client';
import { createMemoryHistory } from 'history';
import { Router } from 'react-router';
import { ScrollContext, ScrollProvider } from './ScrollContext';

jest.mock('../utils/marketIdPathFunctions', () => ({
  ASSIGNED_HASH: 'JobProgress', BACKLOG_HASH: 'insideBacklogSection', DISCUSSION_HASH: 'discussionSection',
  decomposeMarketPath: (pathname) => ({ action: pathname.split('/')[1] }),
  removeHash: (history) => history.replace(history.location.pathname + history.location.search, history.location.state)
}));

function Target() {
  const [fragment, suppressed, suppress] = useContext(ScrollContext);
  return <div id="ctarget" data-highlighted={fragment === 'ctarget' && suppressed !== 'target'}>
    <button onClick={() => suppress('target')}>Edit</button>
  </div>;
}

it('briefly highlights visible targets, including repeated notification entries and delayed rendering', async () => {
  jest.useFakeTimers();
  const previousActEnvironment = window.IS_REACT_ACT_ENVIRONMENT;
  window.IS_REACT_ACT_ENVIRONMENT = true;
  const history = createMemoryHistory({ initialEntries: ['/inbox'] });
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  const rectangles = jest.spyOn(Element.prototype, 'getClientRects').mockReturnValue([{}]);
  const scrollTo = jest.spyOn(window, 'scrollTo').mockImplementation(() => {});
  const originalScrollIntoView = Element.prototype.scrollIntoView;
  Element.prototype.scrollIntoView = jest.fn();
  try {
    act(() => root.render(<Router history={history}><ScrollProvider><Target /></ScrollProvider></Router>));
    const enter = (entryId) => act(() => history.push('/dialog/market/job#ctarget', {
      notification: { id: 'UNREAD_COMMENT_target', entryId, marketId: 'market', commentId: 'target' }
    }));
    enter('first');
    act(() => jest.advanceTimersByTime(0));
    expect(container.querySelector('#ctarget').dataset.highlighted).toBe('true');
    expect(history.location.hash).toBe('');
    act(() => jest.advanceTimersByTime(500));
    act(() => container.querySelector('button').click());
    expect(container.querySelector('#ctarget').dataset.highlighted).toBe('false');
    enter('second');
    act(() => jest.advanceTimersByTime(0));
    expect(container.querySelector('#ctarget').dataset.highlighted).toBe('true');
    act(() => jest.advanceTimersByTime(1500));
    expect(container.querySelector('#ctarget').dataset.highlighted).toBe('true');
    act(() => jest.advanceTimersByTime(500));
    expect(container.querySelector('#ctarget').dataset.highlighted).toBe('false');
    expect(history.location.state.notification.entryId).toBe('second');

    // A hidden destination can become visible after its page opens the containing section.
    rectangles.mockReturnValue([]);
    enter('delayed');
    act(() => jest.advanceTimersByTime(3000));
    expect(container.querySelector('#ctarget').dataset.highlighted).toBe('false');
    expect(history.location.hash).toBe('#ctarget');
    rectangles.mockReturnValue([{}]);
    await act(async () => container.querySelector('#ctarget').setAttribute('data-visible', 'true'));
    expect(container.querySelector('#ctarget').dataset.highlighted).toBe('true');
    expect(history.location.hash).toBe('');
    act(() => jest.advanceTimersByTime(2000));
    expect(container.querySelector('#ctarget').dataset.highlighted).toBe('false');

    // A page that consumes the hash first must not leave a highlight with no expiry.
    enter('consumed');
    act(() => history.replace(history.location.pathname, history.location.state));
    act(() => jest.advanceTimersByTime(10000));
    expect(container.querySelector('#ctarget').dataset.highlighted).toBe('false');

    // Ordinary links, including the destination after creation, use the same brief highlight.
    act(() => history.push('/dialog/market/job#ctarget'));
    act(() => jest.advanceTimersByTime(0));
    expect(container.querySelector('#ctarget').dataset.highlighted).toBe('true');
    act(() => jest.advanceTimersByTime(2000));
    expect(container.querySelector('#ctarget').dataset.highlighted).toBe('false');
  } finally {
    act(() => root.unmount());
    container.remove();
    rectangles.mockRestore();
    scrollTo.mockRestore();
    Element.prototype.scrollIntoView = originalScrollIntoView;
    window.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
    jest.useRealTimers();
  }
});
