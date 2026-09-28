import { createMemoryHistory } from 'history';
import { handleRichTextLinkClick, invalidEditEvent } from './windowUtils';

// J-all-486: one handler takes every plain click on an in-app link in saved rich text.
describe('handleRichTextLinkClick', () => {
  const jobUrl = '/dialog/market-a/job-a';

  function clickLink(href, modifiers = {}) {
    const history = createMemoryHistory({ initialEntries: [jobUrl] });
    const body = document.createElement('div');
    body.innerHTML = `<a href="${href}"><strong>link</strong></a>`;
    body.addEventListener('click', (event) => handleRichTextLinkClick(event, history));
    // A click the handler takes stops here. One it leaves alone reaches the document, which records
    // that and stops jsdom from trying to navigate.
    let leftToBrowser = false;
    const recordThenStop = (event) => {
      leftToBrowser = !event.defaultPrevented;
      event.preventDefault();
    };
    document.addEventListener('click', recordThenStop);
    document.body.appendChild(body);
    body.querySelector('strong').dispatchEvent(new MouseEvent('click',
      { bubbles: true, cancelable: true, ...modifiers }));
    body.remove();
    document.removeEventListener('click', recordThenStop);
    return { history, leftToBrowser };
  }

  it('navigates in the app on a plain click anywhere inside an in-app link', () => {
    const { history, leftToBrowser } = clickLink('/dialog/market-a/job-b#c1');

    expect(leftToBrowser).toBe(false);
    expect(`${history.location.pathname}${history.location.hash}`).toBe('/dialog/market-a/job-b#c1');
  });

  it.each(['ctrlKey', 'metaKey', 'shiftKey'])('leaves a click with %s to the browser', (modifier) => {
    const { history, leftToBrowser } = clickLink('/dialog/market-a/job-b', { [modifier]: true });

    expect(leftToBrowser).toBe(true);
    expect(history.location.pathname).toBe(jobUrl);
  });

  it('leaves a link to another site to the browser', () => {
    const { history, leftToBrowser } = clickLink('https://example.com/dialog/market-a/job-b');

    expect(leftToBrowser).toBe(true);
    expect(history.location.pathname).toBe(jobUrl);
  });
});

describe('invalidEditEvent', () => {
  it('never treats a click inside a link as an edit', () => {
    const link = document.createElement('a');
    link.innerHTML = '<strong>link</strong>';

    expect(invalidEditEvent({ target: link.firstChild })).toBe(true);
    expect(invalidEditEvent({ target: document.createElement('p') })).toBe(false);
  });
});
