import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import _ from 'lodash';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import { addParticipants } from '../../../api/users';
import { addMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesContextReducer';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import IdentityList from '../../Email/IdentityList';

function FromOtherWorkspacesStep (props) {
  const { participants, marketId } = props;
  const [,marketPresencesDispatch] = useContext(MarketPresencesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const wizardClasses = useContext(WizardStylesContext);
  const [checked, setChecked] = useState([]);

  function onNext () {
    const addUsers = checked.map((participant) => {
      return { external_id: participant.external_id, account_id: participant.account_id };
    });
    if (_.isEmpty(addUsers)) {
      setOperationRunning(false);
      return Promise.resolve(true);
    }
    return addParticipants(marketId, addUsers).then((result) => {
      setOperationRunning(false);
      marketPresencesDispatch(addMarketPresences(marketId, result));
    });
  }

  return (
    <WizardStepContainer
      {...props}
    >
        <Typography className={wizardClasses.introText}>
          Who should be added from other workspaces?
        </Typography>
        <IdentityList participants={participants} setChecked={setChecked} checked={checked} />
        <div className={wizardClasses.borderBottom}/>
        <WizardStepButtons {...props} showSkip={true} onNext={onNext} validForm={!_.isEmpty(checked)}/>
    </WizardStepContainer>
  );
}

FromOtherWorkspacesStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
};

FromOtherWorkspacesStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default FromOtherWorkspacesStep;