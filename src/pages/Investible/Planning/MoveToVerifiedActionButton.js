import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import VerifiedUserIcon from '@material-ui/icons/VerifiedUser'
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext'
import { getVerifiedStage, } from '../../../contexts/MarketStagesContext/marketStagesContextHelper'
import StageChangeAction from '../../../components/SidebarActions/Planning/StageChangeAction'

function MoveToVerfiedActionButton(props) {
  const { marketId, disabled } = props;

  const [marketStagesState] = useContext(MarketStagesContext);
  const verifiedStage = getVerifiedStage(marketStagesState, marketId);

  if (!verifiedStage) {
    return React.Fragment;
  }

  return (
    <StageChangeAction
      { ...props }
      icon={<VerifiedUserIcon />}
      targetStageId={verifiedStage.id}
      translationId="planningInvestibleMoveToVerifiedLabel"
      explanationId="planningInvestibleVerifiedExplanation"
      disabled={disabled}
    />
  );
}

MoveToVerfiedActionButton.propTypes = {
  marketId: PropTypes.string.isRequired,
  disabled: PropTypes.bool.isRequired,
};

export default MoveToVerfiedActionButton;
