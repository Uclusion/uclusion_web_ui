import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { Card, Grid, Link, ListItem, makeStyles, Paper, Typography } from '@material-ui/core'
import { FormattedMessage, useIntl } from 'react-intl'
import Screen from '../../containers/Screen/Screen'
import config from '../../config'
import { toastErrorAndThrow } from '../../utils/userMessage'
import { getSSOInfo } from '../../api/sso'
import OnboardingWorkspace from './OnboardingWorkspace'
import SubSection from '../../containers/SubSection/SubSection'

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(2),
  },
  section: {
    width: '100%',
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
    '&:last-child': {
      marginBottom: 0,
    },
  },
  container: {
    maxWidth: '600px',
    display: 'block',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  row: {
    display: 'flex',
    marginBottom: theme.spacing(0.5),
    '&:last-child': {
      marginBottom: 0,
    },
  },
  label: {
    fontWeight: 600,
    marginRight: theme.spacing(1),
    minWidth: 140,
    [theme.breakpoints.down('sm')]: {
      fontSize: '0.75rem',
      marginRight: '10px',
      minWidth: 50
    },
  },
  value: {
    [theme.breakpoints.down('sm')]: {
      fontSize: '0.75rem'
    },
  },
}));

function Support(props) {
  const {
    hidden,
  } = props;
  const intl = useIntl();
  const classes = useStyles();
  const { version } = config;
  const [externalId, setExternalId] = useState(undefined);
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    if (!externalId && !hidden) {
      getSSOInfo().then((ssoInfo) => {
          const { idToken, ssoClient } = ssoInfo;
          return ssoClient.accountCognitoLogin(idToken).then((loginInfo) => {
            const { user: myUser } = loginInfo;
            const { external_id: myExternalId } = myUser;
            setExternalId(myExternalId);
            setUser(myUser);
          });
        }).catch((error) => toastErrorAndThrow(error, 'errorGetIdFailed'));
    }
  }, [externalId, hidden]);
  return (
    <Screen
      title={intl.formatMessage({ id: 'support' })}
      tabTitle={intl.formatMessage({ id: 'support' })}
      hidden={hidden}
      loading={!externalId}
      hideMenu
    >
      <div className={classes.container}>
        <Card>
          <SubSection
            title="Via Channel"
            padChildren
          >
            <Grid
              container
              direction="row"
              justify="center"
              alignItems="baseline"
              style={{ paddingBottom: '0' }}
            >
              <ListItem key="supportFeatureInfoText">
                <Typography variant="body2">
                  <FormattedMessage
                    id="supportFeatureInfoText"
                  />
                </Typography>
              </ListItem>
              <ListItem key="onboarding">
                <OnboardingWorkspace user={user} />
              </ListItem>
            </Grid>
          </SubSection>
        </Card>
      </div>
      <div className={classes.container} style={{marginTop: '3rem'}}>
        <Card>
          <SubSection
            title="Via Email"
            padChildren
          >
            <Grid
              container
              direction="row"
              justify="center"
              alignItems="baseline"
              style={{ paddingBottom: '0' }}
            >
              <ListItem key="version">
                <Paper className={classes.section}>
                  <Typography className={classes.row}>
                    <span className={classes.label}>{intl.formatMessage({ id: 'aboutApplicationVersionLabel' })}</span>
                    <span className={classes.value}>{version}</span>
                  </Typography>
                </Paper>
              </ListItem>
              <ListItem key="id">
                <Paper className={classes.section}>
                  <Typography className={classes.row}>
                    <span className={classes.label}>{intl.formatMessage({ id: 'aboutUserIdLabel' })}</span>
                    <span className={classes.value}>{externalId}</span>
                  </Typography>
                </Paper>
              </ListItem>
              <ListItem key="supportInfoText">
                <Typography variant="body2" style={{marginTop: '1.5rem'}}>
                  <FormattedMessage
                    id="supportInfoText"
                    values={{
                      a: (...chunks) => (
                        <Link target="_blank" href="mailto:support@uclusion.com">{chunks}</Link>
                      ),
                    }}
                  />
                </Typography>
              </ListItem>
            </Grid>
          </SubSection>
        </Card>
      </div>
    </Screen>
  );
}

Support.propTypes = {
  hidden: PropTypes.bool.isRequired,
};

export default Support;
