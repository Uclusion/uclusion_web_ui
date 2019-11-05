/**
 * A component that renders a _decision_ dialog
 */
import React from 'react';
import PropTypes from 'prop-types';
import Summary from '../Summary';
import Investibles from '../Investibles';

function DecisionDialog(props) {

  const { market, investibles } = props;
  const { id: marketId } = market;

  return (
    <div>
      <Summary market={market} />
      {investibles && <Investibles investibles={investibles} marketId={marketId} />}
    </div>
  );
}

DecisionDialog.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  market: PropTypes.object.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  investibles: PropTypes.arrayOf(PropTypes.object),
};

DecisionDialog.defaultProps = {
  investibles: [],
};

export default DecisionDialog;
