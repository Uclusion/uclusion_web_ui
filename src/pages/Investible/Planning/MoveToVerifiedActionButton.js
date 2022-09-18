import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import VerifiedUserIcon from '@material-ui/icons/VerifiedUser'
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext'
import { getVerifiedStage, } from '../../../contexts/MarketStagesContext/marketStagesContextHelper'
import StageChangeAction from '../../../components/SidebarActions/Planning/StageChangeAction'

function MoveToVerfiedActionButton(props) {
  const { marketId, disabled, hasTodos } = props;

  const [marketStagesState] = useContext(MarketStagesContext);
  const verifiedStage = getVerifiedStage(marketStagesState, marketId);

  if (!verifiedStage) {
    return React.Fragment;
  }

  return (
    <StageChangeAction
      { ...props }
      icon={hasTodos ? <VerifiedUserIcon color="disabled" /> : <VerifiedUserIcon />}
      targetStageId={verifiedStage.id}
      translationId="planningInvestibleMoveToVerifiedLabel"
      explanationId="planningInvestibleVerifiedExplanation"
      disabled={disabled}
      operationBlocked={hasTodos}
      blockedOperationTranslationId="mustRemoveTodosExplanation"
    />
  );
}

MoveToVerfiedActionButton.propTypes = {
  marketId: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
  hasTodos: PropTypes.bool.isRequired,
}
MoveToVerfiedActionButton.defaultProps = {
  disabled: false,
}

export default MoveToVerfiedActionButton;
