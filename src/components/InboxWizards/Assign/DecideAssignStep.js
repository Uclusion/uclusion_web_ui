import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import { getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { useHistory } from 'react-router';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { dismissWorkListItem, removeWorkListItem } from '../../../pages/Home/YourWork/WorkListItem';
import JobDescription from '../JobDescription';
import { updateInvestible } from '../../../api/investibles';
import { getInvestible, refreshInvestibles } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { useIntl } from 'react-intl';
import { formWizardLink, navigate } from '../../../utils/marketIdPathFunctions';
import { APPROVAL_WIZARD_TYPE } from '../../../constants/markets';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { getMarketInfo } from '../../../utils/userFunctions';
import { getMarketComments } from '../../../contexts/CommentsContext/commentsContextHelper';
import { ISSUE_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE, TODO_TYPE } from '../../../constants/comments';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { hasJobComment } from '../../AddNewWizards/JobComment/AddCommentStep';

function DecideAssignStep(props) {
  const { marketId, investibleId, message } = props;
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [, invDispatch] = useContext(InvestiblesContext);
  const [, messagesDispatch] = useContext(NotificationsContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [investiblesState] = useContext(InvestiblesContext);
  const [commentsState] = useContext(CommentsContext);
  const history = useHistory();
  const intl = useIntl();
  const inv = getInvestible(investiblesState, investibleId);
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const groupId = marketInfo.group_id
  const marketComments = getMarketComments(commentsState, marketId, groupId);
  const todos = marketComments.filter((comment) => comment.comment_type === TODO_TYPE &&
    comment.investible_id === investibleId);
  const marketPresences = getMarketPresences(marketPresencesState, marketId);
  const myPresence = marketPresences.find((presence) => presence.current_user) || {};
  const classes = wizardStyles();

  function myTerminate() {
    removeWorkListItem(message, messagesDispatch, history);
  }

  function myAssign() {
    const updateInfo = {
      marketId,
      investibleId,
      assignments: [myPresence.id],
    };
    return updateInvestible(updateInfo).then((fullInvestible) => {
      refreshInvestibles(invDispatch, () => {}, [fullInvestible]);
      setOperationRunning(false);
      dismissWorkListItem(message, messagesDispatch);
      const marketInfo = getMarketInfo(fullInvestible, marketId);
      // Do not include type object ID as this inbox row will be gone
      navigate(history, formWizardLink(APPROVAL_WIZARD_TYPE, marketId, investibleId, marketInfo.group_id));
    });
  }

  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText}>
        {intl.formatMessage({ id: 'DecideAssignmentTitle' })}
      </Typography>
      <JobDescription marketId={marketId} investibleId={investibleId} removeActions comments={todos} showCreatedBy />
      <div className={classes.borderBottom}/>
      <WizardStepButtons
        {...props}
        focus
        nextLabel="DecideAssignMe"
        onNext={myAssign}
        onNextDoAdvance={false}
        showOtherNext
        otherSpinOnClick={false}
        otherNextLabel="WizardJobAssistance"
        otherNextShowEdit={hasJobComment(groupId, investibleId, QUESTION_TYPE)||
          hasJobComment(groupId, investibleId, SUGGEST_CHANGE_TYPE)||
          hasJobComment(groupId, investibleId, ISSUE_TYPE)}
        terminateLabel={message.type_object_id.startsWith('UNREAD') ? 'notificationDismiss' : 'markRead'}
        showTerminate={true}
        onFinish={myTerminate}
      />
    </WizardStepContainer>
  );
}

DecideAssignStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

DecideAssignStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default DecideAssignStep;