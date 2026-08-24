import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CircularProgress,
  Container,
  CssBaseline,
  Divider,
  Grid,
  Typography,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { useIntl } from 'react-intl';
import { decideSetup, getSetup } from '../../api/setup';
import {
  getLogoutGeneration,
  isLogoutGenerationCurrent,
  isSignedOut,
} from '../../utils/logoutState';

const ACCOUNT_RETRY_MS = 2000;
const MAX_ACCOUNT_RETRIES = 15;
const SETUP_POLL_STATES = new Set(['APPROVED', 'COMPLETING']);
const NOOP = () => {};

function setupSessionIsCurrent(logoutGeneration) {
  try {
    return !isSignedOut() && isLogoutGenerationCurrent(logoutGeneration);
  } catch (_error) {
    return false;
  }
}

const useStyles = makeStyles((theme) => ({
  page: {
    minHeight: '100vh',
    paddingBottom: theme.spacing(6),
    paddingTop: theme.spacing(6),
  },
  logo: {
    backgroundColor: '#3f6b72',
    borderRadius: '50%',
    display: 'block',
    height: 48,
    margin: `0 auto ${theme.spacing(2)}px`,
    padding: 6,
    width: 48,
  },
  card: {
    margin: '0 auto',
    maxWidth: 680,
  },
  heading: {
    marginBottom: theme.spacing(2),
  },
  status: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    minHeight: 180,
    justifyContent: 'center',
    textAlign: 'center',
  },
  section: {
    marginTop: theme.spacing(3),
  },
  term: {
    color: theme.palette.text.secondary,
    fontSize: '0.8rem',
    marginBottom: theme.spacing(0.5),
    textTransform: 'uppercase',
  },
  value: {
    margin: 0,
    overflowWrap: 'anywhere',
  },
  actions: {
    gap: theme.spacing(2),
    justifyContent: 'flex-end',
    padding: theme.spacing(2),
  },
  approve: {
    backgroundColor: '#2D9CDB',
    color: 'white',
    '&:hover': {
      backgroundColor: '#247fad',
    },
  },
}));

function clientName(client) {
  return {
    claude: 'Claude Code',
    cursor: 'Cursor',
    codex: 'Codex',
  }[client] || client;
}

function ProposalDetails({ proposal }) {
  const classes = useStyles();
  const intl = useIntl();
  const projectScope = intl.formatMessage({ id: 'setupScopeProject' });
  const scope = proposal.scope === 'project'
    ? `${projectScope}${proposal.project_label ? ` — ${proposal.project_label}` : ''}`
    : intl.formatMessage({ id: 'setupScopeGlobal' });
  const enabled = (value) => intl.formatMessage({ id: value ? 'setupEnabled' : 'setupDisabled' });
  const details = [
    [intl.formatMessage({ id: 'setupWorkspace' }), proposal.workspace_name],
    [intl.formatMessage({ id: 'setupClient' }), clientName(proposal.client)],
    [intl.formatMessage({ id: 'setupScope' }), scope],
    [intl.formatMessage({ id: 'setupTokenAudit' }), enabled(proposal.token_audit)],
    [intl.formatMessage({ id: 'setupWorkClaims' }), enabled(proposal.work_claims)],
  ];
  return (
    <Grid component="dl" container spacing={2} className={classes.section}>
      {details.map(([term, value]) => (
        <Grid item xs={12} sm={6} key={term}>
          <Typography component="dt" className={classes.term}>{term}</Typography>
          <Typography component="dd" className={classes.value}>{value}</Typography>
        </Grid>
      ))}
    </Grid>
  );
}

ProposalDetails.propTypes = {
  proposal: PropTypes.shape({
    workspace_name: PropTypes.string,
    client: PropTypes.string,
    scope: PropTypes.string,
    token_audit: PropTypes.bool,
    work_claims: PropTypes.bool,
    project_label: PropTypes.string,
  }).isRequired,
};

function AccountIdentity({ approver }) {
  const classes = useStyles();
  const intl = useIntl();
  if (!approver) {
    return null;
  }
  return (
    <div className={classes.section}>
      <Typography className={classes.term}>{intl.formatMessage({ id: 'setupCurrentAccount' })}</Typography>
      <Typography className={classes.value}>{approver.name}</Typography>
      <Typography color="textSecondary" className={classes.value}>{approver.email}</Typography>
    </div>
  );
}

AccountIdentity.propTypes = {
  approver: PropTypes.shape({
    name: PropTypes.string,
    email: PropTypes.string,
  }),
};

function stateMessage(result) {
  if (result.state === 'DENIED' && result.reason === 'EXPIRED') {
    return ['setupExpiredTitle', 'setupExpiredBody'];
  }
  return {
    APPROVED: ['setupApprovedTitle', 'setupApprovedBody'],
    COMPLETING: ['setupApprovedTitle', 'setupCompletingBody'],
    CONSUMED: ['setupConsumedTitle', 'setupConsumedBody'],
    DENIED: ['setupDeniedTitle', 'setupDeniedBody'],
    WRONG_ACCOUNT: ['setupWrongAccountTitle', 'setupWrongAccountBody'],
    NOT_FOUND: ['setupUnavailableTitle', 'setupUnavailableBody'],
    UNAVAILABLE: ['setupUnavailableTitle', 'setupUnavailableBody'],
  }[result.state];
}

function SetupApproval({
  setupId,
  onAccountReady = NOOP,
  onSetupComplete = NOOP,
  onSwitchAccount = NOOP,
}) {
  const classes = useStyles();
  const intl = useIntl();
  const accountRetries = useRef(0);
  const accountReady = useRef(false);
  const completedSetup = useRef();
  const resultGeneration = useRef();
  const [reload, setReload] = useState(0);
  const [result, setResult] = useState({ state: 'LOADING' });
  const [decisionPending, setDecisionPending] = useState();
  const [switchingAccount, setSwitchingAccount] = useState(false);
  const [workspaceOpenFailed, setWorkspaceOpenFailed] = useState(false);

  useEffect(() => {
    let active = true;
    let retryTimer;
    const logoutGeneration = getLogoutGeneration();
    const requestActive = () => active && setupSessionIsCurrent(logoutGeneration);
    setResult((current) => (
      current.state === 'FINISHING_ACCOUNT' || SETUP_POLL_STATES.has(current.state)
        ? current
        : { state: 'LOADING' }
    ));
    getSetup(setupId).then((setup) => {
      if (requestActive()) {
        accountRetries.current = 0;
        if (!accountReady.current) {
          accountReady.current = true;
          onAccountReady();
        }
        resultGeneration.current = logoutGeneration;
        setResult(setup);
      }
    }).catch((error) => {
      if (!requestActive()) {
        return;
      }
      if (error?.code === 'FINISHING_ACCOUNT' && accountRetries.current < MAX_ACCOUNT_RETRIES) {
        accountRetries.current += 1;
        setResult({ state: 'FINISHING_ACCOUNT' });
        retryTimer = setTimeout(() => setReload((value) => value + 1), ACCOUNT_RETRY_MS);
      } else {
        setResult({ state: error?.retryable ? 'RETRYABLE' : 'UNAVAILABLE' });
      }
    });
    return () => {
      active = false;
      clearTimeout(retryTimer);
    };
  }, [onAccountReady, reload, setupId]);

  useEffect(() => {
    if (!SETUP_POLL_STATES.has(result.state)) {
      return undefined;
    }
    const pollTimer = setTimeout(() => setReload((value) => value + 1), ACCOUNT_RETRY_MS);
    return () => clearTimeout(pollTimer);
  }, [result]);

  useEffect(() => {
    if (result.state !== 'CONSUMED' || completedSetup.current === result.setup_id) {
      return undefined;
    }
    const logoutGeneration = resultGeneration.current;
    if (logoutGeneration === undefined || !setupSessionIsCurrent(logoutGeneration)) {
      return undefined;
    }
    let active = true;
    const completionActive = () => active && setupSessionIsCurrent(logoutGeneration);
    completedSetup.current = result.setup_id;
    setWorkspaceOpenFailed(false);
    Promise.resolve().then(() => {
      if (completionActive()) {
        return onSetupComplete(result, completionActive);
      }
      return undefined;
    }).catch((error) => {
      if (completionActive() && !error?.cancelled) {
        setWorkspaceOpenFailed(true);
      }
    });
    return () => {
      active = false;
    };
  }, [onSetupComplete, result]);

  function retry() {
    accountRetries.current = 0;
    setReload((value) => value + 1);
  }

  function decide(decision) {
    const logoutGeneration = getLogoutGeneration();
    const requestActive = () => setupSessionIsCurrent(logoutGeneration);
    if (!requestActive()) {
      return Promise.resolve();
    }
    setDecisionPending(decision);
    return decideSetup(setupId, decision).then((setup) => {
      if (!requestActive()) {
        return undefined;
      }
      resultGeneration.current = logoutGeneration;
      setResult(setup);
      setDecisionPending();
      return setup;
    }).catch((error) => {
      if (!requestActive()) {
        return undefined;
      }
      setResult({ state: error?.retryable ? 'RETRYABLE' : 'UNAVAILABLE' });
      setDecisionPending();
      return undefined;
    });
  }

  function switchAccount() {
    setSwitchingAccount(true);
    return Promise.resolve().then(onSwitchAccount).catch(() => setSwitchingAccount(false));
  }

  function statusContents(messageId, spinner = false) {
    return (
      <div className={classes.status} role="status" aria-live="polite">
        {spinner && <CircularProgress />}
        <Typography>{intl.formatMessage({ id: messageId })}</Typography>
      </div>
    );
  }

  let body;
  let actions;
  if (result.state === 'LOADING') {
    body = statusContents('setupLoading', true);
  } else if (result.state === 'FINISHING_ACCOUNT') {
    body = statusContents('setupFinishingAccount', true);
  } else if (result.state === 'RETRYABLE') {
    body = statusContents('setupRetryable');
    actions = (
      <Button id="setupRetryButton" variant="contained" onClick={retry}>
        {intl.formatMessage({ id: 'setupRetry' })}
      </Button>
    );
  } else if (result.state === 'PENDING') {
    body = (
      <>
        <Typography>{intl.formatMessage({ id: 'setupReviewPrompt' })}</Typography>
        {result.proposal && <ProposalDetails proposal={result.proposal} />}
        <Divider className={classes.section} />
        <AccountIdentity approver={result.approver} />
        {result.expires_at && (
          <Typography color="textSecondary" className={classes.section}>
            {intl.formatMessage({ id: 'setupExpires' }, {
              expiry: new Date(result.expires_at).toLocaleString(),
            })}
          </Typography>
        )}
      </>
    );
    actions = (
      <>
        <Button
          id="setupDenyButton"
          variant="outlined"
          disabled={!!decisionPending}
          onClick={() => decide('DENY')}
        >
          {decisionPending === 'DENY' && <CircularProgress size={16} color="inherit" />}
          {intl.formatMessage({ id: 'setupDeny' })}
        </Button>
        <Button
          id="setupApproveButton"
          variant="contained"
          disabled={!!decisionPending}
          className={classes.approve}
          onClick={() => decide('APPROVE')}
        >
          {decisionPending === 'APPROVE' && <CircularProgress size={16} color="inherit" />}
          {intl.formatMessage({ id: 'setupApprove' })}
        </Button>
      </>
    );
  } else {
    const [titleId, bodyId] = stateMessage(result) || ['setupUnavailableTitle', 'setupUnavailableBody'];
    body = (
      <div role="status" aria-live="polite">
        <Typography component="h2" variant="h5" className={classes.heading}>
          {intl.formatMessage({ id: titleId })}
        </Typography>
        <Typography>{intl.formatMessage({ id: bodyId }, {
          workspace: result.proposal?.workspace_name,
        })}</Typography>
        {workspaceOpenFailed && (
          <Typography color="error" className={classes.section}>
            {intl.formatMessage({ id: 'setupWorkspaceOpenFailed' })}
          </Typography>
        )}
        {result.proposal && <ProposalDetails proposal={result.proposal} />}
        <AccountIdentity approver={result.approver} />
      </div>
    );
    if (result.state === 'WRONG_ACCOUNT') {
      actions = (
        <Button
          id="setupSwitchAccountButton"
          variant="contained"
          disabled={switchingAccount}
          onClick={switchAccount}
        >
          {switchingAccount && <CircularProgress size={16} color="inherit" />}
          {intl.formatMessage({ id: 'setupSwitchAccount' })}
        </Button>
      );
    }
  }

  return (
    <div className={classes.page}>
      <CssBaseline />
      <Container component="main" maxWidth="md">
        <img className={classes.logo} src="/images/Uclusion_Logo_White_Micro.png" alt="Uclusion" />
        <Card className={classes.card}>
          <CardContent>
            <Typography component="h1" variant="h4" align="center" className={classes.heading}>
              {intl.formatMessage({ id: 'setupTitle' })}
            </Typography>
            {body}
          </CardContent>
          {actions && <CardActions className={classes.actions}>{actions}</CardActions>}
        </Card>
      </Container>
    </div>
  );
}

SetupApproval.propTypes = {
  setupId: PropTypes.string.isRequired,
  onAccountReady: PropTypes.func,
  onSetupComplete: PropTypes.func,
  onSwitchAccount: PropTypes.func,
};

export default SetupApproval;
