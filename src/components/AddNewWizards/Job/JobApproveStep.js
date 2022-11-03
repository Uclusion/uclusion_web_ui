import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { Typography } from '@material-ui/core'
import _ from 'lodash'
import WizardStepContainer from '../WizardStepContainer'
import { WizardStylesContext } from '../WizardStylesContext'
import WizardStepButtons from '../WizardStepButtons'
import { getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper'
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext'
import { navigate } from '../../../utils/marketIdPathFunctions'
import { useHistory } from 'react-router'
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import {getMarket} from '../../../contexts/MarketsContext/marketsContextHelper';
import AddInitialVote from '../../../pages/Investible/Voting/AddInitialVote';

function JobAssignStep (props) {
  const { marketId, groupId, clearFormData, updateFormData, formData, onFinish } = props;
  const history = useHistory();
  const validForm = !_.isEmpty(formData.approveQuantity);
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

  const editorName = "newjobapproveeditor";

  function onApproveChange (key) {
    return (data) => {
      updateFormData({
        key: data,
      });
    };
  }

  const quantityUpdater = onApproveChange('approveQuantity');

  function onQuantityChange(event) {
    const {value} = event.target;
    quantityUpdater(value);
  }

  const {approveQuantity} = formData;

  return (
    <WizardStepContainer
      {...props}
    >
      <div>
        <Typography className={classes.introText} variant="h6">
          How certain are you this job should be done?
        </Typography>

        <AddInitialVote
          marketId={marketId}
          onBudgetChange={() => {}}
          showBudget={false}
          onChange={onQuantityChange}
          newQuantity={approveQuantity}
          onEditorChange={onApproveChange('approveReason')}
          onUpload={onApproveChange('approveUploadedFiles')}
          editorName={editorName}
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