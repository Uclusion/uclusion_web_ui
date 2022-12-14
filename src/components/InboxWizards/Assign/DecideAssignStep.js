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
import { removeWorkListItem, workListStyles } from '../../../pages/Home/YourWork/WorkListItem'
import JobDescription from '../JobDescription'
import { updateInvestible } from '../../../api/investibles'
import { refreshInvestibles } from '../../../contexts/InvestibesContext/investiblesContextHelper'


function DecideAssignStep(props) {
  const { marketId, investibleId, clearFormData, message } = props;
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [, invDispatch] = useContext(InvestiblesContext)
  const history = useHistory();
  const marketPresences = getMarketPresences(marketPresencesState, marketId);
  const myPresence = marketPresences.find((presence) => presence.current_user) || {};
  const classes = wizardStyles();
  const workItemClasses = workListStyles();

  function myTerminate() {
    removeWorkListItem(message, workItemClasses.removed);
  }

  function goToJob() {
    clearFormData();
    wizardFinish( { link: formInvestibleLink(marketId, investibleId) }, setOperationRunning, message,
      history);
  }

  function myAssign() {
    const updateInfo = {
      marketId,
      investibleId,
      assignments: [myPresence.id],
    };
    return updateInvestible(updateInfo).then((fullInvestible) => {
      refreshInvestibles(invDispatch, () => {}, [fullInvestible]);
      goToJob()
    });
  }

  return (
    <WizardStepContainer
      {...props}
    >
    <div>
      <Typography className={classes.introText}>
        Can you take this job?
      </Typography>
      <JobDescription marketId={marketId} investibleId={investibleId} />
      <WizardStepButtons
        {...props}
        nextLabel="DecideAssignMe"
        onNext={myAssign}
        showOtherNext
        onOtherNext={goToJob}
        otherNextLabel="DecideWizardContinue"
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