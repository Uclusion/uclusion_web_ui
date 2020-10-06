import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward'
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext'
import {
  getInCurrentVotingStage,
  getProposedOptionsStage,
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper'
import { moveInvestibleToCurrentVoting } from '../../../api/investibles'
import SpinningTooltipIconButton from '../../../components/SpinBlocking/SpinningTooltipIconButton'
import { ACTION_BUTTON_COLOR } from '../../../components/Buttons/ButtonConstants'
import { makeStyles } from '@material-ui/styles'
import { ListItemText } from '@material-ui/core'
import { useIntl } from 'react-intl'
import { refreshInvestibles } from '../../../contexts/InvestibesContext/investiblesContextHelper'
import { DiffContext } from '../../../contexts/DiffContext/DiffContext'
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'

const style = makeStyles(() => {
    return {
      containerRed: {
        boxShadow: "10px 5px 5px red"
      },
      menuTitle: {
        paddingLeft: 0,
        paddingRight: 0,
        marginRight: 0,
        color: 'black',
        fontWeight: 'bold',
      },
    };
  }
);

function MoveToCurrentVotingActionButton(props) {
  const { onClick, investibleId, marketId } = props;
  const intl = useIntl();
  const classes = style();
  const [marketStagesState] = useContext(MarketStagesContext);
  const [, diffDispatch] = useContext(DiffContext);
  const [, invDispatch] = useContext(InvestiblesContext);
  const inCurrentVotingStage = getInCurrentVotingStage(marketStagesState, marketId);
  const proposedStage = getProposedOptionsStage(marketStagesState, marketId);

  function moveToProposed() {
    const moveInfo = {
      marketId,
      investibleId,
      stageInfo: {
        current_stage_id: proposedStage.id,
        stage_id: inCurrentVotingStage.id,
      },
    };
    return moveInvestibleToCurrentVoting(moveInfo)
      .then((inv) => {
        refreshInvestibles(invDispatch, diffDispatch, [inv]);
        onClick();
      });
  }

  return (
    <div className={classes.containerRed}>
      <SpinningTooltipIconButton
        marketId={marketId}
        icon={<ArrowUpwardIcon htmlColor={ACTION_BUTTON_COLOR} />}
        translationId="investibleAddToVotingExplanation"
        onClick={moveToProposed}
      >
        <ListItemText className={classes.menuTitle}>
          {intl.formatMessage({ id: 'investibleAddToVotingLabel' })}
        </ListItemText>
      </SpinningTooltipIconButton>
    </div>
  );
}

MoveToCurrentVotingActionButton.propTypes = {
  onClick: PropTypes.func,
  investibleId: PropTypes.string.isRequired,
  marketId: PropTypes.string.isRequired,
};

MoveToCurrentVotingActionButton.defaultProps = {
  onClick: () => {},
};

export default MoveToCurrentVotingActionButton;
