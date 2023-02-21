import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { FormControl, FormControlLabel, Radio, RadioGroup, Typography } from '@material-ui/core';
import _ from 'lodash';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import { stageChangeInvestible } from '../../../api/investibles';
import { formInvestibleLink, navigate } from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import { getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { getMarketInfo } from '../../../utils/userFunctions';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import {
  getFullStage,
  getStageNameForId,
  getStages, isAcceptedStage, isFurtherWorkStage,
  isNotDoingStage,
  isVerifiedStage
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { onInvestibleStageChange } from '../../../utils/investibleFunctions';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { useIntl } from 'react-intl';
import { getMarketComments } from '../../../contexts/CommentsContext/commentsContextHelper';
import { getCommentsSortedByType } from '../../../utils/commentFunctions';
import { TODO_TYPE } from '../../../constants/comments';
import { getMyUserForMarket } from '../../../contexts/MarketsContext/marketsContextHelper';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';

function JobStageStep (props) {
  const { marketId, updateFormData, formData, investibleId } = props;
  const history = useHistory();
  const intl = useIntl();
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const [investibleState, investiblesDispatch] = useContext(InvestiblesContext);
  const [marketsState] = useContext(MarketsContext);
  const classes = useContext(WizardStylesContext);
  const userId = getMyUserForMarket(marketsState, marketId)
  const inv = getInvestible(investibleState, investibleId);
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const { stage, assigned } = marketInfo;
  const value = formData.stageWasSet ? formData.stage : stage;
  const validForm = !_.isEqual(value, stage);
  const isAssigned = (assigned || []).includes(userId);
  const fullStages = getStages(marketStagesState, marketId).filter((fullStage) => !fullStage.move_on_comment &&
    (isAssigned || !isAcceptedStage(fullStage)));
  const fullCurrentStage = getFullStage(marketStagesState, marketId, stage) || {};
  const fullMoveStage = getFullStage(marketStagesState, marketId, value) || {};
  const needsAssigning = isFurtherWorkStage(fullCurrentStage) && !isNotDoingStage(fullMoveStage);
  const marketComments = getMarketComments(commentsState, marketId) || [];
  const comments = getCommentsSortedByType(marketComments, investibleId, false) || [];
  const openTodos = comments.filter((comment) => comment.comment_type === TODO_TYPE);

  function onStageChange(newStage){
    updateFormData({
      stage: newStage,
      stageWasSet: true
    });
  }

  function finish() {
    navigate(history, formInvestibleLink(marketId, investibleId));
  }

  function move() {
    if (fullCurrentStage.move_on_comment && !isVerifiedStage(fullMoveStage) && !isNotDoingStage(fullMoveStage)) {
      // No op go to close comment step
      setOperationRunning(false);
      return Promise.resolve(true);
    }
    if (!_.isEmpty(openTodos) && isVerifiedStage(fullMoveStage)) {
      updateFormData({ hasOpenTodos: true });
      // No op go to assign step
      setOperationRunning(false);
      return Promise.resolve(true);
    }
    if (needsAssigning) {
      setOperationRunning(false);
      return Promise.resolve(true);
    }
    const moveInfo = {
      marketId,
      investibleId,
      stageInfo: {
        current_stage_id: marketInfo.stage,
        stage_id: fullMoveStage.id,
      },
    };
    return stageChangeInvestible(moveInfo)
      .then((newInv) => {
        onInvestibleStageChange(fullMoveStage.id, newInv, investibleId, marketId, commentsState,
          commentsDispatch, investiblesDispatch, () => {}, marketStagesState, undefined,
          fullCurrentStage);
        setOperationRunning(false);
        finish();
      });
  }

  if (!value) {
    return React.Fragment;
  }

  return (
    <WizardStepContainer
      {...props}
    >
      <div>
        <Typography className={classes.introText} variant="h6">
          To where will you move this job?
        </Typography>
        <Typography className={classes.introSubText} variant="subtitle1">
          Moving to backlog will remove assignment and approvals. {isAssigned ? '' : 'Must be assigned to move to started.'}
        </Typography>
        <FormControl component="fieldset">
          <RadioGroup
            aria-labelledby="stage-choice"
            onChange={(event) => {
              const { value } = event.target;
              onStageChange(value);
            }}
            value={value}
          >
            {fullStages.map((fullStage) => {
              const stageId = fullStage.id;
              return (
                <FormControlLabel
                  id={stageId}
                  key={stageId}
                  /* prevent clicking the label stealing focus */
                  onMouseDown={e => e.preventDefault()}
                  control={<Radio color="primary" />}
                  label={getStageNameForId(marketStagesState, marketId, stageId, intl)}
                  labelPlacement="end"
                  value={stageId}
                />
              );
            })}
          </RadioGroup>
        </FormControl>
        <div className={classes.borderBottom}/>
        <WizardStepButtons
          {...props}
          validForm={validForm}
          showNext={true}
          showTerminate={true}
          skipNextStep={needsAssigning}
          onNext={move}
          onTerminate={finish}
          terminateLabel="JobWizardGotoJob"
        />
      </div>
    </WizardStepContainer>
  )
}

JobStageStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
}

JobStageStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
}

export default JobStageStep