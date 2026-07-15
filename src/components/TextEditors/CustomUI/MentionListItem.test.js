import React from 'react';
import ReactDOMServer from 'react-dom/server';
import MentionListItem from './MentionListItem';

it('renders hint rows without any img element', () => {
  const html = ReactDOMServer.renderToString(
    <MentionListItem mentionResult={{ id: 'peopleMentionHint', value: 'use # for jobs', disabled: true }}/>);
  console.log('hint html:', html);
  expect(html).not.toContain('<img');
});

it('renders job rows without any img element', () => {
  const html = ReactDOMServer.renderToString(
    <MentionListItem mentionResult={{ id: 'abc', value: 'Sync still takes too long', ticketCode: 'J-all-339',
      isJob: true }}/>);
  console.log('job html:', html);
  expect(html).not.toContain('<img');
});

// J-all-348: the dropdown is static HTML (renderToString + innerHTML), so the Avatar's JS image
// fallback cannot run - a d=404 gravatar URL would show the browser's broken image icon for any
// email without a gravatar account. The rows must request a server-side default instead.
it('person rows request the gravatar silhouette, never the 404 default', () => {
  const html = ReactDOMServer.renderToString(
    <MentionListItem mentionResult={{ id: 'p1', value: 'David Israel', email: 'disrael@uclusion.com' }}/>);
  expect(html).toContain('<img');
  expect(html).toContain('d=mp');
  expect(html).not.toContain('d=404');
});
