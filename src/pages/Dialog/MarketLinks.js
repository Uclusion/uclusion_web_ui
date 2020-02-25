import React, { useContext } from 'react';
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
import { useHistory } from 'react-router'

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
    links,
  } = props;
  const intl = useIntl();
  const history = useHistory();
  const classes = useStyles();
  const [marketPresencesState] = useContext(MarketPresencesContext);
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
            TODO need decent way of getting the name here
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
};

export default MarketLinks;
