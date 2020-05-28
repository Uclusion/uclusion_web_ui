import React, { useContext, useEffect, useState } from 'react'
import { useIntl } from 'react-intl'
import PropTypes from 'prop-types'
import { useHistory } from 'react-router'
import _ from 'lodash'
import { decomposeMarketPath, formMarketLink, navigate, } from '../../utils/marketIdPathFunctions'
import Screen from '../../containers/Screen/Screen'
import { VERSIONS_HUB_CHANNEL } from '../../contexts/WebSocketContext'
import { getMarketFromInvite } from '../../api/uclusionClient'
import { registerListener } from '../../utils/MessageBusUtils'
import { toastError } from '../../utils/userMessage'
import queryString from 'query-string'
import { NEW_MARKET } from '../../contexts/VersionsContext/versionsContextMessages'
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'
import { AccountUserContext } from '../../contexts/AccountUserContext/AccountUserContext'

function MarketInvite(props) {
  const { hidden } = props;
  const intl = useIntl();
  const history = useHistory();
  const { location } = history;
  const { pathname } = location;
  const { hash } = location;
  const { marketId: marketToken } = decomposeMarketPath(pathname);
  const [myLoading, setMyLoading] = useState(undefined);
  const [marketState] = useContext(MarketsContext);
  const [user] = useContext(AccountUserContext) || {};

  useEffect(() => {
    if (!hidden && myLoading !== marketToken && _.isEmpty(user)) {
      setMyLoading(marketToken);
      const values = queryString.parse(hash);
      const { is_obs: isObserver } = values;
      getMarketFromInvite(marketToken, isObserver === 'true')
        .then((result) => {
          const { is_new_capability: loggedIntoNewMarket, market_id: myMarketId } = result;
          console.debug(`Logged into market ${myMarketId}`);
          if (!loggedIntoNewMarket) {
            navigate(history, formMarketLink(myMarketId));
          } else {
            registerListener(VERSIONS_HUB_CHANNEL, 'inviteListener', (data) => {
              const { payload: { event, marketId: messageMarketId } } = data;
              switch (event) {
                case  NEW_MARKET: {
                  if (messageMarketId === myMarketId) {
                    console.log(`Redirecting us to market ${myMarketId}`);
                    setTimeout(() => {
                      navigate(history, formMarketLink(myMarketId));
                    }, 500);
                  }
                  break;
                }
                default:
                  // ignore
                  break;
              }
            });
          }
        })
        .catch((error) => {
          console.error(error);
          toastError('errorMarketFetchFailed');
        });
    }
  }, [hidden, marketToken, history, hash, marketState, myLoading]);

  return (
    <Screen
      title={intl.formatMessage({ id: 'loadingMarket' })}
      tabTitle={intl.formatMessage({ id: 'loadingMarket' })}
      hidden={hidden}
      loading={true}
    >
      <div />
    </Screen>
  );
}

MarketInvite.propTypes = {
  hidden: PropTypes.bool,
};

MarketInvite.defaultProps = {
  hidden: false,
};

export default MarketInvite;
