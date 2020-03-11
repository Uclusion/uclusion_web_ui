import React, { useContext } from 'react'
import PropTypes from 'prop-types';
import _ from 'lodash';
import { useIntl } from 'react-intl';
import {
  Grid, Typography, Paper, TextField, CardActions,
} from '@material-ui/core'
import { makeStyles } from '@material-ui/styles';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import {
  getMarketPresences,
  marketHasOnlyCurrentUser
} from '../../../contexts/MarketPresencesContext/marketPresencesHelper'
import DialogActions from '../../Home/DialogActions';
import DescriptionOrDiff from '../../../components/Descriptions/DescriptionOrDiff';
import ParentSummary from '../ParentSummary';
import MarketLinks from '../MarketLinks';

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
  draft: {
    color: '#E85757',
  },
}));

function Summary(props) {
  const {
    market, investibleId, hidden, isChannel, unassigned
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
    children,
  } = market;
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const marketPresences = getMarketPresences(marketPresencesState, id) || [];
  const isDraft = marketHasOnlyCurrentUser(marketPresencesState, id);
  const myPresence = marketPresences.find((presence) => presence.current_user) || {};

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
      {isDraft && (
        <Typography className={classes.draft}>
          {intl.formatMessage({ id: 'draft' })}
        </Typography>
      )}
      <Typography className={classes.title} variant="h3" component="h1">
        {name}
      </Typography>
      <CardActions>
        <DialogActions
          isAdmin={myPresence.is_admin}
          isFollowing={myPresence.following}
          marketStage={marketStage}
          marketType={marketType}
          inArchives={myPresence.market_hidden}
          marketId={id}
          initiativeId={investibleId}
        />
      </CardActions>
      <div>
        <DescriptionOrDiff
          hidden={hidden}
          id={id }
          description={description}
        />
      </div>
      {!isChannel && (
        <>
          <TextField
            className={classes.row}
            disabled
            id="maxBudget"
            label={intl.formatMessage({ id: 'maxMaxBudgetInputLabel' })}
            margin="normal"
            variant="outlined"
            value={maxBudget}
          />
          <TextField
            className={classes.row}
            disabled
            id="investmentExpiration"
            label={intl.formatMessage({ id: 'investmentExpirationInputLabel' })}
            margin="normal"
            variant="outlined"
            value={investmentExpiration}
          />
          <TextField
            className={classes.row}
            disabled
            id="daysEstimate"
            label={intl.formatMessage({ id: 'daysEstimateInputLabel' })}
            margin="normal"
            variant="outlined"
            value={daysEstimate}
          />
        </>
      )}
      {!_.isEmpty(unassigned) && (
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
              {intl.formatMessage({ id: 'planningObservers' })}
            </Typography>
          </Grid>
          <Grid
            item
            xs={12}
            sm={10}
            key="ol"
          >
            {displayUserList(unassigned)}
          </Grid>
        </Grid>
      )}
      <ParentSummary market={market} hidden={hidden}/>
      <MarketLinks links={children || []} hidden={hidden} />
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
  isChannel: PropTypes.bool.isRequired,
  unassigned: PropTypes.array,
};

Summary.defaultProps = {
  investibleName: undefined,
  investibleDescription: undefined,
  investibleId: undefined,
  unassigned: [],
};

export default Summary;
