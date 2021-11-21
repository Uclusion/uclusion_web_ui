import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import EditIcon from '@material-ui/icons/Edit'
import TooltipIconButton from '../../components/Buttons/TooltipIconButton'
import { ACTION_BUTTON_COLOR } from '../../components/Buttons/ButtonConstants'
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext'

function EditMarketButton(props) {
  const [operationRunning] = useContext(OperationInProgressContext);
  const {
    onClick,
    labelId,
    icon,
    marketId
  } = props;

  return (
    <TooltipIconButton
      id={labelId}
      onClick={onClick}
      disabled={operationRunning !== false}
      key={`exit${marketId}`}
      translationId={labelId}
      icon={icon ? icon : <EditIcon htmlColor={ACTION_BUTTON_COLOR} />}
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
