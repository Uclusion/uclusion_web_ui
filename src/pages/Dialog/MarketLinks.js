import React, { useContext, useEffect, useReducer, useState } from 'react';
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
import { formMarketLink, navigate } from '../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import { AllSequentialMap } from '../../utils/PromiseUtils';
import { getMarketInfo } from '../../api/sso';

const useStyles = makeStyles((theme) => ({
  container: {
    padding: '3px 89px 21px 21px',
    marginTop: '-6px',
    boxShadow: 'none',
    [theme.breakpoints.down('sm')]: {
      padding: '3px 21px 42px 21px',
    },
  },
}))

function MarketLinks (props) {
  const {
    links, hidden
  } = props
  const intl = useIntl()
  const history = useHistory()
  const classes = useStyles()
  const [marketPresencesState] = useContext(MarketPresencesContext)
  const [loaded, setLoaded] = useState(false)
  const [marketNameState, marketNamesDispatch] = useReducer((state, action) => {
    const { marketId, name, marketType } = action
    return { ...state, [marketId]: { name, marketType } }
  }, {})

  useEffect(() => {
    if (!loaded && !hidden) {
      setLoaded(true)
      AllSequentialMap(links, (marketId) => {
        return getMarketInfo(marketId).then((market) => {
          const { name, market_type: marketType } = market;
          marketNamesDispatch({ marketId, name, marketType });
          return market;
        })
      })
    } else if (hidden) {
      setLoaded(false);
    }
  }, [links, hidden, loaded])

  function displayLinksList (linksList) {
    return linksList.map((marketId) => {
      const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
      const myPresence = marketPresences.find((presence) => presence.current_user);
      const baseLink = formMarketLink(marketId);
      const baseInviteLink = `/invite/${marketId}`;
      return (
        <>
          <Grid
            item
            key={marketId}
          >
            {marketId in marketNameState && myPresence && (
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
                {marketNameState[marketId].name}
              </Link>
            )}
            {!myPresence && marketId in marketNameState && (
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
                {intl.formatMessage({ id: 'marketParticipationLink' }, { x: marketNameState[marketId].name })}
              </Link>
            )}
          </Grid>
        </>
      )
    })
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
  )
}

MarketLinks.propTypes = {
  links: PropTypes.arrayOf(PropTypes.string).isRequired,
  hidden: PropTypes.bool.isRequired,
}

export default MarketLinks
