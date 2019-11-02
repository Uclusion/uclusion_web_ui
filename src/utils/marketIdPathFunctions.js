import queryString from 'query-string';
import { Hub } from '@aws-amplify/core';
import { VIEW_EVENT, VISIT_CHANNEL } from '../contexts/NotificationsContext/NotificationsContext';
import { intl } from '../components/IntlComponents/IntlGlobalProvider';

/**
 * Gets the market id from the URL if it's present in it.
 * @returns {string}
 */
export function getMarketId(path, search = '/dialog/') {
  if (!path) {
    return null;
  }
  if (!path.startsWith(search)) {
    return null;
  }
  const pathPart = path.substr(search.length);
  const investibleSlashLocation = pathPart.indexOf('/');
  if (investibleSlashLocation === -1) {
    return pathPart;
  }
  return pathPart.substr(0, investibleSlashLocation);
}

export function getInvestibleId(path) {
  if (!path) {
    return null;
  }
  const search = '#investible=';
  const investibleStart = path.indexOf(search);
  if (investibleStart === -1) {
    return null;
  }
  const idStart = investibleStart + search.length;
  return path.substr(idStart);
}

export function broadcastView(marketId, investibleIdOrContext, isEntry) {
  if (marketId && investibleIdOrContext && investibleIdOrContext !== 'add') {
    const message = { marketId, investibleIdOrContext, isEntry };
    console.debug('Dispatching to notification');
    Hub.dispatch(
      VISIT_CHANNEL,
      {
        event: VIEW_EVENT,
        message,
      },
    );
  }
}

export function navigate(history, to) {
  function getMarketIdAndInvestible(history) {
    const { location } = history;
    const { pathname, hash } = location;
    const marketId = getMarketId(pathname);
    if (marketId) {
      const values = queryString.parse(hash);
      const { investible } = values;
      return { marketId, investible };
    }
    return {};
  }

  const {
    marketId: fromMarketId,
    investible: fromInvestibleId,
  } = getMarketIdAndInvestible(history);
  broadcastView(fromMarketId, fromInvestibleId, false);
  history.push(to);
  const {
    marketId: toMarketId,
    investible: toInvestibleId,
  } = getMarketIdAndInvestible(history);
  broadcastView(toMarketId, toInvestibleId, true);
}


/**
 *
 * @param history
 * @param crumbs A list objects of the type { name, link }
 * @param includeHome if Home Should be prepended to the list
 */
export function makeBreadCrumbs(history, crumbs = [], includeHome = true) {
  const homeName = intl.formatMessage({ id : 'homeBreadCrumb' });
  const homeCrumb = [];
  if (includeHome) {
    homeCrumb.push({ name: homeName, link: '/' })
  }
  const myCrumbs = homeCrumb.concat(crumbs);
  const breadCrumbs = myCrumbs.map((crumb) => {
    const { name, link } = crumb;
    return {
      title: name,
      onClick: () => navigate(history, link),
    };
  });
  return breadCrumbs;
}

export function formInvestibleLink(marketId, investibleId) {
  return `/dialog/${marketId}#investible=${investibleId}`;
}

/**
 * Forms a link to a given market id with the given subpath. Usually used when switching
 * to a different market
 * @param marketId
 * @returns {string}
 */
export function formMarketLink(marketId) {
  return formInvestibleLink(marketId, 'context');
}
