import React, { useContext, useState } from 'react';
import { makeStyles, Typography } from '@material-ui/core';
import SpinBlockingButton from '../../components/SpinBlocking/SpinBlockingButton';
import { getSecret, newSecret } from '../../api/users';
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

  function changeSecret() {
    return newSecret(marketId).then((user) => {
      setOperationRunning(false);
      setSecretUser(user);
      return user;
    });
  }

  return (
    <div style={{marginTop: '2rem'}}>
      {!secretUser && (
        <Typography variant="subtitle1">
          Press this button to show your CLI secret.
        </Typography>
      )}
      {secretUser && (
        <Typography variant="subtitle1">
          Create a .uclusion/credentials file with this:
        </Typography>
      )}
      {secretUser && (
        <p style={{whiteSpace: 'pre-wrap', marginTop: '0.5rem'}}>
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
      <Typography variant="subtitle1" style={{marginTop: '2rem'}}>
        Press this button to invalidate your current CLI secret and create a new one.
      </Typography>
      <SpinBlockingButton
        className={classes.getSecretButton}
        onClick={changeSecret}
        id="secretNewId"
      >
        {intl.formatMessage({ id: 'invalidateSecret' })}
      </SpinBlockingButton>
    </div>
  );
}

export default CLISecret;