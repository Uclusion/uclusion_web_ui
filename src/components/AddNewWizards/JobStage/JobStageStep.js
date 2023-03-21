import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { FormControl, FormControlLabel, Radio, RadioGroup, Typography } from '@material-ui/core';
import _ from 'lodash';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import { stageChangeInvestible } from '../../../api/investibles';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import {
  getFullStage,
  getStageNameForId,
  getStages,
  isAcceptedStage,
  isFurtherWorkStage,
  isInReviewStage,
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
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';

function JobStageStep (props) {
  const { marketId, updateFormData, formData, investibleId, marketInfo, myFinish: finish } = props;
  const intl = useIntl();
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [marketsState] = useContext(MarketsContext);
  const [,marketPresencesDispatch] = useContext(MarketPresencesContext);
  const classes = useContext(WizardStylesContext);
  const userId = getMyUserForMarket(marketsState, marketId)
  const { stage, assigned } = marketInfo;
  const value = formData.stageWasSet ? formData.stage : stage;
  const validForm = !_.isEqual(value, stage);
  const isAssigned = (assigned || []).includes(userId);
  const fullStagesRaw = getStages(marketStagesState, marketId).filter((fullStage) => !fullStage.move_on_comment &&
    (isAssigned || !isAcceptedStage(fullStage)));
  const fullCurrentStage = getFullStage(marketStagesState, marketId, stage) || {};
  const fullMoveStage = getFullStage(marketStagesState, marketId, value) || {};
  const marketComments = getMarketComments(commentsState, marketId) || [];
  const comments = getCommentsSortedByType(marketComments, investibleId, false) || [];
  const fullStages = _.orderBy(fullStagesRaw, (aStage) => {
    if (isFurtherWorkStage(aStage)) {
      return 0;
    }
    if (aStage.allows_investment) {
      return 1;
    }
    if (isAcceptedStage(aStage)) {
      return 2;
    }
    if (isInReviewStage(aStage)) {
      return 3;
    }
    if (isVerifiedStage(aStage)) {
      return 4;
    }
    return 5;
  });

  function onStageChange(newStage){
    updateFormData({
      stage: newStage,
      stageWasSet: true
    });
  }

  function move() {
    if (!isNotDoingStage(fullMoveStage)&&!isFurtherWorkStage(fullMoveStage)) {
      const openTodos = comments.find((comment) => comment.comment_type === TODO_TYPE);
      const hasOpenTodos = !_.isEmpty(openTodos) && isVerifiedStage(fullMoveStage)
      if (hasOpenTodos || (fullCurrentStage.move_on_comment && !isVerifiedStage(fullMoveStage))) {
        // No op go to CloseCommentsStep
        setOperationRunning(false);
        return Promise.resolve(true);
      }
      if (isFurtherWorkStage(fullCurrentStage)) {
        //No op go to JobAssignStep
        setOperationRunning(false);
        return Promise.resolve(true);
      }
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
          fullCurrentStage, marketPresencesDispatch);
        setOperationRunning(false);
        finish(fullMoveStage);
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
          Moving to backlog will remove assignment and approvals. {isAssigned ? '' : 'You must be assigned to move to started.'}
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