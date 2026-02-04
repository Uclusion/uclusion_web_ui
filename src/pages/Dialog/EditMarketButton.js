import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import EditIcon from '@material-ui/icons/Edit'
import TooltipIconButton from '../../components/Buttons/TooltipIconButton'
import { useButtonColors } from '../../components/Buttons/ButtonConstants'
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext'

function EditMarketButton(props) {
  const [operationRunning] = useContext(OperationInProgressContext);
  const { actionButtonColor } = useButtonColors();
  const {
    onClick = () => {},
    labelId,
    icon,
    marketId,
    isDisabled
  } = props;

  return (
    <TooltipIconButton
      id={labelId}
      onClick={onClick}
      disabled={operationRunning !== false || isDisabled}
      key={`exit${marketId}`}
      translationId={labelId}
      icon={icon ? icon : <EditIcon htmlColor={actionButtonColor} />}
    />
  );
}

EditMarketButton.propTypes = {
  marketId: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  labelId: PropTypes.string.isRequired,
};

export default EditMarketButton;
