import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { List, ListItem, ListItemIcon, ListItemText, Tooltip, Divider } from '@material-ui/core';
import { ISSUE_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE } from '../../constants/comments';
import ReportProblemIcon from '@material-ui/icons/ReportProblem';
import ContactSupportIcon from '@material-ui/icons/ContactSupport';
import ChangeHistoryIcon from '@material-ui/icons/ChangeHistory';
import { useIntl } from 'react-intl';
import CommentAdd from '../../components/Comments/CommentAdd';
import _ from 'lodash';

// starts out amOpen, goes large, with comments contained
function CommentsSidebarActions(props) {
  const intl = useIntl();

  const {
    amOpen,
    setAmOpen,
    onClick,
    investible,
    marketId,
  } = props;

  const [activeType, setActiveType] = useState(ISSUE_TYPE);

  const marketOnly = _.isEmpty(investible);

  function handleClick(type) {
    setAmOpen(true);
    setActiveType(type);
    onClick(type);
  }

  // if we're not open, just return the buttons
  if (!amOpen) {
    return (
      <List>
        <ListItem
          button
          key="issue"
          onClick={() => handleClick(ISSUE_TYPE)}
        >
          <ListItemIcon>
            <Tooltip title={intl.formatMessage({ id: 'commentIconRaiseIssueLabel' })}>
              <ReportProblemIcon />
            </Tooltip>
          </ListItemIcon>
        </ListItem>
        <ListItem
          button
          key="question"
          onClick={() => handleClick(QUESTION_TYPE)}
        >
          <ListItemIcon>
            <Tooltip title={intl.formatMessage({ id: 'commentIconAskQuestionLabel' })}>
              <ContactSupportIcon />
            </Tooltip>
          </ListItemIcon>
        </ListItem>
        {!marketOnly && (
          <ListItem
            button
            key="changes"
            onClick={() => handleClick(SUGGEST_CHANGE_TYPE)}
          >
            <ListItemIcon>
              <Tooltip title={intl.formatMessage({ id: 'commentIconSuggestChangesLabel' })}>
                <ChangeHistoryIcon />
              </Tooltip>
            </ListItemIcon>
          </ListItem>
        )}
      </List>
    );
  }
  // expanded
  return (
    <React.Fragment>
      <List>
        <ListItem
          button
          key="issue"
          onClick={() => handleClick(ISSUE_TYPE)}
        >
          <ListItemIcon>
            <ReportProblemIcon />
          </ListItemIcon>
          <ListItemText>
            {intl.formatMessage({ id: 'commentIconRaiseIssueLabel' })}
          </ListItemText>
        </ListItem>
        <ListItem
          button
          key="question"
          onClick={() => handleClick(QUESTION_TYPE)}
        >
          <ListItemIcon>
            <ContactSupportIcon />
          </ListItemIcon>
          <ListItemText>
            {intl.formatMessage({ id: 'commentIconAskQuestionLabel' })}
          </ListItemText>
        </ListItem>
        {!marketOnly && (<ListItem
            button
            key="changes"
            onClick={() => handleClick(SUGGEST_CHANGE_TYPE)}
          >
            <ListItemIcon>
              <ChangeHistoryIcon />
            </ListItemIcon>
            <ListItemText>
              {intl.formatMessage({ id: 'commentIconSuggestChangesLabel' })}
            </ListItemText>
          </ListItem>
        )}
      </List>
      <Divider />
      {activeType === ISSUE_TYPE && <CommentAdd type={ISSUE_TYPE} investible={investible} marketId={marketId} />}
      {activeType === QUESTION_TYPE && <CommentAdd type={QUESTION_TYPE} investible={investible} marketId={marketId} />}
      {activeType === SUGGEST_CHANGE_TYPE &&
      <CommentAdd type={SUGGEST_CHANGE_TYPE} investible={investible} marketId={marketId} />}
    </React.Fragment>
  );
}

CommentsSidebarActions.propTypes = {
  amOpen: PropTypes.bool.isRequired,
  setAmOpen: PropTypes.func.isRequired,
  onClick: PropTypes.func,
  marketId: PropTypes.string.isRequired,
  investible: PropTypes.object,
};

CommentsSidebarActions.defaultProps = {
  onClick: () => {},
  investible: {},
};
export default CommentsSidebarActions;