import React from 'react';
import PropTypes from 'prop-types';
import QuestionIcon from '@material-ui/icons/ContactSupport';
import AssignmentIcon from '@material-ui/icons/Assignment';
import ReplyIcon from '@material-ui/icons/Reply';
import { Block, Notes } from '@material-ui/icons';
import LightbulbOutlined from '../CustomChip/LightbulbOutlined';
import {
  ISSUE_TYPE,
  QUESTION_TYPE,
  REPLY_TYPE,
  REPORT_TYPE,
  SUGGEST_CHANGE_TYPE,
  TODO_TYPE,
} from '../../constants/comments';

// The clean outlined comment-type indicator (T-all-2178 / C-all-986) used
// everywhere a comment shows its type - white fill, colored border, colored
// text - replacing the older solid CardType chip in comment contexts. On
// mobile it collapses to just the icon to stay compact.
const TYPE_CHIP = {
  [ISSUE_TYPE]: { label: 'Blocker', border: '#E85757', color: '#C8362F', icon: Block },
  [SUGGEST_CHANGE_TYPE]: { label: 'Suggestion', border: '#F29100', color: '#B96F00', icon: LightbulbOutlined },
  [QUESTION_TYPE]: { label: 'Question', border: '#2F80ED', color: '#2F80ED', icon: QuestionIcon },
  [TODO_TYPE]: { label: 'Task', border: '#43A047', color: '#2E7D32', icon: AssignmentIcon },
  [REPORT_TYPE]: { label: 'Note', border: '#00897B', color: '#00695C', icon: Notes },
  [REPLY_TYPE]: { label: 'Reply', border: '#8f8f8f', color: '#5f6368', icon: ReplyIcon },
  // Vote certainty levels (used on approvals, C-all-987) - outlined to match,
  // graded orange-red (uncertain) -> green (very certain). Labels come from
  // the passed `label` (e.g. "Somewhat Certain").
  certainty5: { label: 'Uncertain', border: '#D54F22', color: '#B33E15' },
  certainty25: { label: 'Somewhat Uncertain', border: '#E8941F', color: '#B96F00' },
  certainty50: { label: 'Somewhat Certain', border: '#C9B500', color: '#8A7E00' },
  certainty75: { label: 'Certain', border: '#7FB05A', color: '#4F7A2E' },
  certainty100: { label: 'Very Certain', border: '#4CAF50', color: '#2E7D32' },
};

function CommentTypeChip(props) {
  const { type, resolved, label: overrideLabel, mobileLayout, style } = props;
  const info = TYPE_CHIP[type];
  if (!info) {
    return null;
  }
  const border = resolved ? '#BDBDBD' : info.border;
  const color = resolved ? '#8f8f8f' : info.color;
  const Icon = info.icon;
  // On mobile show just the type icon (compact, like the old chip did); on
  // desktop show the text label (C-all-986 / Q-all-134).
  const iconOnly = mobileLayout && !!Icon;
  return (
    <span style={{ flex: 'none', display: 'inline-flex', alignItems: 'center', fontSize: '11px',
      fontWeight: 600, padding: iconOnly ? '2px 5px' : '2px 9px', borderRadius: '11px', whiteSpace: 'nowrap',
      backgroundColor: '#fff', border: `1.5px solid ${border}`, color, ...style }}>
      {iconOnly ? <Icon style={{ fontSize: 15, color }} /> : (overrideLabel || info.label)}
    </span>
  );
}

CommentTypeChip.propTypes = {
  type: PropTypes.string,
  resolved: PropTypes.bool,
  label: PropTypes.node,
  mobileLayout: PropTypes.bool,
  style: PropTypes.object,
};

export default CommentTypeChip;
