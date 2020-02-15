import React from 'react';
import ReportProblemIcon from '@material-ui/icons/ReportProblem';
import ContactSupportIcon from '@material-ui/icons/ContactSupport';
import ChangeHistoryIcon from '@material-ui/icons/ChangeHistory';
import { ISSUE_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE } from '../../constants/comments';

/**
 * Note, this iconography is used all over, so don't change
 * the colors here. Change it by cloning the icon you get back
 * @param type
 * @returns {null|*}
 */
export function getCommentTypeIcon(type) {
  switch (type) {
    case ISSUE_TYPE:
      return <ReportProblemIcon />;
    case QUESTION_TYPE:
      return <ContactSupportIcon />;
    case SUGGEST_CHANGE_TYPE:
      return <ChangeHistoryIcon />;
    default:
      return null;
  }
}

export function scrollToCommentAddBox() {
  const box = document.getElementById('cabox');
  if (box) {
    box.scrollIntoView();
  }
}