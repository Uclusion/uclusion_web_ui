import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { Typography } from '@material-ui/core'
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext'
import WizardStepButtons from '../WizardStepButtons';
import { getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import { useHistory } from 'react-router'
import { wizardFinish } from '../InboxWizardUtils'
import { formInvestibleLink } from '../../../utils/marketIdPathFunctions'
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext'
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'
import { removeWorkListItem } from '../../../pages/Home/YourWork/WorkListItem'
import JobDescription from '../JobDescription'
import { updateInvestible } from '../../../api/investibles'
import { refreshInvestibles } from '../../../contexts/InvestibesContext/investiblesContextHelper'
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { getMarketComments } from '../../../contexts/CommentsContext/commentsContextHelper';
import { getCommentsSortedByType } from '../../../utils/commentFunctions';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { useIntl } from 'react-intl';


function DecideAssignStep(props) {
  const { marketId, investibleId, clearFormData, message } = props;
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [, invDispatch] = useContext(InvestiblesContext);
  const [commentsState] = useContext(CommentsContext);
  const [, messagesDispatch] = useContext(NotificationsContext);
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
      clearFormData();
      wizardFinish( { link: formInvestibleLink(marketId, investibleId) }, setOperationRunning, message,
        history, marketId, investibleId, messagesDispatch);
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