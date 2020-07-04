import React, { useContext, useEffect, useReducer, useState } from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'
import { FormattedMessage, useIntl } from 'react-intl'
import { Link, List, Paper, Typography, } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext'
import { getMarketPresences, } from '../../contexts/MarketPresencesContext/marketPresencesHelper'
import { formMarketLink, navigate } from '../../utils/marketIdPathFunctions'
import { useHistory } from 'react-router'
import { AllSequentialMap } from '../../utils/PromiseUtils'
import { getMarketInfo } from '../../api/sso'
import clsx from 'clsx'
import { useMetaDataStyles } from '../Investible/Planning/PlanningInvestible'
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'
import { getMarket } from '../../contexts/MarketsContext/marketsContextHelper'
import { ACTIVE_STAGE } from '../../constants/markets'
import { convertDates } from '../../contexts/ContextUtils'

const useStyles = makeStyles((theme) => ({
  container: {
    padding: '3px',
    marginTop: '-6px',
    boxShadow: 'none',
    width: '100%',
  },
  inactiveMarket: {
    textDecoration: 'line-through',
    padding: '10px'
  },
  activeMarket: {
    padding: '10px'
  },
  sidebarContent: {
    display: 'flex',
    justifyContent: 'center',
    flexDirection: 'column',
    paddingTop: '0',
    paddingBottom: '0',
    '& span': {
      fontSize: '.9375rem',
      fontWeight: 700
    }
  },
  capitalize: {
    textTransform: 'capitalize'
  }
}))

function MarketLinks (props) {
  const {
    links, actions
  } = props
  const intl = useIntl();
  const history = useHistory();
  const classes = useStyles();
  const [marketState] = useContext(MarketsContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [loading, setLoading] = useState(false);
  const [marketNameState, marketNamesDispatch] = useReducer((state, action) => {
    const { marketId, marketToken, name, marketType, marketStage, isInline, createdAt } = action;
    const newState= { ...state, [marketId]: { name, marketType, marketStage, isInline, createdAt, marketToken } };
    if (Object.keys(newState).length === links.length) {
      setLoading(false);
    }
    return newState;
  }, {})
  let missingLinks = [];
  if (Object.keys(marketNameState).length < links.length) {
    missingLinks = links.filter((marketId) => {
      const marketDetails = getMarket(marketState, marketId);
      if (marketDetails) {
        const {
          name, market_type: marketType, market_stage: marketStage, is_inline: isInline,
          created_at: createdAt
        } = marketDetails;
        marketNamesDispatch({ marketId, name, marketType, marketStage, isInline, createdAt });
        return false;
      }
      return true;
    })
  }

  useEffect(() => {
    if (!loading && missingLinks.length > 0) {
      setLoading(true);
      AllSequentialMap(missingLinks, (marketId) => {
        return getMarketInfo(marketId).then((market) => {
          const { name, market_type: marketType, market_stage: marketStage, is_inline: isInline,
            created_at: createdAt, invite_capability: marketToken } = convertDates(market);
          marketNamesDispatch({ marketId, marketToken, name, marketType, marketStage, isInline, createdAt });
          return market;
        })
      })
    }
  }, [loading, missingLinks])
  const metaClasses = useMetaDataStyles();
  function displayLinksList (linksList) {
    const resolvedLinks = linksList.map((marketId) => {
      const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
      const myPresence = marketPresences.find((presence) => presence.current_user);
      const baseLink = formMarketLink(marketId);
      const marketInfo = marketNameState && [marketId] in marketNameState ? marketNameState[marketId] : undefined;
      const createdAt = marketInfo ? marketInfo.createdAt : undefined;
      const baseInviteLink = marketInfo ? `/invite/${marketInfo.marketToken}` : undefined;
      return {marketId, myPresence, baseLink, baseInviteLink, marketInfo, createdAt};
    });
    const sortedLinks = _.orderBy(resolvedLinks, ['createdAt'], ['desc']);
    return sortedLinks.map((info, index) => {
      const {marketId, myPresence, baseLink, baseInviteLink, marketInfo} = info;
      return (
        <ul key={marketId}>
            {marketInfo && myPresence && (
              <Typography key={marketId} component="li">
                <Link
                  href={baseLink}
                  variant="inherit"
                  underline="always"
                  color="primary"
                  className={marketInfo.marketStage === ACTIVE_STAGE ? classes.activeMarket : classes.inactiveMarket}
                  onClick={(event) => {
                    event.preventDefault()
                    navigate(history, baseLink)
                  }}
                >
                  {marketInfo.isInline ? intl.formatMessage({ id: 'inlineMarketName' }, { x: index + 1})
                    : marketInfo.name}
                </Link>
              </Typography>
            )}
            {!myPresence && marketInfo && (
              <Typography key={marketId} component="li">
                <Link
                  href={`${baseInviteLink}#is_obs=false`}
                  variant="inherit"
                  underline="always"
                  color="primary"
                  className={marketInfo.marketStage === ACTIVE_STAGE ? classes.activeMarket : classes.inactiveMarket}
                  onClick={(event) => {
                    event.preventDefault()
                    navigate(history, `${baseInviteLink}#is_obs=false`)
                  }}
                >
                  {intl.formatMessage({ id: 'marketParticipationLink' }, { x: marketInfo.name })}
                </Link>
              </Typography>
            )}
        </ul>
      )
    })
  }

  if (_.isEmpty(links) && _.isEmpty(actions)) {
    return React.Fragment;
  }

  return (
    <Paper className={classes.container} id="summary">
      <div className={classes.capitalize}>
        <FormattedMessage id="marketLinksSection" />
        <div className={clsx(metaClasses.group, metaClasses.assignments, metaClasses.linkContainer, metaClasses.scrollContainer)}>
          <List className={classes.sidebarContent}>
            {actions}
          </List>
          {displayLinksList(links)}
        </div>
      </div>
    </Paper>
  )
}

MarketLinks.propTypes = {
  links: PropTypes.arrayOf(PropTypes.string).isRequired,
  actions: PropTypes.arrayOf(PropTypes.element),
}

MarketLinks.defaultProps = {
  actions: [],
};

export default MarketLinks
