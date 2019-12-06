import { VerticalBarSeries, XYPlot } from 'react-vis';
import React from 'react';

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
      [investible_id]: { x: name, y: quantity, color: quantity / 30 },
    };
  }, {});
}

export function getCertaintyChart(investments) {
  const margin = {
    top: 0,
    bottom: 1,
    left: 0,
    right: 1,
  };
  return (
    <XYPlot
      xType="ordinal"
      width={investments.length * 12}
      height={40}
      yDomain={[0, 100]}
      colorDomain={[0, 3]}
      colorRange={['red', 'green']}
      margin={margin}
    >

      <VerticalBarSeries
        barWidth={0.4}
        data={investments}
      />
    </XYPlot>
  );
}
