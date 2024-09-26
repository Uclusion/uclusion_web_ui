import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import TooltipIconButton from '../../../components/Buttons/TooltipIconButton';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import { activateInactiveMarket } from '../../../api/markets';
import { addMarketToStorage } from '../../../contexts/MarketsContext/marketsContextHelper';
import SyncIcon from '@material-ui/icons/Sync';

function ActivateMarketButton(props){
  const { marketId } = props;
  const [, dispatch] = useContext(MarketsContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);

  function onProceed() {
    setOperationRunning(true);
    return activateInactiveMarket(marketId, true).then((result) => {
      setOperationRunning(false);
      addMarketToStorage(dispatch, result);
    });
  }

  return (
    <TooltipIconButton
      translationId="activateWorkspace"
      icon={<SyncIcon/>}
      onClick={onProceed}
    />
  );
}

ActivateMarketButton.propTypes = {
  marketId: PropTypes.string.isRequired,
};

export default ActivateMarketButton;