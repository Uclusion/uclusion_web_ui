import React, { useContext, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router';
import _ from 'lodash';
import {
  decomposeMarketPath,
  formMarketLink,
  navigate,
} from '../../utils/marketIdPathFunctions';
import Screen from '../../containers/Screen/Screen';
import { VERSIONS_HUB_CHANNEL } from '../../contexts/WebSocketContext';
import { getMarketLogin } from '../../api/uclusionClient';
import { registerListener, removeListener } from '../../utils/MessageBusUtils';
import { toastError } from '../../utils/userMessage';
import queryString from 'query-string';
import { NEW_MARKET } from '../../contexts/VersionsContext/versionsContextMessages';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import { getMarket } from '../../contexts/MarketsContext/marketsContextHelper';

function MarketInvite(props) {
  const { hidden } = props;
  const intl = useIntl();
  const history = useHistory();
  const { location } = history;
  const { pathname } = location;
  const { hash } = location;
  const { marketId } = decomposeMarketPath(pathname);
  const [myLoading, setMyLoading] = useState(true);
  const [marketState] = useContext(MarketsContext);
  useEffect(() => {
    if (!hidden) {
      const marketDetails = getMarket(marketState, marketId);
      if (!_.isEmpty(marketDetails)) {
        // if I know about the market, I must be part of it since we never leave
        // TODO: IF we do implement leave on a market I know about fix this
        navigate(history, formMarketLink(marketId));
      } else {
        registerListener(VERSIONS_HUB_CHANNEL, 'inviteListener', (data) => {
          const { payload: { event, marketId: messageMarketId } } = data;
          switch (event) {
            case  NEW_MARKET: {
              if (messageMarketId === marketId) {
                console.log(`Redirecting us to market ${marketId}`);
                setTimeout(() => {
                  navigate(history, formMarketLink(marketId));
                }, 500);
              }
              break;
            }
            default:
              // ignore
              break;
          }
        });
        console.debug(`Logging into market ${marketId}`);
        const values = queryString.parse(hash);
        const { is_obs: isObserver } = values;
        getMarketLogin(marketId, isObserver === 'true')
          .then((result) => {
            const { is_new_capability: loggedIntoNewMarket } = result;
            if (!loggedIntoNewMarket) {
              setMyLoading(false);
              removeListener(VERSIONS_HUB_CHANNEL, 'inviteListener');
              navigate(history, formMarketLink(marketId));
            }
          })
          .catch((error) => {
            setMyLoading(false);
            console.error(error);
            toastError('errorMarketFetchFailed');
          });
      }
    }
  }, [hidden, marketId, history, hash]);

  return (
    <Screen
      title={intl.formatMessage({ id: 'loadingMarket' })}
      tabTitle={intl.formatMessage({ id: 'loadingMarket' })}
      hidden={hidden}
      loading={myLoading}
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
