import React, { useContext } from 'react';
import PropTypes from 'prop-types'
import { Typography } from '@material-ui/core';
import _ from 'lodash';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import EmailEntryBox from '../../Email/EmailEntryBox'
import WizardStepButtons from '../WizardStepButtons';
import { addMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesContextReducer'
import { inviteParticipants } from '../../../api/users'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext'

function WorkspaceMembersStep(props) {
  const { formData, updateFormData } = props;
  const classes = useContext(WizardStylesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [, marketPresencesDispatch] = useContext(MarketPresencesContext);

  const myOnFinish = () => {
    const { emails, marketId: addToMarketId } = formData;
    if (!_.isEmpty(emails)) {
      return inviteParticipants(addToMarketId, emails).then((result) => {
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
      <EmailEntryBox marketId={formData.marketId} setEmailList={(emails) => updateFormData({ emails })}
                     placeholder="Ex: bfollis@uclusion.com, disrael@uclusion.com"
      />
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