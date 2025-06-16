import React, { useContext, useState } from 'react';
import { makeStyles, Typography } from '@material-ui/core';
import SpinBlockingButton from '../../components/SpinBlocking/SpinBlockingButton';
import { getSecret } from '../../api/users';
import { useIntl } from 'react-intl';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext';

const styleClasses = makeStyles(
  {
    getSecretButton: {
      textTransform: 'none',
      backgroundColor: '#E85757',
      color: 'white',
      '&:hover': {
        backgroundColor: '#E85757'
      }
    }
  }, { name: 'change' }
);

function CLISecret (props) {
  const { marketId } = props;
  const intl = useIntl();
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [secretUser, setSecretUser] = useState(undefined);
  const classes = styleClasses();

  function getCliSecret() {
    return getSecret(marketId).then((user) => {
      setOperationRunning(false);
      setSecretUser(user);
      return user;
    });
  }

  return (
    <div>
      {!secretUser && (
        <Typography variant="subtitle1">
          Press button to show CLI secret.
        </Typography>
      )}
      {secretUser && (
        <Typography variant="subtitle1">
          Create a .uclusion/credentials file with this:
        </Typography>
      )}
      {secretUser && (
        <p style={{whiteSpace: 'pre-wrap'}}>
          {`secret_key_id = ${secretUser.external_id}_${secretUser.account_id}`}<br/>
          {`secret_key = ${secretUser.client_secret}`}<br/>
        </p>
      )}
      {!secretUser && (
        <SpinBlockingButton
          className={classes.getSecretButton}
          onClick={getCliSecret}
          id="secretRetrievalId"
        >
          {intl.formatMessage({ id: 'cliSecret' })}
        </SpinBlockingButton>
      )}
    </div>
  );
}

export default CLISecret;