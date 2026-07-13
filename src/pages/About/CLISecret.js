import React, { useContext, useState } from 'react';
import { makeStyles, Typography } from '@material-ui/core';
import SpinBlockingButton from '../../components/SpinBlocking/SpinBlockingButton';
import { getSecret, newSecret } from '../../api/users';
import { useIntl } from 'react-intl';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext';
import CopyCommand from './CopyCommand';
import { getUclusionEnvironment } from './installUtils';

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
  // The CLI and MCP proxy read env-specific credentials files (see uclusionCLI.py)
  const env = getUclusionEnvironment();
  const credentialsFile = env === 'production' ? 'credentials' : `${env}_credentials`;

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
    <div>
      {!secretUser && (
        <Typography variant="subtitle1">
          Press this button to show the command that installs your Uclusion secret.
        </Typography>
      )}
      {secretUser && (
        <Typography variant="subtitle1">
          Copy and run this command to create your credentials file:
        </Typography>
      )}
      {secretUser && (
        <CopyCommand
          command={`mkdir -p ~/.uclusion && cat > ~/.uclusion/${credentialsFile} <<'EOF'\nsecret_key_id = ${secretUser.external_id}_${secretUser.account_id}\nsecret_key = ${secretUser.client_secret}\nEOF`}
        />
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
        Press this button to invalidate your current Uclusion secret and create a new one.
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
