import { VerticalBarSeries, XYPlot } from 'react-vis'
import React from 'react'
import { Card, Grid, Typography } from '@material-ui/core'
import { INITIATIVE_TYPE } from '../constants/markets'
import {
  clearUclusionLocalStorage, getLoginPersistentItem, setLoginPersistentItem,
} from '../components/localStorageUtils'
import TokenStorageManager from '../authorization/TokenStorageManager'
import { Auth } from 'aws-amplify'
import { getMarketPresences } from '../contexts/MarketPresencesContext/marketPresencesHelper'
import _ from 'lodash'
import config from '../config'

const LOGOUT_MARKER_KEY = 'logout_marker';

export function extractUsersList (marketPresencesState, addToMarketId, workspaces, includeAll=true) {
  // The account user is being stored with an undefined market ID and so need to avoid it
  const addToMarketPresencesRaw = addToMarketId ? getMarketPresences(marketPresencesState, addToMarketId) || [] : [];
  const addToMarketPresences = addToMarketPresencesRaw.filter((presence) => !presence.market_guest || includeAll);
  const addToMarketPresencesHash = addToMarketPresences.reduce((acc, presence) => {
    const { external_id } = presence;
    return { ...acc, [external_id]: true };
  }, {});
  return Object.keys(marketPresencesState).reduce((acc, marketId) => {
    const marketPresences = marketPresencesState[marketId] || [];
    if(!Array.isArray(marketPresences) || _.isEmpty(marketPresences)) {
      return acc;
    }
    const macc = {};
    let included = false;
    (workspaces || []).forEach((workspace) => {
      if (marketId === workspace.id) {
        included = true;
      }
    })
    if (included || includeAll) {
      marketPresences.forEach((presence) => {
        const {
          id: user_id, name, account_id, external_id, email, market_banned: banned, current_user, following
        } = presence;
        if (!banned && !addToMarketPresencesHash[external_id] && !acc[user_id] && !macc[user_id]
          && (includeAll || following)) {
          addToMarketPresencesHash[external_id] = true;
          macc[user_id] = {
            user_id, name, account_id, email, isChecked: false, external_id, current_user
          };
        }
      });
    }
    return { ...acc, ...macc };
  }, {});
}

export function assignedInStage(investibles, userId, stageId, marketId) {
  return investibles.filter(investible => {
    const { market_infos: marketInfos } = investible;
    // // console.log(`Investible id is ${id}`);
    const marketInfo = marketInfos.find(info => info.market_id === marketId);
    // eslint-disable-next-line max-len
    return (
      marketInfo.stage === stageId &&
      marketInfo.assigned &&
      marketInfo.assigned.includes(userId)
    );
  });
}

export function getRandomSupportUser() {
  const supportUsers = config.support_users;
  return _.sample(supportUsers);
}

export function getFlags(user) {
  return (user && user.flags) || {};
}

export function getMarketInfo(investible, marketId) {
  if (!investible || !investible.market_infos) {
    return {};
  }
  return investible.market_infos.find((info) => info.market_id === marketId);
}

export function isSignedOut() {
  return !_.isEmpty(getLoginPersistentItem(LOGOUT_MARKER_KEY));
}

export function clearSignedOut() {
  setLoginPersistentItem(LOGOUT_MARKER_KEY, '');
  window.location.reload();
}

export function onSignOut() {
  console.info('Signing out');
  setLoginPersistentItem(LOGOUT_MARKER_KEY, 'logged_out');
  // See https://aws-amplify.github.io/docs/js/authentication
  return clearUclusionLocalStorage(false)
    .then(() => new TokenStorageManager().clearTokenStorage())
    .then(() => Auth.signOut())
    .then(() => window.location.reload(true));
}

export function getVoteTotalsForUser(presence) {
  const { investments, name, email } = presence;
  if (!investments) {
    return {};
  }
  const realInvestments = investments.filter((investment) => !investment.deleted);
  return realInvestments.reduce((uInv, investment) => {
    const { investible_id, quantity } = investment;
    return {
      ...uInv,
      [investible_id]: { x: name, y: quantity, color: quantity / 30, email, name }
    };
  }, {});
}

export function getVotesForInvestible(marketPresences, investibleId) {
  return (marketPresences || []).filter(presence => {
    const { investments } = presence;
    if (!Array.isArray(investments) || investments.length === 0) {
      return false;
    }
    let found = false;
    investments.forEach(investment => {
      const { investible_id: invId, deleted } = investment;
      if (invId === investibleId && !deleted) {
        found = true;
      }
    });
    return found;
  });
}

export function getMarketUpdatedAt(updatedAt, marketPresences, investibles, comments, marketId) {
  let mostRecentUpdate = updatedAt;
  marketPresences.forEach((presence) => {
    const { investments } = presence;
    if (investments) {
      investments.forEach((investment) => {
        const { updated_at: investmentUpdatedAt } = investment;
        const fixed = new Date(investmentUpdatedAt);
        if (fixed > mostRecentUpdate) {
          mostRecentUpdate = fixed;
        }
      });
    }
  });
  investibles.forEach((fullInvestible) => {
    const { investible } = fullInvestible;
    const { updated_at: investibleUpdatedAt } = investible;
    let fixed = new Date(investibleUpdatedAt);
    if (fixed > mostRecentUpdate) {
      mostRecentUpdate = fixed;
    }
    const marketInfo = getMarketInfo(fullInvestible, marketId);
    const { updated_at: infoUpdatedAt } = marketInfo;
    fixed = new Date(infoUpdatedAt);
    if (fixed > mostRecentUpdate) {
      mostRecentUpdate = fixed;
    }
  });
  comments.forEach((comment) => {
    const { updated_at: commentUpdatedAt } = comment;
    const fixed = new Date(commentUpdatedAt);
    if (fixed > mostRecentUpdate) {
      mostRecentUpdate = fixed;
    }
  });
  return mostRecentUpdate;
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
