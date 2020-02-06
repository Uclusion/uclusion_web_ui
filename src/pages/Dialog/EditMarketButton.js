import React, { useContext } from 'react';
import PropTypes from 'prop-types';

import EditIcon from '@material-ui/icons/Edit';
import TooltipIconButton from '../../components/Buttons/TooltipIconButton';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext';
import { withSpinLock } from '../../components/SpinBlocking/SpinBlockingHOC';
import { useHistory } from 'react-router';
import { formMarketEditLink, navigate } from '../../utils/marketIdPathFunctions';

function EditMarketButton(props) {
  const [operationRunning] = useContext(OperationInProgressContext);
  const {
    onClick,
    marketId,
    labelId,
  } = props;

  const history = useHistory();
  function myOnSpinStop(){
    navigate(history, formMarketEditLink(marketId));
  }

  const SpinningTooltipIconButton = withSpinLock(TooltipIconButton);

  return (
    <SpinningTooltipIconButton
      marketId={marketId}
      onClick={onClick}
      onSpinStop={myOnSpinStop}
      disabled={operationRunning}
      key="exit"
      translationId={labelId}
      icon={<EditIcon />}
    />
  );
}

EditMarketButton.propTypes = {
  marketId: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  labelId: PropTypes.string.isRequired,
};

EditMarketButton.defaultProps = {
  onClick: () => {
  },
};

export default EditMarketButton;
