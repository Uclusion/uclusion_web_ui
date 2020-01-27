import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import {
  Grid, Typography, Paper, TextField, CardActions,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import ReadOnlyQuillEditor from '../../components/TextEditors/ReadOnlyQuillEditor';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import { getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper';
import { ACTIVE_STAGE, INITIATIVE_TYPE, PLANNING_TYPE } from '../../constants/markets';
import ExpiresDisplay from '../../components/Expiration/ExpiresDisplay';
import DiffDisplay from '../../components/TextEditors/DiffDisplay';
import { DiffContext } from '../../contexts/DiffContext/DiffContext';
import { getDiff } from '../../contexts/DiffContext/diffContextHelper';
import ExpiredDisplay from '../../components/Expiration/ExpiredDisplay';
import DialogActions from '../Home/DialogActions';

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
    market, showObservers, investibleId, investibleDescription, investibleName,
  } = props;
  const intl = useIntl();
  const classes = useStyles();
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
  const [diffState] = useContext(DiffContext);
  const marketPresences = getMarketPresences(marketPresencesState, id) || [];
  const myPresence = marketPresences.find((presence) => presence.current_user) || {};
  const marketPresencesObserving = marketPresences.filter((presence) => !presence.following);
  // eslint-disable-next-line max-len
  const marketPresencesParticipating = marketPresences.filter((presence) => presence.following && !presence.is_admin);
  const marketPresencesModerating = marketPresences.filter((presence) => presence.is_admin);

  const diff = getDiff(diffState, id, myPresence.id);

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
    <Paper className={classes.container}>
      <Typography className={classes.title} variant="h3" component="h1">
        {marketType !== INITIATIVE_TYPE ? name : investibleName}
      </Typography>
      {marketType !== PLANNING_TYPE && !active && (
        <ExpiredDisplay expiresDate={updatedAt} />
      )}
      {marketType !== PLANNING_TYPE && active && (
        <ExpiresDisplay
          createdAt={createdAt}
          expirationMinutes={expirationMinutes}
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
        { diff && <DiffDisplay id={marketType !== INITIATIVE_TYPE ? id : investibleId} />}
        { !diff && (
        <ReadOnlyQuillEditor
          className={classes.content}
          marketId={id}
          value={marketType !== INITIATIVE_TYPE ? description : investibleDescription}
        />
        )}
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
      {showObservers && Array.isArray(marketPresencesObserving) && (
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
      {marketType !== INITIATIVE_TYPE && showObservers && (
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
              {intl.formatMessage({ id: 'dialogObservers' })}
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
  showObservers: PropTypes.bool,
  investibleName: PropTypes.string,
  investibleDescription: PropTypes.string,
  investibleId: PropTypes.string,
};

Summary.defaultProps = {
  showObservers: true,
  investibleName: undefined,
  investibleDescription: undefined,
  investibleId: undefined,
};

export default Summary;
