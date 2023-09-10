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
  const { formData } = props;
  const classes = useContext(WizardStylesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [, marketPresencesDispatch] = useContext(MarketPresencesContext);

  const myOnFinish = () => {
    const addToMarketId = formData.marketId;
    const value = getEmailList(addToMarketId);
    if (!_.isEmpty(value)) {
      return inviteParticipants(addToMarketId, value).then((result) => {
        setEmailList([], addToMarketId);
        setOperationRunning(false);
        marketPresencesDispatch(addMarketPresences(addToMarketId, result));
      });
    }
    setOperationRunning(false);
  }

  return (
    <WizardStepContainer
      {...props}
    >
    <div>
      <Typography className={classes.introText} variant="h6">
        Who else needs to be in the workspace?
      </Typography>
      <EmailEntryBox marketId={formData.marketId} placeholder="Ex: bfollis@uclusion.com, disrael@uclusion.com"/>
      <div className={classes.borderBottom} />
      <WizardStepButtons {...props} showSkip={false} showLink={true} onNext={myOnFinish} isFinal={false} />
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