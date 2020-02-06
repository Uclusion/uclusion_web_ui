import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { useIntl } from 'react-intl';
import {
  Grid, Typography, Paper, TextField, CardActions,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import { getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper';
import { ACTIVE_STAGE, DECISION_TYPE, INITIATIVE_TYPE, PLANNING_TYPE } from '../../constants/markets'
import ExpiresDisplay from '../../components/Expiration/ExpiresDisplay';
import ExpiredDisplay from '../../components/Expiration/ExpiredDisplay';
import DialogActions from '../Home/DialogActions';
import DescriptionOrDiff from '../../components/Descriptions/DescriptionOrDiff';
import { formMarketManageLink, navigate } from '../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';

const useStyles = makeStyles((theme) => ({
  container: {
    padding: '3px 89px 21px 21px',
    marginTop: '-6px',
    boxShadow: 'none',
    [theme.breakpoints.down('sm')]: {
      padding: '3px 21px 42px 21px',
    },
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: '42px',
    paddingBottom: '9px',
    [theme.breakpoints.down('xs')]: {
      fontSize: 25,
    },
  },
  content: {
    fontSize: '15 !important',
    lineHeight: '175%',
    color: '#414141',
    [theme.breakpoints.down('xs')]: {
      fontSize: 13,
    },
    '& > .ql-container': {
      fontSize: '15 !important',
    },
  },
}));

function Summary(props) {
  const {
    market, investibleId, investibleDescription, investibleName, hidden,
  } = props;
  const intl = useIntl();
  const classes = useStyles();
  const history = useHistory();
  const {
    id,
    name,
    description,
    market_stage: marketStage,
    market_type: marketType,
    max_budget: maxBudget,
    investment_expiration: investmentExpiration,
    days_estimate: daysEstimate,
    created_at: createdAt,
    updated_at: updatedAt,
    expiration_minutes: expirationMinutes,
  } = market;
  const active = marketStage === ACTIVE_STAGE;
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const marketPresences = getMarketPresences(marketPresencesState, id) || [];
  const myPresence = marketPresences.find((presence) => presence.current_user) || {};
  const isAdmin = myPresence.is_admin;
  const marketPresencesObserving = marketPresences.filter((presence) => !presence.following);
  // eslint-disable-next-line max-len
  const marketPresencesParticipating = marketPresences.filter((presence) => presence.following && !presence.is_admin);
  const marketPresencesModerating = marketPresences.filter((presence) => presence.is_admin);

  function displayUserList(presencesList) {
    return presencesList.map((presence) => {
      const { id: presenceId, name } = presence;
      return (
        <Grid
          item
          key={presenceId}
        >
          <Typography>{name}</Typography>
        </Grid>
      );
    });
  }
  return (
    <Paper className={classes.container} id="summary">
      <Typography className={classes.title} variant="h3" component="h1">
        {marketType !== INITIATIVE_TYPE ? name : investibleName}
      </Typography>
      {marketType !== PLANNING_TYPE && !active && (
        <ExpiredDisplay
          expiresDate={updatedAt}
        />
      )}
      {marketType !== PLANNING_TYPE && active && (
        <ExpiresDisplay
          createdAt={createdAt}
          expirationMinutes={expirationMinutes}
          onClick={() => isAdmin && navigate(history, formMarketManageLink(id))}
        />
      )}
      <CardActions>
        <DialogActions
          isAdmin={myPresence.is_admin}
          marketStage={marketStage}
          marketType={marketType}
          inArchives={myPresence.market_hidden}
          marketId={id}
        />
      </CardActions>
      <div>
        <DescriptionOrDiff
          hidden={hidden}
          id={marketType !== INITIATIVE_TYPE ? id : investibleId }
          description={marketType !== INITIATIVE_TYPE ? description : investibleDescription}
        />
      </div>
      {maxBudget && (
        <TextField
          className={classes.row}
          disabled
          id="maxBudget"
          label={intl.formatMessage({ id: 'maxMaxBudgetInputLabel' })}
          margin="normal"
          variant="outlined"
          value={maxBudget}
        />
      )}
      {investmentExpiration && (
        <TextField
          className={classes.row}
          disabled
          id="investmentExpiration"
          label={intl.formatMessage({ id: 'investmentExpirationInputLabel' })}
          margin="normal"
          variant="outlined"
          value={investmentExpiration}
        />
      )}
      {daysEstimate && (
        <TextField
          className={classes.row}
          disabled
          id="daysEstimate"
          label={intl.formatMessage({ id: 'daysEstimateInputLabel' })}
          margin="normal"
          variant="outlined"
          value={daysEstimate}
        />
      )}
      {marketType !== PLANNING_TYPE && Array.isArray(marketPresencesModerating) && (
        <Grid
          container
        >
          <Grid
            item
            xs={12}
            sm={2}
            key="createdBy"
          >
            <Typography>
              {intl.formatMessage({ id: 'created_by' })}
            </Typography>
          </Grid>
          <Grid
            item
            xs={12}
            sm={10}
          >
            {displayUserList(marketPresencesModerating)}
          </Grid>
        </Grid>
      )}
      {marketType !== PLANNING_TYPE && !_.isEmpty(marketPresencesParticipating) && (
        <Grid
          container
        >
          <Grid
            item
            xs={12}
            sm={2}
            key="ob1"
          >
            <Typography>
              {intl.formatMessage({ id: 'dialogParticipants' })}
            </Typography>
          </Grid>
          <Grid
            item
            xs={12}
            sm={10}
            key="ul"
          >
            {displayUserList(marketPresencesParticipating)}
          </Grid>
        </Grid>
      )}
      {!_.isEmpty(marketPresencesObserving) && (
        <Grid
          container
        >
          <Grid
            item
            xs={12}
            sm={2}
            key="ob2"
          >
            <Typography>
              {marketType === DECISION_TYPE ? intl.formatMessage({ id: 'dialogObservers' }) :
                intl.formatMessage({ id: 'planningObservers' })}
            </Typography>
          </Grid>
          <Grid
            item
            xs={12}
            sm={10}
            key="ol"
          >
            {displayUserList(marketPresencesObserving)}
          </Grid>
        </Grid>
      )}
    </Paper>
  );
}

Summary.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  market: PropTypes.object.isRequired,
  investibleName: PropTypes.string,
  investibleDescription: PropTypes.string,
  investibleId: PropTypes.string,
  hidden: PropTypes.bool.isRequired,
};

Summary.defaultProps = {
  investibleName: undefined,
  investibleDescription: undefined,
  investibleId: undefined,
};

export default Summary;
