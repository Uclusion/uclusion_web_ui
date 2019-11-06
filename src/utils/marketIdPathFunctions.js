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

export function getInvestibleId(hash) {
  console.log(hash);
  if (!hash) {
    return null;
  }
  const search = '#investible=';
  const investibleStart = hash.indexOf(search);
  console.log(investibleStart);
  if (investibleStart === -1) {
    return null;
  }
  const idStart = investibleStart + search.length;
  const investibleId = hash.substr(idStart);
  console.log(investibleId);
  return investibleId;
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
  return `/dialog/${marketId}`;
}
