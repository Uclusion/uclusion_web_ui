import { VerticalBarSeries, XYPlot } from 'react-vis';
import React from 'react';
import { Card, Grid, Typography } from '@material-ui/core';

export function getFlags(user) {
  return (user && user.flags) || {};
}

export function getMarketInfo(investible, marketId) {
  return investible.market_infos.find((info) => info.market_id === marketId);
}

export function getVoteTotalsForUser(presence) {
  const { investments, name } = presence;
  return investments.reduce((uInv, investment) => {
    const { investible_id, quantity } = investment;
    return {
      ...uInv,
      [investible_id]: { x: name, y: quantity, color: quantity / 30},
    };
  }, {});
}

function getMinBudget(investibleId, marketPresences) {
  const budgets = [];
  marketPresences.forEach((presence) => {
    const { investments } = presence;
    const filteredInvestments = investments.filter((investment) => {
      const { investible_id: id } = investment;
      return id === investibleId;
    });
    filteredInvestments.forEach((investment) => {
      const { max_budget: budget } = investment;
      if (budget) {
        budgets.push(budget);
      }
    });
  });
  if (budgets.length === 0) {
    return 0;
  }
  return Math.min(...budgets);
}

function getMinBudgetsForIds(investibleIds, marketPresences) {
  const budgets = [];
  investibleIds.forEach((investibleId) => {
    budgets.push(getMinBudget(investibleId, marketPresences));
  });
  return budgets;
}

function getAssignedInvestibleIdsForStage(userId, stageId, marketId, marketInvestibles) {
  // eslint-disable-next-line max-len
  const marketInfos = marketInvestibles.map((marketInvestible) => ({ investible_id: marketInvestible.investible.id, ...getMarketInfo(marketInvestible, marketId) }));
  if (!Array.isArray(marketInfos) || marketInfos.length === 0) {
    return [];
  }
  const marketInfosForStage = marketInfos.filter((marketInfo) => marketInfo.stage === stageId);
  if (!Array.isArray(marketInfosForStage) || marketInfosForStage.length === 0) {
    return [];
  }
  // eslint-disable-next-line max-len
  const assignedMarketInfosForStage = marketInfosForStage.filter((marketInfo) => marketInfo.assigned.includes(userId));
  if (!Array.isArray(assignedMarketInfosForStage) || assignedMarketInfosForStage.length === 0) {
    return [];
  }
  return assignedMarketInfosForStage.map((marketInfo) => marketInfo.investible_id);
}

export function getBudgetTotalsForUser(userId, stageId, marketId, marketPresences,
  marketInvestibles) {
  // eslint-disable-next-line max-len
  const investibleIds = getAssignedInvestibleIdsForStage(userId, stageId, marketId, marketInvestibles);
  if (!Array.isArray(investibleIds) || investibleIds.length === 0) {
    return 0;
  }
  const budgets = getMinBudgetsForIds(investibleIds, marketPresences);
  const add = (a, b) => a + b;
  return budgets.reduce(add);
}

export function getVotedInvestible(presence, marketInvestibles) {
  const { investments } = presence;
  if (!Array.isArray(investments) || investments.length === 0) {
    return { name: '' };
  }
  const investment = investments[0];
  const { investible_id: investibleId } = investment;
  // eslint-disable-next-line max-len
  const fullInvestible = marketInvestibles.find((marketInvestible) => marketInvestible.investible.id === investibleId);
  if (!fullInvestible) {
    return { name: '' };
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

function getInvestmentBins(investments) {
  const values = {100:0, 75:0, 50:0, 25:0, 0:0 };
  const colors = {100: 3.333, 75:3, 50:2, 25:1, 0:0}
  investments.forEach((investment) => {
    const { y: certainty } = investment;
    const bin = mapCertaintyToBin(certainty);
    values[bin] += 1;
  });
  return [100, 75, 50, 25, 0].map((bin) => {
    return {
      x: bin,
      y: values[bin],
      color: colors[bin],
    }});
}

export function getCertaintyChart(investments) {
  const margin = {
    top: 0,
    bottom: 1,
    left: 0,
    right: 1,
  };
  const bins = getInvestmentBins(investments);
  console.log(bins);
  return (
    <XYPlot
      xType="ordinal"
      width={investments.length * 12}
      height={40}
      yDomain={[0, investments.length]}
      colorDomain={[0, 3]}
      colorRange={['red', 'green']}
      margin={margin}
    >

      <VerticalBarSeries
        barWidth={0.4}
        data={bins}
      />
    </XYPlot>
  );
}

export function getParticipantInfo(presences, marketInvestibles) {
  return presences.map((presence) => {
    const { id: userId, name } = presence;
    const investible = getVotedInvestible(presence, marketInvestibles);
    const { name: investibleName, id: investibleId } = investible;
    const voteTotal = getVoteTotalsForUser(presence);
    const investments = investibleId in voteTotal ? [voteTotal[investibleId]] : null;
    return (
      <Card
        key={userId}
      >
        <Grid
          container
          spacing={3}
        >
          <Grid
            item
          >
            <Typography>{name}</Typography>
          </Grid>
          <Grid
            item
            xs={9}
          >
            <Typography
              noWrap
            >
              {investibleName}
            </Typography>
          </Grid>
          <Grid
            item
          >
            {investments && getCertaintyChart(investments)}
          </Grid>
        </Grid>
      </Card>
    );
  });
}
