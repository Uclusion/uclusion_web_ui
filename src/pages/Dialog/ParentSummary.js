import React, { useContext, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { FormattedMessage } from 'react-intl'
import { Link, Typography, } from '@material-ui/core'
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext'
import { getMarketPresences, } from '../../contexts/MarketPresencesContext/marketPresencesHelper'
import { formInvestibleLink, formMarketLink, navigate } from '../../utils/marketIdPathFunctions'
import { useHistory } from 'react-router'
import { getInvestible } from '../../contexts/InvestibesContext/investiblesContextHelper'
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext'
import clsx from 'clsx'
import { useMetaDataStyles } from '../Investible/Planning/PlanningInvestible'
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'
import { getMarket } from '../../contexts/MarketsContext/marketsContextHelper'
import { ACTIVE_STAGE } from '../../constants/markets'
import { makeStyles } from '@material-ui/styles'
import _ from 'lodash'

const useStyles = makeStyles((theme) => ({
  inactiveMarket: {
    textDecoration: 'line-through',
  },
  activeMarket: {},
}))

function ParentSummary(props) {
  const {
    market, hidden,
  } = props;
  const history = useHistory();
  const metaClasses = useMetaDataStyles();
  const classes = useStyles();
  const {
    parent_market_id: parentMarketId,
    parent_investible_id: parentInvestibleId,
  } = market;
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [marketState] = useContext(MarketsContext);
  const [parentMarket, setParentMarket] = useState(undefined);
  const [investiblesState] = useContext(InvestiblesContext);

  useEffect(() => {
    if (parentMarketId) {
      if (_.isEmpty(parentMarket) && !hidden) {
        const marketDetails = getMarket(marketState, parentMarketId);
        if (marketDetails) {
          setParentMarket(marketDetails);
        }
      }
    }
  }, [parentMarketId, hidden, marketState, parentMarket])

  function displayParentLink(parentMarketId, parentInvestibleId) {
    const { name: parentMarketName, market_stage: parentMarketStage } = parentMarket;
    const marketPresences = getMarketPresences(marketPresencesState, parentMarketId) || [];
    const myParentPresence = marketPresences.find((presence) => presence.current_user);
    const baseLink = parentInvestibleId ? formInvestibleLink(parentMarketId, parentInvestibleId) : formMarketLink(parentMarketId);
    const inv = getInvestible(investiblesState, parentInvestibleId) || {};
    const { investible } = inv;
    const { name: parentInvestibleName } = investible || {};
    if (!parentMarketId) {
      return React.Fragment;
    }
    return (
      <ul>
        {myParentPresence && (
          <Typography key={parentMarketId} component="li">
            <Link
              href={baseLink}
              variant="inherit"
              underline="always"
              color="primary"
              className={parentMarketStage === ACTIVE_STAGE ? classes.activeMarket : classes.inactiveMarket}
              onClick={(event) => {
                event.preventDefault()
                navigate(history, baseLink)
              }}
            >
              {parentInvestibleName || parentMarketName}
            </Link>
          </Typography>
        )}
      </ul>
    );
  }
  if (_.isEmpty(parentMarket)) {
    return <React.Fragment/>
  }
  return (
    <div className={clsx(metaClasses.group, metaClasses.assignments)}>
      <dt>
        <FormattedMessage id="parentLinkSection" />
      </dt>
      <dd>
        {displayParentLink(parentMarketId, parentInvestibleId)}
      </dd>
    </div>
  );
}

ParentSummary.propTypes = {
  market: PropTypes.object.isRequired,
  hidden: PropTypes.bool.isRequired,
};

export default ParentSummary;
