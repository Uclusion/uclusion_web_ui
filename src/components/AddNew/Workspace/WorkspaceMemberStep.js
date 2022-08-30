import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types'
import { ListItem, Paper, TextField, Typography } from '@material-ui/core';
import _, { isEmpty } from 'lodash';
import StepButtons from '../StepButtons'
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import { Send } from '@material-ui/icons';
import { useIntl } from 'react-intl';
import Chip from '@material-ui/core/Chip';

function WorkspaceMembersStep(props) {
  const { updateFormData, formData } = props;
  const [currentEmail, setCurrentEmail] = useState(null);
  const value = formData.name ?? '';
  const validForm = !_.isEmpty(value);
  const classes = useContext(WizardStylesContext);
  const enteredEmails = formData.emails ?? [];

  const onEmailChange = (event) => {
    const {value} = event.target;
    setCurrentEmail(value);
  }

  const validateEmail = () => {
    if(!isEmpty(currentEmail)){
      return false;
    }
    if(enteredEmails.includes(currentEmail)){
      return false;
    }
  }

  const onKeyPress = (event) => {
    if (event.key === 'Enter') {
      if(validateEmail()) {
        updateFormData({
          emails: [...enteredEmails, currentEmail]
        });
        setCurrentEmail(null);
      }
    }
  }

  const onDelete = (email) => {
    const newEmails = _.remove(enteredEmails, email);
    updateFormData({
      enteredEmails: newEmails
    });
  };

  const renderChips = () => {
    return (
      <Paper
        sx={{
          display: 'flex',
          justifyContent: 'center',
          flexWrap: 'wrap',
          listStyle: 'none',
          p: 0.5,
          m: 0,
        }}
        component="ul"
      >
        {enteredEmails.map((email) => {
          let icon = <Send/>;
          return (
            <ListItem key={email}>
              <Chip
                icon={icon}
                label={email}
                onDelete={() => onDelete(email)}
              />
            </ListItem>
          );
        })}
      </Paper>
    );
  };

  return (
    <WizardStepContainer
      {...props}
    >
    <div>
      <Typography className={classes.introText} variant="h6">
        Who else needs to be in the workspace?
      </Typography>
      <label className={classes.inputLabel} htmlFor="emails">
        Enter Emails Here (hit return to complete an email)
      </label>
      {renderChips()}
      <TextField
        variant="standard"
        id="emails"
        type="email"
        placeholder="Recipient"
        onChange={onEmailChange}
        onKeyPress={onKeyPress}
        value={currentEmail}
        />
      <div className={classes.borderBottom} />
      <StepButtons {...props} validForm={validForm} showFinish={true} />
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