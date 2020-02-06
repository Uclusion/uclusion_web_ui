import React, { useContext } from 'react';
import PropTypes from 'prop-types';

import EditIcon from '@material-ui/icons/Edit';
import TooltipIconButton from '../../components/Buttons/TooltipIconButton';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext';

function EditMarketButton(props) {
  const [operationRunning] = useContext(OperationInProgressContext);
  const {
    onClick,
    marketId,
    labelId,
  } = props;

  return (
    <TooltipIconButton
      marketId={marketId}
      onClick={onClick}
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
