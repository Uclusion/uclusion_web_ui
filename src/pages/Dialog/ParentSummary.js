import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import {
  Grid, Typography, Paper, Link,
} from '@material-ui/core'
import { makeStyles } from '@material-ui/styles';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import {
  getMarketPresences,
} from '../../contexts/MarketPresencesContext/marketPresencesHelper';
import { formInvestibleLink, formMarketLink, navigate } from '../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import { getMarketInfo } from '../../api/sso';
import { getInvestible } from '../../contexts/InvestibesContext/investiblesContextHelper';
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext';

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

function ParentSummary(props) {
  const {
    market, hidden,
  } = props;
  const intl = useIntl();
  const classes = useStyles();
  const history = useHistory();
  const {
    parent_market_id: parentMarketId,
    parent_investible_id: parentInvestibleId,
  } = market;
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [parentLoaded, setParentLoaded] = useState(false);
  const [parentMarket, setParentMarket] = useState(undefined);
  const [investiblesState] = useContext(InvestiblesContext);

  useEffect(() => {
    if (parentMarketId) {
      if (!parentLoaded && !hidden) {
        setParentLoaded(true)
        getMarketInfo(parentMarketId).then((market) => {
            setParentMarket(market);
        })
      } else if (hidden) {
        setParentLoaded(false);
      }
    }
  }, [parentMarketId, hidden, parentLoaded])

  function displayParentLink(parentMarketId, parentInvestibleId) {
    const { name: parentMarketName } = parentMarket;
    const marketPresences = getMarketPresences(marketPresencesState, parentMarketId) || [];
    const myParentPresence = marketPresences.find((presence) => presence.current_user);
    const baseLink = parentInvestibleId ? formInvestibleLink(parentMarketId, parentInvestibleId) : formMarketLink(parentMarketId);
    const baseInviteLink = `/invite/${parentMarketId}`;
    const inv = getInvestible(investiblesState, parentInvestibleId) || {};
    const { investible } = inv;
    const { name: parentInvestibleName } = investible || {};
    return (
      <>
        <Grid
          item
          key={parentMarketId}
        >
          {myParentPresence && (
            <Link
              href={baseLink}
              variant="inherit"
              underline="always"
              color="primary"
              onClick={(event) => {
                event.preventDefault()
                navigate(history, baseLink)
              }}
            >
              {parentInvestibleName || parentMarketName}
            </Link>
          )}
          {!myParentPresence && (
            <Link
              href={`${baseInviteLink}#is_obs=false`}
              variant="inherit"
              underline="always"
              color="primary"
              onClick={(event) => {
                event.preventDefault()
                navigate(history, `${baseInviteLink}#is_obs=false`)
              }}
            >
              {intl.formatMessage({ id: 'marketParticipationLink' }, { x: parentMarketName })}
            </Link>
          )}
        </Grid>
      </>
    );
  }
  return (
    <Paper className={classes.container} id="summary">
      {parentMarket && (
        <Grid
          container
        >
          <Grid
            item
            xs={12}
            sm={2}
            key="parentLabel"
          >
            <Typography>
              {intl.formatMessage({ id: 'parentLinkSection' })}
            </Typography>
          </Grid>
          {displayParentLink(parentMarketId, parentInvestibleId)}
        </Grid>
      )}
    </Paper>
  );
}

ParentSummary.propTypes = {
  market: PropTypes.object.isRequired,
  hidden: PropTypes.bool.isRequired,
};

export default ParentSummary;
