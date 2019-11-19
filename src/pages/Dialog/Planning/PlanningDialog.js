/**
 * A component that renders a _decision_ dialog
 */
import React from 'react';
import PropTypes from 'prop-types';
import Summary from '../Summary';
import ProposedIdeas from '../Decision/ProposedIdeas';
import { Typography } from '@material-ui/core';

function PlanningDialog(props) {
  const { market, investibles, marketPresences } = props;
  const { id: marketId } = market;

  function getInvestiblesByPerson(investibles, marketPresences) {
    const followingPresences = marketPresences.filter((presence) => presence.following);
    return (
      <>
        {
        followingPresences.map((presence) => {
          const myInvestibles = investibles.filter((investible) => {
            const marketInfo = investible.market_infos.find((info) => info.market_id === marketId);
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
              <ProposedIdeas investibles={myInvestibles} marketId={marketId} />
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
};

PlanningDialog.defaultProps = {
  investibles: [],
  marketPresences: [],
};

export default PlanningDialog;
