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
    homeCrumb.push({ name: homeName, link: '/'});
  }
  const myCrumbs = homeCrumb.concat(crumbs);
  const breadCrumbs = myCrumbs.map((crumb) => {
    const { name, link, image, onClick } = crumb;
    const usedOnClick = onClick || (() => navigate(history, link));
    return {
      title: name,
      image,
      onClick: usedOnClick,
    };
  });
  return breadCrumbs;
}

/**
 * Makes a breadcrumb chain that includes /home/archives
 * @param history
 * @param crumbs
 */
export function makeArchiveBreadCrumbs(history, crumbs = []) {
  const archiveCrumb = {
    name: intl.formatMessage({ id: 'archivesTitle'}),
    link: '/archives',
  };
  const myCrumbs = [archiveCrumb, ...crumbs];
  return makeBreadCrumbs(history, myCrumbs);
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

export function formInvestibleLinkWithPrefix(preFix, marketId, investibleId) {
  return `/${preFix}/${marketId}/${investibleId}`;
}

export function formInvestibleLink(marketId, investibleId) {
  return formInvestibleLinkWithPrefix('dialog', marketId, investibleId);
}

export function formatMarketLinkWithPrefix(prefix, marketId) {
  return `/${prefix}/${marketId}`;
}

/**
 * Forms a link to a given market id with the given subpath. Usually used when switching
 * to a different market
 * @param marketId
 * @returns {string}
 */
export function formMarketLink(marketId) {
  return formatMarketLinkWithPrefix('dialog', marketId);
}

export function formMarketArchivesLink(marketId) {
  return formatMarketLinkWithPrefix('dialogArchives', marketId);
}

export function formMarketEditLink(marketId) {
  return formatMarketLinkWithPrefix('marketEdit', marketId);
}

export function formMarketManageLink(marketId) {
  return formatMarketLinkWithPrefix('marketManage', marketId);
}

export function formMarketAddInvestibleLink(marketId) {
  return formatMarketLinkWithPrefix('investibleAdd', marketId);
}
