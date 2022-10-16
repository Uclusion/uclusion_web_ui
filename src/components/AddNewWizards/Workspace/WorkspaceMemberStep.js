import React, { useContext } from 'react';
import PropTypes from 'prop-types'
import { Typography } from '@material-ui/core';
import _ from 'lodash';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import EmailEntryBox from '../../Email/EmailEntryBox';
import WizardStepButtons from '../WizardStepButtons';
import { addMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesContextReducer'
import { inviteParticipants } from '../../../api/users'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext'

function WorkspaceMembersStep(props) {
  const { updateFormData, formData, finish } = props;
  const value = formData.emails ?? '';
  const validForm = !_.isEmpty(value);
  const classes = useContext(WizardStylesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [, marketPresencesDispatch] = useContext(MarketPresencesContext);

  const onEmailChange = (emails) => {
    updateFormData({
      emails
    });
  }

  const myOnFinish = () => {
    const addToMarketId = formData.marketId;
    if (!_.isEmpty(value)) {
      return inviteParticipants(addToMarketId, value, formData.groupId).then((result) => {
        setOperationRunning(false);
        marketPresencesDispatch(addMarketPresences(addToMarketId, result));
        finish();
      });
    }
    finish();
  }

  const teamText = formData.groupName ? `is on ${formData.groupName}` : 'needs to be in the workspace';

  return (
    <WizardStepContainer
      {...props}
    >
    <div>
      <Typography className={classes.introText} variant="h6">
        Who else {teamText}?
      </Typography>
      <EmailEntryBox onChange={onEmailChange} placeholder="Ex: bfollis@uclusion.com, disrael@uclusion.com"/>
      <div className={classes.borderBottom} />
      <WizardStepButtons {...props} validForm={validForm} showSkip={true} showLink={true} finish={myOnFinish}
                         formData={formData}/>
    </div>
    </WizardStepContainer>
  );
}

WorkspaceMembersStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
};

WorkspaceMembersStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
};

export default WorkspaceMembersStep;