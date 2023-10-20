import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import { getComment } from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { FormattedMessage, useIntl } from 'react-intl';
import { RED_LEVEL } from '../../../constants/notifications';
import _ from 'lodash';
import { stripHTML } from '../../../utils/stringFunctions';
import { formCommentLink, navigate } from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import CriticalItem from './CriticalItem';
import { getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { deleteOrDehilightMessages } from '../../../api/users';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { getInboxTarget } from '../../../contexts/NotificationsContext/notificationsContextHelper';

function TriageStep(props) {
  const { marketId, commentId, message } = props;
  const [commentState] = useContext(CommentsContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [, messagesDispatch] = useContext(NotificationsContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const intl = useIntl();
  const history = useHistory();
  const commentRoot = getComment(commentState, marketId, commentId) || {};
  const { group_id: groupId } = commentRoot;
  const comments = (commentState[marketId] || []).filter((comment) =>
    comment.group_id === groupId && !comment.resolved && !comment.deleted && !comment.investible_id &&
    comment.notification_type === RED_LEVEL);
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
  const classes = wizardStyles();

  function myTerminate() {
    navigate(history, formCommentLink(marketId, groupId, undefined, commentId));
  }

  function getRows() {
    if (_.isEmpty(comments)) {
      return React.Fragment;
    }
    return comments.map((comment) => {
      const { id, body, updated_at: updatedAt, created_by: createdBy } = comment;
      const creator = marketPresences.find((presence) => presence.id === createdBy) || {};
      return (
        <CriticalItem id={id} title={stripHTML(body)} link={formCommentLink(marketId, groupId, undefined, id)}
                     date={new Date(updatedAt)} people={[creator]} isRead={!message.is_highlighted}/>
      );
    });
  }

  function markRead() {
    return deleteOrDehilightMessages([message], messagesDispatch, false, true)
      .then(() => {
        setOperationRunning(false);
        navigate(history, getInboxTarget());
      })
  }

  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText}>
        {intl.formatMessage({id: 'CriticalBugTitle'})}
      </Typography>
      <Typography className={classes.introSubText} variant="subtitle1">
        Critical bugs must be assigned or moved to Normal.
      </Typography>
      <h2 id="tasksOverview">
        <FormattedMessage id="criticalBugs" />
      </h2>
      <div style={{marginBottom: '2.5rem'}}>
        {getRows()}
      </div>
      <WizardStepButtons
        {...props}
        nextLabel="GotoBugs"
        spinOnClick={false}
        showOtherNext={message.is_highlighted}
        onOtherNext={markRead}
        otherSpinOnClick={true}
        otherNextLabel="markRead"
        onNext={myTerminate}
      />
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