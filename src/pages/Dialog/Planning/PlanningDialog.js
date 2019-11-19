/**
 * A component that renders a _decision_ dialog
 */
import React from 'react';
import PropTypes from 'prop-types';
import Summary from '../Summary';
import PlanningIdeas from './PlanningIdeas';
import { Typography } from '@material-ui/core';
import { getMarketInfo } from '../../../utils/userFunctions';

function PlanningDialog(props) {
  const { market, investibles, marketPresences, marketStages } = props;
  const { id: marketId } = market;

  function getInvestiblesByPerson(investibles, marketPresences) {
    const followingPresences = marketPresences.filter((presence) => presence.following);
    // eslint-disable-next-line max-len
    const acceptedStage = marketStages.find((stage) => (!stage.allows_investment && stage.allows_refunds));
    return (
      <>
        {
        followingPresences.map((presence) => {
          const myInvestibles = investibles.filter((investible) => {
            const marketInfo = getMarketInfo(investible, marketId);
            return marketInfo.assigned.includes(presence.id);
          });
          return (
            <>
              <br />
              <Typography
                noWrap
              >
                {presence.name}
              </Typography>
              <br />
              {marketId && acceptedStage && (
              <PlanningIdeas
                investibles={myInvestibles}
                marketId={marketId}
                acceptedStageId={acceptedStage.id}
              />
              )}
            </>
          );
        })
      }
      </>
    );
  }

  return (
    <div>
      <Summary market={market} />
      {getInvestiblesByPerson(investibles, marketPresences)}
    </div>
  );
}

PlanningDialog.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  market: PropTypes.object.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  investibles: PropTypes.arrayOf(PropTypes.object),
  // eslint-disable-next-line react/forbid-prop-types
  marketPresences: PropTypes.arrayOf(PropTypes.object),
  // eslint-disable-next-line react/forbid-prop-types
  marketStages: PropTypes.arrayOf(PropTypes.object),
};

PlanningDialog.defaultProps = {
  investibles: [],
  marketPresences: [],
  marketStages: [],
};

export default PlanningDialog;
