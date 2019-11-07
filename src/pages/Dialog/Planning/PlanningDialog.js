/**
 * A component that renders a _decision_ dialog
 */
import React from 'react';
import PropTypes from 'prop-types';
import Summary from '../Summary';
import Investibles from '../Decision/Investibles';

function PlanningDialog(props) {

  const { market, investibles } = props;
  const { id: marketId } = market;

  return (
    <div>
      <Summary market={market} />
      {investibles && <Investibles investibles={investibles} marketId={marketId} />}
    </div>
  );
}

PlanningDialog.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  market: PropTypes.object.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  investibles: PropTypes.arrayOf(PropTypes.object),
};

PlanningDialog.defaultProps = {
  investibles: [],
};

export default PlanningDialog;
