import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Paper, Typography } from '@material-ui/core';
import { withUserAndPermissions } from '../../components/UserPermissions/UserPermissions';
import withAppConfigs from '../../utils/withAppConfigs';
import { withMarketId } from '../../components/PathProps/MarketId';
import { getClient } from '../../config/uclusionClient';
import { ERROR, sendIntlMessage } from '../../utils/userMessage';

function About(props) {
  const {
    upUser,
    userPermissions,
    appConfig,
    marketId,
  } = props;

  const { isMarketAdmin } = userPermissions;
  const { version } = appConfig;

  const [market, setMarket] = useState(undefined);

  console.log(isMarketAdmin);
  useEffect(() => {
    const clientPromise = getClient();
    clientPromise.then(client => client.markets.get(marketId))
      .then((market) => {
        setMarket(market);
      }).catch((error) => {
        console.debug(error);
        sendIntlMessage(ERROR, { id: 'marketFetchFailed' });
      });
    return () => {
    };
  }, [marketId]);

  // Each one of the paper blocks here represent a logical section of the page. We'll probably
  // want to skin it with pretty headers etc.
  return (
    <div>
      <Paper>
        <Typography>
          Application version:
          {version}
        </Typography>
      </Paper>
      <Paper>
        <Typography>
          Market Id:
          { marketId }
          <br />
          Account Id:
          { market && market.account_id
          }<br />
          Account Name:
          { market && market.account_name }
        </Typography>
      </Paper>
      <Paper>
        <Typography>
          User Id:
          { upUser && upUser.id }
          <br />
          User Name:
          { upUser && upUser.name }
          <br />
          Team Id:
          { upUser && upUser.team_id }
        </Typography>
      </Paper>
      {isMarketAdmin && (
        <Paper>
          <Typography>
            Uclusion Email:
            { appConfig.uclusionSupportInfo.email }
          </Typography>
        </Paper>
      )}
    </div>
  );
}

About.propTypes = {
  upUser: PropTypes.object,
  userPermissions: PropTypes.object,
  appConfig: PropTypes.object.isRequired,
  marketId: PropTypes.string.isRequired

};

export default withUserAndPermissions(withAppConfigs(withMarketId(About)));