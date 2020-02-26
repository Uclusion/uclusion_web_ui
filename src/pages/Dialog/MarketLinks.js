import React, { useContext, useEffect, useReducer, useState } from 'react'
import PropTypes from 'prop-types';
import _ from 'lodash';
import { useIntl } from 'react-intl';
import {
  Grid, Typography, Paper, Link,
} from '@material-ui/core'
import { makeStyles } from '@material-ui/styles';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import {
  getMarketPresences,
} from '../../contexts/MarketPresencesContext/marketPresencesHelper';
import { formMarketLink, navigate } from '../../utils/marketIdPathFunctions'
import { useHistory } from 'react-router';
import { AllSequentialMap } from '../../utils/PromiseUtils';
import { getMarketDetails } from '../../api/markets';

const useStyles = makeStyles((theme) => ({
  container: {
    padding: '3px 89px 21px 21px',
    marginTop: '-6px',
    boxShadow: 'none',
    [theme.breakpoints.down('sm')]: {
      padding: '3px 21px 42px 21px',
    },
  },
}));

function MarketLinks(props) {
  const {
    links, hidden
  } = props;
  const intl = useIntl();
  const history = useHistory();
  const classes = useStyles();
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [loaded, setLoaded] = useState(false);
  const [marketNameState, marketNamesDispatch] = useReducer((state, action) => {
    const { marketId, name } = action;
    return {...state, [marketId]: name};
  }, {});

  useEffect(() => {
    if (!loaded && !hidden) {
      setLoaded(true);
      AllSequentialMap(links, (marketId) => {
        return getMarketDetails(marketId).then((market) => {
          const { name } = market;
          marketNamesDispatch({ marketId, name });
          return market;
        });
      });
    }
    else if (hidden) {
      setLoaded(false);
    }
  }, [hidden, loaded]);

  function displayLinksList(linksList) {
    return linksList.map((marketId) => {
      const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
      const myPresence = marketPresences.find((presence) => presence.current_user);
      return (
        <Grid
          item
          key={marketId}
        >
          <Link
            href={formMarketLink(marketId)}
            variant="inherit"
            underline="always"
            color="primary"
            onClick={(event) => {
              event.preventDefault();
              navigate(history, formMarketLink(marketId));
            }}
          >
            {marketId in marketNameState && marketNameState[marketId]}
          </Link>
        </Grid>
      );
    });
  }
  return (
    <Paper className={classes.container} id="summary">
      {!_.isEmpty(links) && (
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
              {intl.formatMessage({ id: 'marketLinksSection' })}
            </Typography>
          </Grid>
          <Grid
            item
            xs={12}
            sm={10}
            key="ol"
          >
            {displayLinksList(links)}
          </Grid>
        </Grid>
      )}
    </Paper>
  );
}

MarketLinks.propTypes = {
  links: PropTypes.arrayOf(PropTypes.string).isRequired,
  hidden: PropTypes.bool.isRequired,
};

export default MarketLinks;
