import React, { useContext, useEffect, useReducer, useState } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl'
import {
  Typography, Paper, Link,
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
import clsx from 'clsx';
import { useMetaDataStyles } from '../Investible/Planning/PlanningInvestible';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'
import { getMarket } from '../../contexts/MarketsContext/marketsContextHelper'

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
  const intl = useIntl();
  const history = useHistory();
  const classes = useStyles();
  const [marketState] = useContext(MarketsContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [loaded, setLoaded] = useState(false);
  const [marketNameState, marketNamesDispatch] = useReducer((state, action) => {
    const { marketId, name, marketType } = action
    return { ...state, [marketId]: { name, marketType } }
  }, {})

  useEffect(() => {
    if (!loaded && !hidden) {
      setLoaded(true);
      const missingLinks = links.filter((marketId) => {
        const marketDetails = getMarket(marketState, marketId);
        if (marketDetails) {
          const { name, market_type: marketType } = marketDetails;
          marketNamesDispatch({ marketId, name, marketType });
          return false;
        }
        return true;
      })
      AllSequentialMap(missingLinks, (marketId) => {
        return getMarketInfo(marketId).then((market) => {
          const { name, market_type: marketType } = market;
          marketNamesDispatch({ marketId, name, marketType });
          return market;
        })
      })
    } else if (hidden) {
      setLoaded(false);
    }
  }, [links, hidden, loaded, marketState])
  const metaClasses = useMetaDataStyles();
  function displayLinksList (linksList) {
    return linksList.map((marketId) => {
      const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
      const myPresence = marketPresences.find((presence) => presence.current_user);
      const baseLink = formMarketLink(marketId);
      const baseInviteLink = `/invite/${marketId}`;
      return (
        <ul>
            {marketId in marketNameState && myPresence && (
              <Typography key={marketId} component="li">
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
              </Typography>
            )}
            {!myPresence && marketId in marketNameState && (
              <Typography key={marketId} component="li">
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
              </Typography>
            )}
        </ul>
      )
    })
  }

  return (
    <Paper className={classes.container} id="summary">
      {!_.isEmpty(links) && (
        <div className={clsx(metaClasses.group, metaClasses.assignments)}>
          <dt>
            <FormattedMessage id="marketLinksSection" />
          </dt>
          <dd>
            {displayLinksList(links)}
          </dd>
        </div>
      )}
    </Paper>
  )
}

MarketLinks.propTypes = {
  links: PropTypes.arrayOf(PropTypes.string).isRequired,
  hidden: PropTypes.bool.isRequired,
}

export default MarketLinks
