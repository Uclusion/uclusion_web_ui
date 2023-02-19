import { intl } from '../components/ContextHacks/IntlGlobalProvider'
import { pushMessage } from './MessageBusUtils'
import _ from 'lodash'
import { getInvestibleName } from '../contexts/InvestibesContext/investiblesContextHelper'
import { getMarket } from '../contexts/MarketsContext/marketsContextHelper'
import { marketsContextHack } from '../contexts/MarketsContext/MarketsContext';
import { investibleContextHack } from '../contexts/InvestibesContext/InvestiblesContext';
import { getCommentRoot } from '../contexts/CommentsContext/commentsContextHelper'
import { nameFromDescription } from './stringFunctions'
import { commentsContextHack } from '../contexts/CommentsContext/CommentsContext'
import { JOB_WIZARD_TYPE } from '../constants/markets';
import { ticketContextHack } from '../contexts/TicketContext/TicketIndexContext';
import { getTicket, isJobTicket, isTicketPath } from '../contexts/TicketContext/ticketIndexContextHelper';

export const VISIT_CHANNEL = 'VisitChannel';
export const VIEW_EVENT = 'pageView';

/** Given the pathpart _without the hash or query params
 * will extract the action, the marketId and the investibleId
 * Assumes the pathpart has a leading /
 * @param path
 * @return {null}
 */
export function decomposeMarketPath(path) {
  const split = path.split('/');
  // first match is empty. because it's the leading / the action
  // so well have ["", <action>, <marketid>, <investibleid>] in that order
  const [, action, marketId, investibleId] = split;
  return { action, marketId, investibleId };
}

export function broadcastView(marketId, investibleId, isEntry, action, to) {
  const message = { marketId, investibleId, isEntry, action, to };
  pushMessage(
    VISIT_CHANNEL,
    {
      event: VIEW_EVENT,
      message,
    },
  );
}

export function preventDefaultAndProp(event) {
  event.stopPropagation();
  event.preventDefault();
}

export function navigate(history, to, insideUseEffect, doNotAddToHistory) {
  const {
    action: fromAction,
    marketId: fromMarketId,
    investibleId: fromInvestibleId,
  } = decomposeMarketPath(history.location.pathname);
  broadcastView(fromMarketId, fromInvestibleId, false, fromAction);
  if (to) {
    // If going somewhere new previous scroll position no longer relevant
    window.scrollTo(0, 0);
    if (insideUseEffect) {
      // Without the set timeout the use effect can be re-run before the push is complete
      // though not clear why that run wouldn't run it again.
      setTimeout(() => {
        history.push(to);
      }, 0);
    } else {
      if (doNotAddToHistory) {
        history.replace(to);
      } else {
        history.push(to);
      }
    }
  } else {
    if (insideUseEffect) {
      setTimeout(() => {
        history.goBack();
      }, 1);
    } else {
      history.goBack();
    }
  }
  const {
    action: toAction,
    marketId: toMarketId,
    investibleId: toInvestibleId,
  } = decomposeMarketPath(history.location.pathname);
  broadcastView(toMarketId, toInvestibleId, true, toAction, to);
}

export function baseNavListItem(linkRoot, icon, textId, anchorId, howManyNum, alwaysShow) {
  const text = intl.formatMessage({ id: textId });
  if (howManyNum === 0 && alwaysShow !== true) {
    return {icon, text, num: howManyNum};
  }
  const useAnchor = anchorId ? anchorId : textId;
  return {icon, text, target: `${linkRoot}#${useAnchor}`, num: howManyNum}
}

export function formInviteLink(marketToken) {
  const current = window.location.href;
  const url = new URL(current);
  url.pathname = `invite/${marketToken}`;
  url.search = '';
  url.hash = '';
  return url.toString();
}

export function getNameForUrl(url) {
  const marketState = marketsContextHack;
  const investibleState = investibleContextHack;
  const commentsState = commentsContextHack;
  const ticketState = ticketContextHack;
  const urlParts = new URL(url);
  if (isTicketPath(urlParts.pathname)) {
    const ticket = getTicket(ticketState, urlParts.pathname.substring(1));
    if (ticket) {
      if (isJobTicket(urlParts.pathname)) {
        const { investibleId } = ticket;
        const name = getInvestibleName(investibleState, investibleId);
        if (!_.isEmpty(name)) {
          return name;
        }
      } else {
        const { marketId, commentId } = ticket;
        const rootComment = getCommentRoot(commentsState, marketId, commentId);
        if (rootComment) {
          const name = nameFromDescription(rootComment.body);
          if (!_.isEmpty(name)) {
            return name;
          }
        }
      }
    }
  } else {
    const isComment = urlParts.hash && urlParts.hash.startsWith('#c') && !urlParts.hash.startsWith('#cv');
    if (urlParts.host === window.location.host && (!urlParts.hash || isComment)) {
      const { action, marketId, investibleId } = decomposeMarketPath(urlParts.pathname);
      if (action === 'dialog') {
        if (isComment) {
          const commentId = urlParts.hash.substring(2, urlParts.hash.length);
          const rootComment = getCommentRoot(commentsState, marketId, commentId);
          if (rootComment) {
            const name = nameFromDescription(rootComment.body);
            if (!_.isEmpty(name)) {
              return name;
            }
          }
        }
        if (investibleId) {
          const name = getInvestibleName(investibleState, investibleId);
          if (!_.isEmpty(name)) {
            return name;
          }
        }
        if (marketId) {
          const market = getMarket(marketState, marketId);
          if (!_.isEmpty(market)) {
            const { name } = market;
            return name;
          }
        }
      }
    }
  }
  return undefined;
}

export function openInNewTab(url) {
  const win = window.open(url, '_blank');
  win.focus();
}

export function formCommentLink(marketId, groupId, investibleId, commentId) {
  const commentPart = `#c${commentId}`;
  if (!_.isEmpty(investibleId)) {
    return formInvestibleLink(marketId, investibleId) + commentPart;
  }
  return formMarketLink(marketId, groupId) + commentPart;
}

export function formArchiveCommentLink(marketId, groupId, commentId) {
  return formGroupArchiveLink(marketId, groupId) + `#c${commentId}`;
}

export function formInvestibleLinkWithPrefix(preFix, marketId, investibleId) {
  return `/${preFix}/${marketId}/${investibleId}`;
}

export function formInvestibleLink(marketId, investibleId) {
  return formInvestibleLinkWithPrefix('dialog', marketId, investibleId);
}

export function formatGroupLinkWithPrefix(prefix, marketId, groupId) {
  return `/${prefix}/${marketId}?groupId=${groupId}`;
}

export function formCommentEditReplyLink(marketId, commentId, isReply=false) {
  let base = `/comment/${marketId}/${commentId}`;
  if (isReply) {
    return `${base}?reply=true#c${commentId}`;
  }
  return `${base}#c${commentId}`;
}

/**
 * Forms a link to a given market id with the given subpath. Usually used when switching
 * to a different market
 * @param marketId
 * @param groupId
 * @returns {string}
 */
export function formMarketLink(marketId, groupId) {
  return formatGroupLinkWithPrefix('dialog', marketId, groupId);
}

export function formMarketEditLink(marketId) {
  return `/marketEdit/${marketId}`;
}

export function formGroupEditLink(marketId, groupId) {
  return formatGroupLinkWithPrefix('groupEdit', marketId, groupId);
}

export function formGroupArchiveLink(marketId, groupId) {
  return formatGroupLinkWithPrefix('groupArchive', marketId, groupId);
}

export function formInvestibleAddCommentLink(wizardType, investibleId, marketId, commentType) {
  let link = `/wizard#type=${wizardType.toLowerCase()}&investibleId=${investibleId}`;
  if (marketId) {
    link += `&marketId=${marketId}`;
  }
  if (commentType) {
    link += `&commentType=${commentType}`;
  }
  return link;
}

export function formMarketAddCommentLink(wizardType, marketId, groupId, commentType) {
  return `/wizard#type=${wizardType}&marketId=${marketId}&groupId=${groupId}&commentType=${commentType}`
}

export function formWizardCollaboratorsLink(wizardType, marketId, investibleId) {
  return `/wizard#type=${wizardType.toLowerCase()}&marketId=${marketId}&investibleId=${investibleId}`
}

export function formMarketAddInvestibleLink(marketId, groupId, assigneeId) {
  const baseLink = `/wizard#type=${JOB_WIZARD_TYPE}&marketId=${marketId}&groupId=${groupId}`
  if (assigneeId) {
    return `${baseLink}&assigneeId=${assigneeId}`;
  }
  return baseLink;
}
