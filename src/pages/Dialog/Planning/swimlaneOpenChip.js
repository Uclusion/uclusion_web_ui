import React from 'react';
import { useHistory } from 'react-router';
import { Tooltip, useTheme } from '@material-ui/core';
import { useIntl } from 'react-intl';
import {
  formCommentLink,
  navigate,
  preventDefaultAndProp,
} from '../../../utils/marketIdPathFunctions';
import {
  ISSUE_TYPE,
  QUESTION_TYPE,
  REPLY_TYPE,
  SUGGEST_CHANGE_TYPE,
  TODO_TYPE,
} from '../../../constants/comments';
import { outlinedChipStyle } from '../../../components/CustomChip/chipStyles';
import { displayedCommentRoots } from '../../../containers/CommentBox/commentOrder';
import { isAssistanceRespondedByHuman } from '../../../utils/commentFunctions';

export function firstDisplayedOpenItem(comments, investibleId, commentTypes, section, {
  searchResults, investiblesState, marketPresencesState, commentsState, marketPresences,
} = {}) {
  const investibleComments = (comments || []).filter((comment) => comment.investible_id === investibleId);
  const replies = investibleComments.filter((comment) => comment.comment_type === REPLY_TYPE);
  const openRoots = investibleComments.filter((comment) => !comment.reply_id && !comment.resolved
    && !comment.deleted);
  const orderContexts = { investiblesState, marketPresencesState, commentsState };
  if (section === 'tasks') {
    const todos = openRoots.filter((comment) => comment.comment_type === TODO_TYPE);
    return displayedCommentRoots(todos.concat(replies), searchResults, {
      useInProgressSorting: true,
      investibleCommentsForSort: investibleComments,
      ...orderContexts,
    }).find((comment) => commentTypes.includes(comment.comment_type));
  }
  const assistance = openRoots.filter((comment) =>
    [QUESTION_TYPE, SUGGEST_CHANGE_TYPE, ISSUE_TYPE].includes(comment.comment_type));
  const unresponded = assistance.filter((comment) => !isAssistanceRespondedByHuman(comment, investibleComments,
    marketPresences, marketPresencesState, commentsState));
  if (unresponded.some((comment) => commentTypes.includes(comment.comment_type))) {
    return displayedCommentRoots(unresponded.concat(replies), searchResults, {
      oldestFirst: true,
      ...orderContexts,
    }).find((comment) => commentTypes.includes(comment.comment_type));
  }
  const responded = assistance.filter((comment) => !unresponded.includes(comment));
  return displayedCommentRoots(responded.concat(replies), searchResults, {
    simpleOrdering: true,
    ...orderContexts,
  }).find((comment) => commentTypes.includes(comment.comment_type));
}

function openChipTooltipId(comment) {
  if (comment?.comment_type === QUESTION_TYPE) {
    return 'notificationGoToQuestion';
  }
  if (comment?.comment_type === SUGGEST_CHANGE_TYPE) {
    return 'notificationGoToSuggestion';
  }
  return 'notificationGoToTask';
}

export function SwimlaneOpenChip({ labelNum, toolTipId, chipColor = 'orange', target }) {
  const intl = useIntl();
  const theme = useTheme();
  const history = useHistory();
  if (labelNum <= 0) {
    return null;
  }
  return (
    <Tooltip title={intl.formatMessage({ id: target ? openChipTooltipId(target) : toolTipId })}>
      <span className={'MuiTabItem-tag'} style={{...outlinedChipStyle(chipColor, theme.palette.type === 'dark'),
        cursor: target ? 'pointer' : undefined,
        marginRight: '0.5rem',
        borderRadius: 22, paddingLeft: '8px', paddingRight: '8px', paddingTop: '2px', paddingBottom: '2px',
        display: 'inline-flex', alignItems: 'center', fontSize: '0.75rem', lineHeight: 1.2}}
            onClick={target ? (event) => {
              preventDefaultAndProp(event);
              navigate(history, formCommentLink(target.market_id, target.group_id, target.investible_id, target.id));
            } : undefined}>
        {labelNum} {intl.formatMessage({ id: 'open' })}
      </span>
    </Tooltip>
  );
}

