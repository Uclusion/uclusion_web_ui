import React from 'react';
import ReportProblemIcon from '@material-ui/icons/ReportProblem';
import ContactSupportIcon from '@material-ui/icons/ContactSupport';
import ChangeHistoryIcon from '@material-ui/icons/ChangeHistory';
import ReplyIcon from '@material-ui/icons/Reply';
import FormatAlignJustifyIcon from '@material-ui/icons/FormatAlignJustify';
import { ISSUE_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE, JUSTIFY_TYPE, REPLY_TYPE } from '../../constants/comments';

export function getCommentTypeIcon(type) {
  switch (type) {
    case ISSUE_TYPE:
      return <ReportProblemIcon color="error" />;
    case QUESTION_TYPE:
      return <ContactSupportIcon />;
    case SUGGEST_CHANGE_TYPE:
      return <ChangeHistoryIcon />;
    default:
      return null;
  }
}

export function scrollToCommentAddBox(commentAddRef) {
  if (commentAddRef.current) {
    commentAddRef.current.scrollIntoView();
  }
}