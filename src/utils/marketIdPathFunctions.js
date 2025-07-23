import { pushMessage } from './MessageBusUtils'
import _ from 'lodash'
import { getInvestibleName } from '../contexts/InvestibesContext/investiblesContextHelper'
import { getMarket } from '../contexts/MarketsContext/marketsContextHelper'
import { marketsContextHack } from '../contexts/MarketsContext/MarketsContext';
import { investibleContextHack } from '../contexts/InvestibesContext/InvestiblesContext';
import { getComment, getCommentRoot } from '../contexts/CommentsContext/commentsContextHelper';
import { commentsContextHack } from '../contexts/CommentsContext/CommentsContext'
import { JOB_WIZARD_TYPE } from '../constants/markets';
import { ticketContextHack } from '../contexts/TicketContext/TicketIndexContext';
import {
  getTicket,
  isInvestibleTicket,
  isOptionTicket,
  isTicketPath
} from '../contexts/TicketContext/ticketIndexContextHelper';
import { getInboxTarget, getMessageId } from '../contexts/NotificationsContext/notificationsContextHelper';

export const VISIT_CHANNEL = 'VisitChannel';
export const VIEW_EVENT = 'pageView';
export const MARKET_TODOS_HASH = 'Todos';
export const DISCUSSION_HASH = 'Discussion';
export const BACKLOG_HASH = 'Backlog';
export const ASSIGNED_HASH = 'Assigned';

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
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
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

export function formInboxItemLinkFromId(id) {
  return `${getInboxTarget()}/${id}`;
}

export function formInboxItemLink(message) {
  return `${getInboxTarget()}/${getMessageId(message)}`;
}

export function formInviteLink(marketToken) {
  const current = window.location.href;
  const url = new URL(current);
  url.pathname = `invite/${marketToken}`;
  url.search = '';
  url.hash = '';
  return url.toString();
}

function getNameForComment(comment, investibleState) {
  const readableTicketCode = decodeURI(comment.ticket_code);
  if (comment.investible_id) {
    const investibleName = getInvestibleName(investibleState, comment.investible_id);
    return `${investibleName} - ${readableTicketCode}`;
  }
  // Don't use name from description as that's not a real name
  return readableTicketCode;
}

export function getUrlForTicketPath(pathname, ticketState, marketsState, commentsState) {
  const ticket = getTicket(ticketState, pathname.substring(1));
  if (ticket) {
    if (isInvestibleTicket(pathname)) {
      const { marketId, investibleId } = ticket;
      if (isOptionTicket(pathname)) {
        const market = getMarket(marketsState, marketId) || {};
        const { parent_comment_id: aParentCommentId, parent_comment_market_id: aParentMarketId } = market;
        const parentComment = getComment(commentsState, aParentMarketId, aParentCommentId) || {};
        const { investible_id: parentInvestibleId, market_id: parentMarketId, group_id: parentGroupId } = parentComment;
        if (parentInvestibleId) {
          return `${formInvestibleLink(parentMarketId, parentInvestibleId)}#option${investibleId}`;
        }
        return `${formMarketLink(parentMarketId, parentGroupId)}#option${investibleId}`;
      }
      return formInvestibleLink(marketId, investibleId);
    }
    const { marketId, commentId, groupId, investibleId } = ticket;
    return formCommentLink(marketId, groupId, investibleId, commentId);
  }
  return undefined;
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
      if (isInvestibleTicket(urlParts.pathname)) {
        const { investibleId } = ticket;
        const name = getInvestibleName(investibleState, investibleId);
        if (!_.isEmpty(name)) {
          return name;
        }
      } else {
        const { marketId, commentId } = ticket;
        const rootComment = getCommentRoot(commentsState, marketId, commentId);
        if (rootComment) {
          return getNameForComment(rootComment, investibleState);
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
            return getNameForComment(rootComment, investibleState);
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

export function formatGroupLinkWithSuffix(suffix, marketId, groupId) {
  return `/dialog/${marketId}?groupId=${groupId}#${suffix}`;
}

export function removeHash(history) {
  history.replace(window.location.pathname + window.location.search);
}

export function navigateToOption(history, parentMarketId, parentInvestibleId, groupId, id) {
  if (parentInvestibleId) {
    navigate(history, `${formInvestibleLink(parentMarketId, parentInvestibleId)}#option${id}`);
  } else if (parentMarketId) {
    navigate(history, `${formMarketLink(parentMarketId, groupId)}#option${id}`);
  }
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

export function formManageUsersLink(marketId) {
  return `/manageUsers/${marketId}`;
}

export function formGroupEditLink(marketId, groupId) {
  return formatGroupLinkWithPrefix('groupEdit', marketId, groupId);
}

export function formGroupManageLink(marketId, groupId) {
  return formatGroupLinkWithPrefix('groupManage', marketId, groupId);
}

export function formGroupArchiveLink(marketId, groupId) {
  return formatGroupLinkWithPrefix('groupArchive', marketId, groupId);
}

export function formInvestibleAddCommentLink(wizardType, investibleId, marketId, commentType, typeObjectId) {
  let link = `/wizard#type=${wizardType.toLowerCase()}&investibleId=${investibleId}`;
  if (marketId) {
    link += `&marketId=${marketId}`;
  }
  if (commentType) {
    link += `&commentType=${commentType}`;
  }
  if (typeObjectId) {
    link += `&typeObjectId=${typeObjectId}`
  }
  return link;
}

export function formMarketAddCommentLink(wizardType, marketId, groupId, commentType) {
  let link = `/wizard#type=${wizardType}&marketId=${marketId}&groupId=${groupId}`;
  if (commentType !== undefined) {
    link += `&commentType=${commentType}`;
  }
  return link;
}

export function formWizardLink(wizardType, marketId, investibleId, groupId, commentId, typeObjectId) {
  let link = `/wizard#type=${wizardType.toLowerCase()}&marketId=${marketId}`;
  if (investibleId) {
    link += `&investibleId=${investibleId}`;
  }
  if (groupId) {
    link += `&groupId=${groupId}`;
  }
  if (commentId) {
    link += `&commentId=${commentId}`;
  }
  if (typeObjectId) {
    link += `&typeObjectId=${typeObjectId}`
  }
  return link;

}

export function formMarketAddInvestibleLink(marketId, groupId, jobType, typeObjectId, wizardType=JOB_WIZARD_TYPE)
{
  let baseLink = `/wizard#type=${wizardType}&marketId=${marketId}&groupId=${groupId}`
  if (typeObjectId) {
    baseLink += `&typeObjectId=${typeObjectId}`
  }
  if (jobType !== undefined) {
    return `${baseLink}&jobType=${jobType}`;
  }
  return baseLink;
}
