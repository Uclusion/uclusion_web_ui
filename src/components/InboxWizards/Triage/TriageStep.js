import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext';
import { getComment } from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { useIntl } from 'react-intl';
import { RED_LEVEL } from '../../../constants/notifications';
import { getGroup } from '../../../contexts/MarketGroupsContext/marketGroupsContextHelper';
import { MarketGroupsContext } from '../../../contexts/MarketGroupsContext/MarketGroupsContext';
import MarketTodos from '../../../pages/Dialog/Planning/MarketTodos';

function TriageStep(props) {
  const { marketId, commentId } = props;
  const [commentState] = useContext(CommentsContext);
  const [groupState] = useContext(MarketGroupsContext);
  const intl = useIntl();
  const commentRoot = getComment(commentState, marketId, commentId) || {};
  const { group_id: groupId } = commentRoot;
  const group = getGroup(groupState, marketId, groupId) || {};
  const { name: groupName } = group;
  const comments = (commentState[marketId] || []).filter((comment) =>
    comment.group_id === groupId && !comment.resolved && !comment.deleted && !comment.investible_id &&
    comment.notification_type === RED_LEVEL);
  const classes = wizardStyles();

  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText}>
        {intl.formatMessage({id: 'CriticalBugTitle'})}
      </Typography>
      <Typography className={classes.introSubText} variant="subtitle1">
        Assign bugs with the Move button or lower from Critical to remove this notification.
      </Typography>
      <h2 id="tasksOverview">
        {intl.formatMessage({id: 'criticalBugs'}, { groupName })}
      </h2>
      <MarketTodos comments={comments} marketId={marketId} groupId={groupId}
                   sectionOpen={true}
                   hidden={false}
                   setSectionOpen={() => {}} group={group} isInbox openDefaultId={commentRoot.id} />
    </WizardStepContainer>
  );
}

TriageStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

TriageStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default TriageStep;