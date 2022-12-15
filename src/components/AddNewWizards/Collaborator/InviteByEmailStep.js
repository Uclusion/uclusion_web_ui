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

function InviteByEmailStep(props) {
  const { formData, finish, marketId } = props;
  const classes = useContext(WizardStylesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [, marketPresencesDispatch] = useContext(MarketPresencesContext);

  const myOnFinish = () => {
    const emails = getEmailList(marketId);
    if (!_.isEmpty(emails)) {
      return inviteParticipants(marketId, emails).then((result) => {
        setEmailList([], marketId);
        setOperationRunning(false);
        marketPresencesDispatch(addMarketPresences(marketId, result));
        finish();
      });
    }
    setOperationRunning(false);
    finish();
  }

  return (
    <WizardStepContainer
      {...props}
    >
    <div>
      <Typography className={classes.introText} variant="h6">
        Who should be added by email?
      </Typography>
      <EmailEntryBox marketId={marketId} placeholder="Ex: bfollis@uclusion.com, disrael@uclusion.com"/>
      <div className={classes.borderBottom} />
      <WizardStepButtons {...props} showSkip={false} showLink={true} finish={myOnFinish} formData={formData}/>
    </div>
    </WizardStepContainer>
  );
}

InviteByEmailStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
};

InviteByEmailStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
};

export default InviteByEmailStep;