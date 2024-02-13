import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Card, Grid, Link, ListItem, makeStyles, Paper, Typography } from '@material-ui/core';
import { FormattedMessage, useIntl } from 'react-intl';
import Screen from '../../containers/Screen/Screen';
import config from '../../config';
import OnboardingWorkspace from './OnboardingWorkspace';
import SubSection from '../../containers/SubSection/SubSection';
import { AccountContext } from '../../contexts/AccountContext/AccountContext';

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
  const [userState] = useContext(AccountContext);
  const intl = useIntl();
  const classes = useStyles();
  const { version } = config;
  const user = userState?.user;
  const externalId = user?.external_id;

  return (
    <Screen
      title={intl.formatMessage({ id: 'support' })}
      tabTitle={intl.formatMessage({ id: 'support' })}
      hidden={hidden}
      loading={!externalId}
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
                  This button takes you to a workspace with Uclusion support as a collaborator.
                </Typography>
              </ListItem>
              <ListItem key="supportFeatureInfoText2">
                <Typography variant="body2">
                  Once in the support workspace you can <Link href="https://documentation.uclusion.com/groups/bugs/" target="_blank">open a bug</Link>,
                  make suggestion, ask a question, or even assign a job to Uclusion support and we will respond.
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
