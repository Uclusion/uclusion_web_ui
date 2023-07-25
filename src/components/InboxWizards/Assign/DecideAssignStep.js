import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { Typography } from '@material-ui/core'
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext'
import WizardStepButtons from '../WizardStepButtons';
import { getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper'
import { useHistory } from 'react-router'
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext'
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'
import { dismissWorkListItem, removeWorkListItem } from '../../../pages/Home/YourWork/WorkListItem';
import JobDescription from '../JobDescription'
import { updateInvestible } from '../../../api/investibles'
import { refreshInvestibles } from '../../../contexts/InvestibesContext/investiblesContextHelper'
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { getMarketComments } from '../../../contexts/CommentsContext/commentsContextHelper';
import { getCommentsSortedByType } from '../../../utils/commentFunctions';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { useIntl } from 'react-intl';
import { formWizardLink, navigate } from '../../../utils/marketIdPathFunctions';
import { APPROVAL_WIZARD_TYPE } from '../../../constants/markets';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { getMarketInfo } from '../../../utils/userFunctions';


function DecideAssignStep(props) {
  const { marketId, investibleId, message } = props;
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [, invDispatch] = useContext(InvestiblesContext);
  const [commentsState] = useContext(CommentsContext);
  const [, messagesDispatch] = useContext(NotificationsContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const marketComments = getMarketComments(commentsState, marketId);
  const comments = getCommentsSortedByType(marketComments, investibleId, false);
  const history = useHistory();
  const intl = useIntl();
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
      navigate(history, formWizardLink(APPROVAL_WIZARD_TYPE, marketId, investibleId, marketInfo.group_id))
    });
  }

  return (
    <WizardStepContainer
      {...props}
    >
    <div>
      <Typography className={classes.introText}>
        {intl.formatMessage({id: 'DecideAssignmentTitle'})}
      </Typography>
      <JobDescription marketId={marketId} investibleId={investibleId} comments={comments} removeActions />
      <WizardStepButtons
        {...props}
        nextLabel="DecideAssignMe"
        onNext={myAssign}
        terminateLabel={ message.type_object_id.startsWith('UNREAD') ? 'notificationDismiss' : 'markRead' }
        showTerminate={true}
        onFinish={myTerminate}
      />
    </div>
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