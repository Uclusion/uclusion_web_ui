import React, { useContext } from 'react';
import PropTypes from 'prop-types'
import { Typography } from '@material-ui/core';
import _ from 'lodash';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import EmailEntryBox, { getEmailList, setEmailList } from '../../Email/EmailEntryBox'
import WizardStepButtons from '../WizardStepButtons';
import { addMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesContextReducer'
import { inviteParticipants } from '../../../api/users'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext'

function WorkspaceMembersStep(props) {
  const { formData, finish } = props;
  const classes = useContext(WizardStylesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [, marketPresencesDispatch] = useContext(MarketPresencesContext);

  const myOnFinish = () => {
    const addToMarketId = formData.marketId;
    const value = getEmailList(addToMarketId);
    if (!_.isEmpty(value)) {
      return inviteParticipants(addToMarketId, value, formData.groupId).then((result) => {
        setEmailList([], addToMarketId);
        setOperationRunning(false);
        marketPresencesDispatch(addMarketPresences(addToMarketId, result));
        finish();
      });
    }
    setOperationRunning(false);
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
      <EmailEntryBox marketId={formData.marketId} placeholder="Ex: bfollis@uclusion.com, disrael@uclusion.com"/>
      <div className={classes.borderBottom} />
      <WizardStepButtons {...props} showSkip={false} showLink={true} finish={myOnFinish} formData={formData}/>
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