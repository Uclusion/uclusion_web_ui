import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { Typography } from '@material-ui/core'
import _ from 'lodash'
import WizardStepContainer from '../WizardStepContainer'
import { WizardStylesContext } from '../WizardStylesContext'
import WizardStepButtons from '../WizardStepButtons'
import { getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper'
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext'
import { updateInvestible } from '../../../api/investibles'
import { navigate } from '../../../utils/marketIdPathFunctions'
import { useHistory } from 'react-router'
import YourVoting from '../../../pages/Investible/Voting/YourVoting';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import {getMarket} from '../../../contexts/MarketsContext/marketsContextHelper';

function JobAssignStep (props) {
  const { marketId, groupId, clearFormData, updateFormData, formData, onFinish } = props;
  const history = useHistory();
  const value = formData.approval || []
  const validForm = !_.isEmpty(value)
  const [marketsState] = useContext(MarketsContext);
  const [presencesState] = useContext(MarketPresencesContext);
  const presences = getMarketPresences(presencesState, marketId);
  const yourPresence = presences.find((presence) => presence.current_user);
  const userId = yourPresence.user_id;
  const market = getMarket(marketsState, marketId);
  const classes = useContext(WizardStylesContext)
  const { investibleId } = formData;

  function vote(){
    return Promise.resolve(true);
  }

  function onTerminate() {
    const {link} = formData;
    clearFormData();
    navigate(history, link);
  }


  return (
    <WizardStepContainer
      {...props}
    >
      <div>
        <Typography className={classes.introText} variant="h6">
          How certain are you this job should be done?
        </Typography>
        <YourVoting
          market={market}
          groupId={groupId}
          investibleId={investibleId}
          userId={userId}
        />
        <div className={classes.borderBottom}/>
        <WizardStepButtons
          {...props}
          finish={onFinish}
          validForm={validForm}
          showNext={validForm}
          showTerminate={!validForm}
          onNext={vote}
          onTerminate={onTerminate}
          terminateLabel="JobWizardGotoJob"
          nextLabel="JobWizardGotoJob"
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