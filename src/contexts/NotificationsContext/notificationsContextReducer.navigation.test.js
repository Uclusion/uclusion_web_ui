import reducer, { addNavigation } from './notificationsContextReducer';

function urls(state) {
  return state.navigations.map((navigation) => navigation.url);
}

// B-all-680: Back can return to a spot on a job, which lives in the URL's hash.
it('keeps a spot on a job while its job exists and drops it with the job', () => {
  const spot = '/dialog/market-a/job-a#cv8bc6bb1f-d328-43a4-8d5c-39f7c34bafb8';
  const other = '/dialog/market-a/job-b';
  const kept = reducer({ messages: [], navigations: [] }, addNavigation(spot, ['/dialog/market-a/job-a']));
  expect(urls(kept)).toEqual([spot]);

  const later = reducer(kept, addNavigation(other, ['/dialog/market-a/job-a', other]));
  expect(urls(later)).toEqual([spot, other]);

  const jobGone = reducer(later, addNavigation(other, [other]));
  expect(urls(jobGone)).toEqual([other]);
});

it('still requires an exact match for a hash entry that is not on a job', () => {
  const state = reducer({ messages: [], navigations: [] }, addNavigation('/wizard#type=bug', ['/wizard']));
  expect(urls(state)).toEqual([]);
});
