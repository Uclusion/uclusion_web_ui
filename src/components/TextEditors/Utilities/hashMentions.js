import _ from 'lodash';
import { getMarketInfo } from '../../../utils/userFunctions';
import { formCommentLink, formInvestibleLink } from '../../../utils/marketIdPathFunctions';
import { nameFromDescription } from '../../../utils/stringFunctions';
import {
  ISSUE_TYPE,
  QUESTION_TYPE,
  REPORT_TYPE,
  SUGGEST_CHANGE_TYPE,
  TODO_TYPE,
} from '../../../constants/comments';

// B-all-666: view-level bugs, suggestions, questions and notes. Replies,
// justifications, and anything resolved stay out, or the list grows without
// bound. A comment that belongs to a job stays out too; the job itself is
// already in the list.
const STANDALONE_COMMENT_TYPES = new Set([
  TODO_TYPE,
  ISSUE_TYPE,
  QUESTION_TYPE,
  SUGGEST_CHANGE_TYPE,
  REPORT_TYPE,
]);

function matchesTerm(searchTerm, name, ticketCode) {
  if (!searchTerm) {
    return true;
  }
  const term = searchTerm.toLowerCase();
  return (name || '').toLowerCase().includes(term) || (ticketCode || '').toLowerCase().includes(term);
}

function absoluteTicketLink(origin, marketId, storedTicketCode, fallbackPath) {
  if (storedTicketCode) {
    return `${origin}/${marketId}/${storedTicketCode}`;
  }
  return `${origin}${fallbackPath}`;
}

/**
 * Jobs and standalone comments for the '#' mention list. Matching is the job
 * rule: the visible name or the ticket code, case insensitive.
 */
export function buildHashMentions(investiblesRaw, commentsRaw, marketId, searchTerm, origin) {
  const items = [];
  (investiblesRaw || []).forEach((inv) => {
    const marketInfo = getMarketInfo(inv, marketId);
    if (!marketInfo || marketInfo.deleted || !inv.investible) {
      return;
    }
    const { name, id } = inv.investible;
    const ticketCode = marketInfo.ticket_code ? decodeURI(marketInfo.ticket_code) : '';
    if (!matchesTerm(searchTerm, name, ticketCode)) {
      return;
    }
    items.push({
      id,
      value: name,
      ticketCode,
      isJob: true,
      link: absoluteTicketLink(origin, marketId, marketInfo.ticket_code, formInvestibleLink(marketId, id)),
    });
  });

  (commentsRaw || []).forEach((comment) => {
    if (comment.reply_id || comment.investible_id || comment.deleted || comment.resolved
      || !STANDALONE_COMMENT_TYPES.has(comment.comment_type)) {
      return;
    }
    const ticketCode = comment.ticket_code ? decodeURI(comment.ticket_code) : '';
    const name = nameFromDescription(comment.body) || ticketCode;
    if (!name || !matchesTerm(searchTerm, name, ticketCode)) {
      return;
    }
    items.push({
      id: comment.id,
      value: name,
      ticketCode,
      isJob: true,
      link: absoluteTicketLink(
        origin,
        marketId,
        comment.ticket_code,
        formCommentLink(marketId, comment.group_id, undefined, comment.id)
      ),
    });
  });

  return _.orderBy(items, [(item) => (item.value || '').toLowerCase()]);
}
