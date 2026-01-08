import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import { addPlanningInvestible } from '../../../api/investibles';
import { formInvestibleLink } from '../../../utils/marketIdPathFunctions';
import { refreshInvestibles } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import NameField, { clearNameStoredState, getNameStoredState } from '../../TextFields/NameField';
import { getAcceptedStage } from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { extractTodosList } from '../../../utils/commentFunctions';
import _ from 'lodash';
import { addCommentsToMarket } from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';

function JobNameStep(props) {
  const { marketId, groupId, updateFormData = () => {}, onFinish, formData = {}, moveFromComments, isSingleUser, myPresenceId } = props;
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [commentState, commentDispatch] = useContext(CommentsContext);
  const classes = useContext(WizardStylesContext);
  const [hasValue, setHasValue] = useState(false);
  const { description, uploadedFiles, jobStage, doCreateTasks, useApprovals } = formData;
  const nameId = `jobNameEdit${groupId}`;

  function createJob() {
    const name = getNameStoredState(nameId);
    const addInfo = {
      name,
      description,
      groupId,
      marketId,
      uploadedFiles
    }
    if (doCreateTasks) {
      const todos = extractTodosList(description);
      if (!_.isEmpty(todos)) {
        addInfo.todos = todos;
      }
    }
    if (jobStage === 'READY') {
      addInfo.openForInvestment = true;
    }
    if (isSingleUser) {
      if (!useApprovals) {
        addInfo.stageId = getAcceptedStage(marketStagesState, marketId).id;
      }
      addInfo.assignments = [myPresenceId];
    }
    return addPlanningInvestible(addInfo)
      .then((result) => {
        let inv = result;
        if (!_.isEmpty(addInfo.todos)) {
          const { investible, todos } = result;
          addCommentsToMarket(todos, commentState, commentDispatch);
          inv = investible;
        }
        clearNameStoredState(nameId);
        refreshInvestibles(investiblesDispatch, () => {}, [inv]);
        const { id: investibleId } = inv.investible;
        let link = formInvestibleLink(marketId, investibleId);
        // update the form data with the saved investible
        updateFormData({
          investibleId,
          link,
        });
        if (moveFromComments) {
          return moveFromComments(inv, formData, updateFormData);
        }
        if (jobStage === 'IMMEDIATE') {
          return { link };
        }
        onFinish({ link });
      })
  }

  return (
    <WizardStepContainer
      {...props}
      isLarge
    >
      <Typography className={classes.introText} style={{paddingBottom: '1rem'}}>
        How would you name this job?
      </Typography>
      <NameField id={nameId} setHasValue={setHasValue} />
      <div className={classes.borderBottom} />
      <WizardStepButtons
        {...props}
        validForm={hasValue}
        nextLabel="jobCreate"
        onNext={createJob}
        onNextDoAdvance={jobStage === 'IMMEDIATE' && (!isSingleUser || useApprovals)}
        isFinal={jobStage !== 'IMMEDIATE'}
      />
    </WizardStepContainer>
  );
}

JobNameStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

export default JobNameStep;