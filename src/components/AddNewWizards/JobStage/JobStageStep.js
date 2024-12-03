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
  isNotDoingStage
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { onInvestibleStageChange } from '../../../utils/investibleFunctions';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { useIntl } from 'react-intl';
import { getMarketComments } from '../../../contexts/CommentsContext/commentsContextHelper';
import { getCommentsSortedByType } from '../../../utils/commentFunctions';
import { ISSUE_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE, TODO_TYPE } from '../../../constants/comments';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import JobDescription from '../../InboxWizards/JobDescription';
import { getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';

function JobStageStep (props) {
  const { marketId, updateFormData, formData, nextStep, investibleId, marketInfo, myFinish: finish,
    requiresAction, isSingleUser } = props;
  const intl = useIntl();
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [marketPresencesState,marketPresencesDispatch] = useContext(MarketPresencesContext);
  const classes = useContext(WizardStylesContext);
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
  const myPresence = marketPresences.find((presence) => presence.current_user);
  const userId = myPresence?.id;
  const { stage, assigned, group_id: groupId } = marketInfo;
  const value = formData.stageWasSet ? formData.stage : stage;
  const validForm = !_.isEqual(value, stage);
  const isAssigned = (assigned || []).includes(userId);
  const fullStagesRaw = getStages(marketStagesState, marketId).filter((fullStage) => !fullStage.move_on_comment &&
    (isAssigned || _.isEmpty(assigned) || !isAcceptedStage(fullStage)));
  const fullCurrentStage = getFullStage(marketStagesState, marketId, stage) || {};
  const fullMoveStage = getFullStage(marketStagesState, marketId, value) || {};
  const marketComments = getMarketComments(commentsState, marketId, groupId) || [];
  const comments = getCommentsSortedByType(marketComments, investibleId, false) || [];
  const fullStagesFiltered = isSingleUser ?
    fullStagesRaw?.filter((aStage) => !aStage.allows_investment) : fullStagesRaw;
  const fullStages = _.orderBy(fullStagesFiltered, (aStage) => {
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
    return 4;
  });

  function onStageChange(newStage){
    updateFormData({
      stage: newStage,
      stageWasSet: true
    });
  }
  const openTodos = comments.find((comment) => comment.comment_type === TODO_TYPE);
  const openAssistance = comments.find((comment) =>
    [QUESTION_TYPE, SUGGEST_CHANGE_TYPE, ISSUE_TYPE].includes(comment.comment_type));
  const hasOpenTodos = !_.isEmpty(openTodos) && isInReviewStage(fullMoveStage);
  const isCloseComments = hasOpenTodos ||
    (fullCurrentStage.move_on_comment && openAssistance && !fullMoveStage.close_comments_on_entrance &&
      !isFurtherWorkStage(fullMoveStage));
  const isFinal = isFurtherWorkStage(fullMoveStage)|| (isSingleUser&&!isCloseComments)||
    !(_.isEmpty(assigned)||isCloseComments||fullMoveStage.close_comments_on_entrance);
  function move() {
    if (!isFinal) {
      //No op go to next step
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
    if (isSingleUser&&_.isEmpty(assigned)&&!isFurtherWorkStage(fullMoveStage)&&!isNotDoingStage(fullMoveStage)) {
      moveInfo.stageInfo.assignments = [userId];
    }
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

  function doIncrement() {
    if (isNotDoingStage(fullMoveStage)) {
      // Get a comment on why not doing
      nextStep(3);
    } else if (_.isEmpty(formData.originalAssigned)&&!isFurtherWorkStage(fullMoveStage)&&!isSingleUser) {
      // Go to next normal step which is probably assign
      nextStep();
    } else if (isCloseComments) {
      nextStep(2);
    } else if (requiresAction(fullMoveStage)) {
      nextStep(3);
    }
  }

  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText} variant="h6">
        Where will you move this job?
      </Typography>
      {!isSingleUser && (
        <Typography className={classes.introSubText} variant="subtitle1">
          Moving to backlog will remove assignment and
          approvals. {isAssigned ? '' : 'You must be assigned to move to Approved.'}
        </Typography>
      )}
      <JobDescription marketId={marketId} investibleId={investibleId}/>
      <div style={{ marginBottom: '2rem' }}/>
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
                control={<Radio color="primary"/>}
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
        showNext
        isFinal={isFinal}
        onIncrement={doIncrement}
        onNext={move}
      />
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