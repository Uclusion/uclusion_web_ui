import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import { getEmailList, setEmailList } from '../../Email/EmailEntryBox';
import WizardStepButtons from '../WizardStepButtons';
import { Send } from '@material-ui/icons';

function InviteByEmailConfirmationStep(props) {
  const { finish, marketId, startOver } = props;
  const classes = useContext(WizardStylesContext);
  const [emails] = useState(getEmailList(marketId));
  setEmailList([], marketId);

  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText} variant="h6">
        Sent.
      </Typography>
      {emails.map((email) => {
        return (
          <div style={{display: 'flex', alignItems: 'center', marginBottom: '0.5rem'}}>
            <Send htmlColor="green" style={{marginRight: '0.5rem'}}/> {email} invited as collaborator.</div>
        );
      })}
      <div className={classes.borderBottom} />
      <WizardStepButtons
        {...props}
        focus
        nextLabel="done"
        spinOnClick={false}
        finish={finish}
        showTerminate
        terminateLabel="addMoreCollaborators"
        onTerminate={startOver}
      />
    </WizardStepContainer>
  );
}

InviteByEmailConfirmationStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
};

InviteByEmailConfirmationStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
};

export default InviteByEmailConfirmationStep;