import React, { useEffect, useState } from 'react'
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router';
import {
  decomposeMarketPath,
  formMarketLink,
  navigate,
} from '../../utils/marketIdPathFunctions';
import Screen from '../../containers/Screen/Screen';
import { MARKET_MESSAGE_EVENT, VERSIONS_HUB_CHANNEL } from '../../contexts/WebSocketContext';
import { getMarketClient } from '../../api/uclusionClient';
import { registerListener } from '../../utils/MessageBusUtils';
import { toastError } from '../../utils/userMessage';
import queryString from 'query-string'

function MarketInvite(props) {
  const { hidden } = props;
  const intl = useIntl();
  const history = useHistory();
  const { location } = history;
  const { pathname } = location;
  const { hash } = location;
  const { marketId } = decomposeMarketPath(pathname);
  const [myLoading, setMyLoading] = useState(true);

  useEffect(() => {
    if (!hidden) {
      registerListener(VERSIONS_HUB_CHANNEL, 'inviteListener', (data) => {
        const { payload: { event, message } } = data;
        switch (event) {
          case MARKET_MESSAGE_EVENT: {
            const { object_id: messageMarketId } = message;
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
      getMarketClient(marketId, isObserver === 'true')
        .catch((error) => {
          setMyLoading(false);
          console.error(error);
          toastError('errorMarketFetchFailed');
        });
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
