import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { Typography } from '@material-ui/core'
import _ from 'lodash'
import WizardStepContainer from '../WizardStepContainer'
import { WizardStylesContext } from '../WizardStylesContext'
import WizardStepButtons from '../WizardStepButtons'
import AssignmentList from '../../../pages/Dialog/Planning/AssignmentList'
import { getGroupPresences, getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper'
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext'
import { GroupMembersContext } from '../../../contexts/GroupMembersContext/GroupMembersContext'
import { updateInvestible } from '../../../api/investibles'
import { navigate } from '../../../utils/marketIdPathFunctions'
import { useHistory } from 'react-router'
import { refreshInvestibles } from '../../../contexts/InvestibesContext/investiblesContextHelper'
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'

function JobAssignStep (props) {
  const { marketId, groupId, clearFormData, updateFormData, formData, onFinish } = props;
  const history = useHistory();
  const value = formData.assigned || []
  const validForm = !_.isEmpty(value)
  const [presencesState] = useContext(MarketPresencesContext);
  const presences = getMarketPresences(presencesState, marketId);
  const [groupPresencesState] = useContext(GroupMembersContext);
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const classes = useContext(WizardStylesContext)
  const groupPresences = getGroupPresences(presences, groupPresencesState, marketId, groupId, false) || [];

  const { investibleId } = formData;

  function onAssignmentChange(newAssignments){
    updateFormData({
      assigned: newAssignments
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

  function onTerminate() {
    return assignJob()
      .then(() => {
        const {link} = formData;
        clearFormData();
        navigate(history, link);
      });
  }


  return (
    <WizardStepContainer
      {...props}
    >
      <div>
        <Typography className={classes.introText} variant="h6">
          Who should be working on the job?
        </Typography>
        <AssignmentList
          fullMarketPresences={groupPresences}
          onChange={onAssignmentChange}
        />

        <div className={classes.borderBottom}/>
        <WizardStepButtons
          {...props}
          finish={onFinish}
          validForm={validForm}
          showNext={true}
          showTerminate={true}
          onNext={assignJob}
          onTerminate={onTerminate}
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