import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { Typography } from '@material-ui/core'
import _ from 'lodash'
import WizardStepContainer from '../WizardStepContainer'
import { WizardStylesContext } from '../WizardStylesContext'
import WizardStepButtons from '../WizardStepButtons'
import AssignmentList from '../../../pages/Dialog/Planning/AssignmentList'
import { getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper'
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext'
import { updateInvestible } from '../../../api/investibles'
import { navigate } from '../../../utils/marketIdPathFunctions'
import { useHistory } from 'react-router'
import { refreshInvestibles } from '../../../contexts/InvestibesContext/investiblesContextHelper'
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'

function JobAssignStep (props) {
  const { marketId, clearFormData, updateFormData, formData, onFinish, assigneeId } = props;
  const history = useHistory();
  const value = formData.wasSet ? (formData.assigned || []) : (assigneeId ? [assigneeId] : []);
  const validForm = !_.isEmpty(value);
  const [presencesState] = useContext(MarketPresencesContext);
  const presences = getMarketPresences(presencesState, marketId);
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const classes = useContext(WizardStylesContext)

  const { investibleId } = formData;

  function onAssignmentChange(newAssignments){
    updateFormData({
      assigned: newAssignments,
      wasSet: true
    });
  }

  function assignJob() {
    const updateInfo = {
      marketId,
      investibleId,
      assignments: value,
    };
    if (validForm) {
      return updateInvestible(updateInfo).then((fullInvestible) => {
        refreshInvestibles(investiblesDispatch, () => {}, [fullInvestible]);
        return formData;
      });
    }
    return Promise.resolve(true);
  }

  return (
    <WizardStepContainer
      {...props}
    >
      <div>
        <Typography className={classes.introText} variant="h6">
          Who should be working on the job?
        </Typography>
        <Typography className={classes.introSubText} variant="subtitle1">
          Not assigning sends to job backlog.
        </Typography>
        <AssignmentList
          fullMarketPresences={presences}
          previouslyAssigned={assigneeId ? [assigneeId] : undefined}
          onChange={onAssignmentChange}
        />
        <div className={classes.borderBottom}/>
        <WizardStepButtons
          {...props}
          finish={onFinish}
          validForm={validForm}
          showNext
          showTerminate
          onNext={assignJob}
          onTerminate={() => navigate(history, formData.link)}
          terminateLabel="JobWizardGotoJob"
          nextLabel="JobWizardApproveJob"
        />
      </div>
    </WizardStepContainer>
  )
}

JobAssignStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
}

JobAssignStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
}

export default JobAssignStep