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
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import { getMarket } from '../../contexts/MarketsContext/marketsContextHelper';
import { ACTIVE_STAGE } from '../../constants/markets';
import { convertDates } from '../../contexts/ContextUtils'

const useStyles = makeStyles((theme) => ({
  container: {
    padding: '3px 89px 21px 21px',
    marginTop: '-6px',
    boxShadow: 'none',
    [theme.breakpoints.down('sm')]: {
      padding: '3px 21px 42px 21px',
    },
  },
  inactiveMarket: {
    textDecoration: 'line-through',
  },
  activeMarket: {},
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
    const { marketId, name, marketType, marketStage, isInline, createdAt } = action
    return { ...state, [marketId]: { name, marketType, marketStage, isInline, createdAt } }
  }, {})

  useEffect(() => {
    if (!loaded && !hidden) {
      setLoaded(true);
      const missingLinks = links.filter((marketId) => {
        const marketDetails = getMarket(marketState, marketId);
        if (marketDetails) {
          const { name, market_type: marketType, market_stage: marketStage, is_inline: isInline,
          created_at: createdAt } = marketDetails;
          marketNamesDispatch({ marketId, name, marketType, marketStage, isInline, createdAt });
          return false;
        }
        return true;
      })
      AllSequentialMap(missingLinks, (marketId) => {
        return getMarketInfo(marketId).then((market) => {
          const { name, market_type: marketType, market_stage: marketStage, is_inline: isInline,
            created_at: createdAt } = convertDates(market);
          marketNamesDispatch({ marketId, name, marketType, marketStage, isInline, createdAt });
          return market;
        })
      })
    } else if (hidden) {
      setLoaded(false);
    }
  }, [links, hidden, loaded, marketState])
  const metaClasses = useMetaDataStyles();
  function displayLinksList (linksList) {
    const resolvedLinks = linksList.map((marketId) => {
      const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
      const myPresence = marketPresences.find((presence) => presence.current_user);
      const baseLink = formMarketLink(marketId);
      const baseInviteLink = `/invite/${marketId}`;
      const marketInfo = [marketId] in marketNameState ? marketNameState[marketId] : undefined;
      const createdAt = marketInfo ? marketInfo.createdAt : undefined;
      return {marketId, myPresence, baseLink, baseInviteLink, marketInfo, createdAt};
    });
    const sortedLinks = _.orderBy(resolvedLinks, ['createdAt'], ['asc']);
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

  if (_.isEmpty(links)) {
    return React.Fragment;
  }

  return (
    <Paper className={classes.container} id="summary">
      <div className={clsx(metaClasses.group, metaClasses.assignments)}>
        <dt>
          <FormattedMessage id="marketLinksSection" />
        </dt>
        <dd>
          {displayLinksList(links)}
        </dd>
      </div>
    </Paper>
  )
}

MarketLinks.propTypes = {
  links: PropTypes.arrayOf(PropTypes.string).isRequired,
  hidden: PropTypes.bool.isRequired,
}

export default MarketLinks
