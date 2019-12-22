import { VIEW_EVENT, VISIT_CHANNEL } from '../contexts/NotificationsContext/NotificationsContext';
import { intl } from '../components/ContextHacks/IntlGlobalProvider';
import { pushMessage } from './MessageBusUtils';


/** Given the pathpart _without the hash or query params
 * will extract the action, the marketId and the investibleId
 * Assumes the pathpart has a leading /
 * @param pathpart
 * @return {null}
 */
export function decomposeMarketPath(path) {
  const split = path.split('/');
  // first match is empty. because it's the leading / the action
  // so well have ["", <action>, <marketid>, <investibleid>] in that order
  const [, action, marketId, investibleId] = split;
  return { action, marketId, investibleId };
}

export function broadcastView(marketId, investibleId, isEntry) {
  const message = { marketId, investibleId, isEntry };
  console.debug(message);
  pushMessage(
    VISIT_CHANNEL,
    {
      event: VIEW_EVENT,
      message,
    },
  );
}

export function navigate(history, to) {
  const {
    marketId: fromMarketId,
    investibleId: fromInvestibleId,
  } = decomposeMarketPath(history.location.pathname);
  broadcastView(fromMarketId, fromInvestibleId, false);
  history.push(to);
  const {
    marketId: toMarketId,
    investibleId: toInvestibleId,
  } = decomposeMarketPath(history.location.pathname);
  broadcastView(toMarketId, toInvestibleId, true);
}

/**
 *
 * @param history
 * @param crumbs A list objects of the type { name, link }
 * @param includeHome if Home Should be prepended to the list
 */
export function makeBreadCrumbs(history, crumbs = [], includeHome = true) {
  const homeName = intl.formatMessage({ id: 'homeBreadCrumb' });
  const homeCrumb = [];
  if (includeHome) {
    homeCrumb.push({ name: homeName, link: '/', image: '/images/Uclusion_Wordmark_Color.png' });
  }
  const myCrumbs = homeCrumb.concat(crumbs);
  const breadCrumbs = myCrumbs.map((crumb) => {
    const { name, link, image } = crumb;
    return {
      title: name,
      image,
      onClick: () => navigate(history, link),
    };
  });
  return breadCrumbs;
}

export function createTitle(fullTitle, titleSize) {
  if (!fullTitle) {
    return '';
  }
  if (!fullTitle.substring) {
    return fullTitle;
  }
  if (fullTitle.length < titleSize) {
    return fullTitle;
  }
  return `${fullTitle.substring(0, titleSize)}...`;
}

export function formInviteLink(marketId) {
  const current = window.location.href;
  const url = new URL(current);
  const invitePath = `invite/${marketId}`;
  url.pathname = invitePath;
  url.search = '';
  return url.toString();
}

export function formInvestibleLink(marketId, investibleId) {
  return `/dialog/${marketId}/${investibleId}`;
}

/**
 * Forms a link to a given market id with the given subpath. Usually used when switching
 * to a different market
 * @param marketId
 * @returns {string}
 */
export function formMarketLink(marketId) {
  return `/dialog/${marketId}`;
}

export function formMarketArchivesLink(marketId) {
  return `/dialogArchives/${marketId}`;
}
