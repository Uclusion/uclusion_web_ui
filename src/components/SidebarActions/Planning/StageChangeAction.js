import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { useIntl } from 'react-intl';
import SpinBlockingSidebarAction from '../../../components/SpinBlocking/SpinBlockingSidebarAction';
import { stageChangeInvestible } from '../../../api/investibles';
import {
  getInvestible,
  refreshInvestibles
} from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { DiffContext } from '../../../contexts/DiffContext/DiffContext';
import { EMPTY_SPIN_RESULT } from '../../../constants/global';

function StageChangeAction(props) {
  const {
    investibleId,
    marketId,
    currentStageId,
    targetStageId,
    icon,
    translationId,
    explanationId,
    onSpinStop,
  } = props;

  const intl = useIntl();
  const [invState, invDispatch] = useContext(InvestiblesContext);
  const [, diffDispatch] = useContext(DiffContext);
  const inv = getInvestible(invState, investibleId);

  function moveToTarget() {
    const moveInfo = {
      marketId,
      investibleId,
      stageInfo: {
        current_stage_id: currentStageId,
        stage_id: targetStageId,
      },
    };
    // console.log(inv);
    const { market_infos: marketInfos } = inv;
    const thisMarketInfo = marketInfos.find((info) => info.market_id === marketId);
    return stageChangeInvestible(moveInfo)
      .then(() => {
        const newInfo = {
          ...thisMarketInfo,
          stage: targetStageId
        };
        const newMarketInfos = _.unionBy([newInfo], marketInfos, 'id');
        const newInv = {
          ...inv,
          market_infos: newMarketInfos
        };
        // console.log(newInv);
        refreshInvestibles(invDispatch, diffDispatch, [newInv]);
        return EMPTY_SPIN_RESULT;
      });
  }

  return (
    <SpinBlockingSidebarAction
      marketId={marketId}
      icon={icon}
      hasSpinChecker
      onSpinStop={onSpinStop}
      label={intl.formatMessage({ id: explanationId })}
      openLabel={intl.formatMessage({ id: translationId })}
      onClick={moveToTarget}
    />
  );
}

StageChangeAction.propTypes = {
  investibleId: PropTypes.string.isRequired,
  onSpinStop: PropTypes.func,
  icon: PropTypes.element.isRequired,
  translationId: PropTypes.string.isRequired,
  explanationId: PropTypes.string.isRequired,
  marketId: PropTypes.string.isRequired,
  currentStageId: PropTypes.string.isRequired,
  targetStageId: PropTypes.string.isRequired,
};

StageChangeAction.defaultProps = {
  onSpinStop: () => {},
};
export default StageChangeAction;
