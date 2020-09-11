import { VerticalBarSeries, XYPlot } from 'react-vis'
import React from 'react'
import { Card, Grid, Typography } from '@material-ui/core'
import { INITIATIVE_TYPE } from '../constants/markets'
import { clearUclusionLocalStorage } from '../components/utils'
import TokenStorageManager from '../authorization/TokenStorageManager'
import { Auth } from 'aws-amplify'
import { getMarketPresences } from '../contexts/MarketPresencesContext/marketPresencesHelper'
import _ from 'lodash'

export function extractUsersList (marketPresencesState, addToMarketId, workspaces, includeNotFollowing=true) {
  const addToMarketPresencesRaw = getMarketPresences(marketPresencesState, addToMarketId) || [];
  const addToMarketPresences = addToMarketPresencesRaw.filter((presence) => !presence.market_guest);
  const addToMarketPresencesHash = addToMarketPresences.reduce((acc, presence) => {
    const { external_id } = presence;
    return { ...acc, [external_id]: true };
  }, {});
  return Object.keys(marketPresencesState).reduce((acc, marketId) => {
    const marketPresences = marketPresencesState[marketId] || [];
    if(_.isEmpty(marketPresences)) {
      return {};
    }
    const macc = {};
    let included = false;
    (workspaces || []).forEach((workspace) => {
      if (marketId === workspace.id) {
        included = true;
      }
    })
    if (included) {
      marketPresences.forEach((presence) => {
        const {
          id: user_id, name, account_id, external_id, email, market_banned: banned, current_user, following
        } = presence;
        if (!banned && !addToMarketPresencesHash[external_id] && !acc[user_id] && !macc[user_id]
          && (includeNotFollowing || following)) {
          const emailSplit = email ? email.split('@') : ['', ''];
          addToMarketPresencesHash[external_id] = true;
          macc[user_id] = {
            user_id, name, account_id, domain: emailSplit[1], isChecked: false, external_id, current_user
          };
        }
      });
    }
    return { ...acc, ...macc };
  }, {});
}

export function getFlags(user) {
  return (user && user.flags) || {};
}

export function getMarketInfo(investible, marketId) {
  return investible.market_infos.find((info) => info.market_id === marketId);
}

export function onSignOut() {
  // See https://aws-amplify.github.io/docs/js/authentication
  return clearUclusionLocalStorage(false)
    .then(() => new TokenStorageManager().clearTokenStorage())
    .then(() => Auth.signOut())
    .then(() => window.location.reload(true));
}

export function getVoteTotalsForUser(presence) {
  const { investments, name } = presence;
  if (!investments) {
    return {};
  }
  const realInvestments = investments.filter((investment) => !investment.deleted);
  return realInvestments.reduce((uInv, investment) => {
    const { investible_id, quantity } = investment;
    return {
      ...uInv,
      [investible_id]: { x: name, y: quantity, color: quantity / 30 }
    };
  }, {});
}

export function getVotedInvestible(presence, marketInvestibles) {
  const { investments } = presence;
  if (!Array.isArray(investments) || investments.length === 0) {
    return { name: "" };
  }
  const investment = investments[0];
  const { investible_id: investibleId } = investment;
  // eslint-disable-next-line max-len
  const fullInvestible = marketInvestibles.find(
    marketInvestible => marketInvestible.investible.id === investibleId
  );
  if (!fullInvestible) {
    return { name: "" };
  }
  const { investible } = fullInvestible;
  return investible;
}

function mapCertaintyToBin(certainty) {
  if (certainty === 100) {
    return 100;
  }
  if (certainty >= 75) {
    return 75;
  }
  if (certainty >= 50) {
    return 50;
  }
  if (certainty >= 25) {
    return 25;
  }
  if (certainty >= 0) {
    return 0;
  }
}

export function getInvestmentBins(investments) {
  const values = { 100: 0, 75: 0, 50: 0, 25: 0, 0: 0 };
  const colors = { 100: 3.333, 75: 3, 50: 2, 25: 1, 0: 0 };
  investments.forEach(investment => {
    const { y: certainty } = investment;
    const bin = mapCertaintyToBin(certainty);
    values[bin] += 1;
  });
  return [100, 75, 50, 25, 0].map(bin => {
    return {
      x: bin,
      y: values[bin],
      color: colors[bin]
    };
  });
}

export function getCertaintyChart(investments) {
  const margin = {
    top: 0,
    bottom: 1,
    left: 0,
    right: 1
  };
  const bins = getInvestmentBins(investments);
  return (
    <XYPlot
      xType="ordinal"
      height={investments.length * 12}
      width={70}
      yDomain={[0, investments.length]}
      colorDomain={[0, 3]}
      colorRange={["#F5270F", "#5ED635"]}
      margin={margin}
    >
      <VerticalBarSeries
        barWidth={0.6}
        data={bins}
        style={{ borderRadius: "3px" }}
      />
    </XYPlot>
  );
}

export function getParticipantInfo(presences, marketInvestibles, marketType) {
  return presences.map(presence => {
    const { id: userId, name } = presence;
    const investible = getVotedInvestible(presence, marketInvestibles);
    const { name: investibleName, id: investibleId } = investible;
    const voteTotal = getVoteTotalsForUser(presence);
    const investments =
      investibleId in voteTotal ? [voteTotal[investibleId]] : null;
    const isInitiative = marketType === INITIATIVE_TYPE;
    return (
      <Card elevation={0} key={userId}>
        <Grid container spacing={3}>
            <Grid item>
              <Typography>{name}</Typography>
            </Grid>
          {!isInitiative && (
          <Grid item>
            <Typography noWrap>{investibleName}</Typography>
          </Grid>
          )}
          <Grid item>{investments && getCertaintyChart(investments)}</Grid>
        </Grid>
      </Card>
    );
  });
}
