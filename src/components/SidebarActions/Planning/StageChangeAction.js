import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'
import { useIntl } from 'react-intl'
import SpinBlockingSidebarAction from '../../../components/SpinBlocking/SpinBlockingSidebarAction'
import { stageChangeInvestible } from '../../../api/investibles'
import { getInvestible, refreshInvestibles } from '../../../contexts/InvestibesContext/investiblesContextHelper'
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'
import { DiffContext } from '../../../contexts/DiffContext/DiffContext'
import { EMPTY_SPIN_RESULT } from '../../../constants/global'
import { makeStyles } from '@material-ui/styles'

export const useStyles = makeStyles((theme) => {
  return {
    menuItem: {
      paddingLeft: 0,
      paddingRight: 0,
      marginRight: 0,
      paddingBottom: '10px',
    },
    menuIcon: {
      paddingLeft: 0,
      paddingRight: 0,
      marginRight: 0,
      display: 'flex',
      justifyContent: 'center',
      color: 'black',
      '& > .MuiSvgIcon-root': {
        width: '30px',
        height: '30px',
      },
    },
    menuTitle: {
      paddingLeft: 0,
      paddingRight: 0,
      marginRight: 0,
      color: 'black',
      fontWeight: 'bold',
    },
  };
});

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
    isOpen,
    disabled,
    removeAssignments,
  } = props;
  const classes = useStyles();
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
        if (removeAssignments) {
          delete newInfo.assigned;
        }
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
      customClasses={classes}
      isOpen={isOpen}
      disabled={disabled}
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
  isOpen: PropTypes.bool.isRequired,
  disabled: PropTypes.bool.isRequired,
  removeAssignments: PropTypes.bool,
};

StageChangeAction.defaultProps = {
  onSpinStop: () => {},
  removeAssignments: false,
};
export default StageChangeAction;
