import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, useIntl } from 'react-intl'
import {
  Typography, Link,
} from '@material-ui/core';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import {
  getMarketPresences,
} from '../../contexts/MarketPresencesContext/marketPresencesHelper';
import { formInvestibleLink, formMarketLink, navigate } from '../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import { getMarketInfo } from '../../api/sso';
import { getInvestible } from '../../contexts/InvestibesContext/investiblesContextHelper';
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext';
import clsx from 'clsx';
import { useMetaDataStyles } from '../Investible/Planning/PlanningInvestible';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'
import { getMarket } from '../../contexts/MarketsContext/marketsContextHelper'

function ParentSummary(props) {
  const {
    market, hidden,
  } = props;
  const intl = useIntl();
  const history = useHistory();
  const metaClasses = useMetaDataStyles();
  const {
    parent_market_id: parentMarketId,
    parent_investible_id: parentInvestibleId,
  } = market;
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [marketState] = useContext(MarketsContext);
  const [parentLoaded, setParentLoaded] = useState(false);
  const [parentMarket, setParentMarket] = useState(undefined);
  const [investiblesState] = useContext(InvestiblesContext);

  useEffect(() => {
    if (parentMarketId) {
      if (!parentLoaded && !hidden) {
        setParentLoaded(true);
        const marketDetails = getMarket(marketState, parentMarketId);
        if (marketDetails) {
          setParentMarket(marketDetails);
        } else {
          getMarketInfo(parentMarketId).then((market) => {
            setParentMarket(market);
          });
        }
      } else if (hidden) {
        setParentLoaded(false);
      }
    }
  }, [parentMarketId, hidden, parentLoaded, marketState])

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
      <ul>
        {myParentPresence && (
          <Typography key={parentMarketId} component="li">
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
          </Typography>
        )}
        {!myParentPresence && (
          <Typography key={parentMarketId} component="li">
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
          </Typography>
        )}
      </ul>
    );
  }
  if (!parentMarket) {
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
