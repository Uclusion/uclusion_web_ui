import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import {
  Grid, Typography, Paper, TextField,
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
  const { market, showObservers } = props;
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
    created_at: createdAt,
    expiration_minutes: expirationMinutes,
  } = market;
  const active = marketStage === ACTIVE_STAGE;
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [diffState] = useContext(DiffContext);
  const diffItem = getDiff(diffState, id) || {};
  const { diff } = diffItem;
  const marketPresences = getMarketPresences(marketPresencesState, id) || [];
  const marketPresencesObserving = marketPresences.filter((presence) => !presence.following);
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
    <Paper className={classes.container}>
      {marketType !== INITIATIVE_TYPE && (
        <Typography className={classes.title} variant="h3" component="h1">
          {name}
        </Typography>
      )}
      {marketType !== PLANNING_TYPE && active && (
        <ExpiresDisplay
          createdAt={createdAt}
          expirationMinutes={expirationMinutes}
        />)}
      {marketType !== INITIATIVE_TYPE && (
        <div>
          { diff && <DiffDisplay id={id}/>}
          { !diff && <ReadOnlyQuillEditor className={classes.content} marketId={id} value={description}/>}
        </div>
      )}
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
            key="observers"
          >
            <Typography>
              {intl.formatMessage({ id: 'dialogObservers' })}
            </Typography>
          </Grid>
          <Grid
            item
            xs={12}
            sm={10}
            key="userList"
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
};

Summary.defaultProps = {
  showObservers: true,
};

export default Summary;
