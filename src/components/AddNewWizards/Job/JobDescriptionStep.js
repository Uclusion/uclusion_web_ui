import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, Typography } from '@material-ui/core';
import _ from 'lodash';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import { editorEmpty, getQuillStoredState, resetEditor, storeState } from '../../TextEditors/Utilities/CoreUtils';
import { useEditor } from '../../TextEditors/quillHooks';
import { convertDescription } from '../../../utils/stringFunctions';
import { addPlanningInvestible } from '../../../api/investibles';
import {
  formInvestibleLink,
  formMarketAddInvestibleLink,
  navigate
} from '../../../utils/marketIdPathFunctions';
import { processTextAndFilesForSave } from '../../../api/files';
import { refreshInvestibles } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { FormattedMessage, useIntl } from 'react-intl';
import { bugRadioStyles } from '../Bug/BugDescriptionStep';
import { useHistory } from 'react-router';
import { createJobNameFromComments } from '../../../pages/Dialog/Planning/userUtils';
import { getAcceptedStage } from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { addCommentsToMarket } from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { extractTodosList } from '../../../utils/commentFunctions';

function JobDescriptionStep (props) {
  const { marketId, groupId, updateFormData, onFinish, roots, formData, jobType, startOver, nextStep,
    moveFromComments, isSingleUser, myPresenceId } = props;
  const history = useHistory();
  const intl = useIntl();
  const [marketStagesState] = useContext(MarketStagesContext);
  const [commentState, commentDispatch] = useContext(CommentsContext);
  const radioClasses = bugRadioStyles();
  const editorName = !_.isEmpty(roots) ? `addJobWizard${roots[0].id}` : `addJobWizard${groupId}`;
  const { newQuantity } = formData;

  function getDefaultDescription() {
    let defaultDescription = undefined;
    if (_.isEmpty(getQuillStoredState(editorName))&&!_.isEmpty(roots)) {
      const isNotBugMove = roots.find((fromComment) => !fromComment?.ticket_code?.startsWith('B'));
      if (isNotBugMove) {
        const fromComment = roots[0];
        const { body } = fromComment || {};
        // No need to clip to 80 here as that will happen when save
        const { name } = convertDescription(body, 200);
        defaultDescription = name;
      } else {
        defaultDescription = createJobNameFromComments(roots, intl);
      }
    }
    return defaultDescription;
  }

  const defaultDescription = getDefaultDescription();

  if (!_.isEmpty(defaultDescription)) {
    storeState(editorName, `<p>${defaultDescription}</p>`);
  }
  const [hasValue, setHasValue] = useState(!editorEmpty(getQuillStoredState(editorName)));
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const classes = useContext(WizardStylesContext);

  const editorSpec = {
    placeholder: "Ex: make magic happen via A, B, C",
    value: getQuillStoredState(editorName),
    marketId,
    autoFocus: true,
    onUpload: setUploadedFiles,
    onChange: () => { setHasValue(!editorEmpty(getQuillStoredState(editorName))); },
  };

  const [Editor] = useEditor(editorName, editorSpec);

  function createJob(readyToStart, doCreateTasks) {
    const {
      uploadedFiles: filteredUploads,
      text: tokensRemoved,
    } = processTextAndFilesForSave(uploadedFiles, getQuillStoredState(editorName));
    const { name, description} = convertDescription(tokensRemoved);
    if (_.isEmpty(name)) {
      updateFormData({
        description,
        uploadedFiles: filteredUploads,
        jobStage: currentValue
      });
      resetEditor(editorName);
      return Promise.resolve({isMissingName: true, doCreateTasks});
    }
    const addInfo = {
      name,
      description,
      groupId,
      marketId,
      uploadedFiles: filteredUploads
    }
    if (doCreateTasks) {
      const todos = extractTodosList(tokensRemoved);
      if (!_.isEmpty(todos)) {
        addInfo.todos = todos;
      }
    }
    if (readyToStart !== undefined) {
      addInfo.openForInvestment = readyToStart;
    }
    if (isSingleUser) {
      addInfo.stageId = getAcceptedStage(marketStagesState, marketId).id;
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
        refreshInvestibles(investiblesDispatch, () => {}, [inv]);
        const { id: investibleId } = inv.investible;
        let link = formInvestibleLink(marketId, investibleId);
        // reset the editor box
        resetEditor(editorName);
        // update the form data with the saved investible
        updateFormData({
          investibleId,
          link,
        });
        if (moveFromComments) {
          return moveFromComments(inv, formData, updateFormData).then(() => {
            return {link};
          });
        }
        return {link};
      })
  }

  function onNotReady(doCreateTasks){
     return createJob(false, doCreateTasks)
      .then(({link}) => {
        onFinish({
          link
        });
      });
  }

  function onChange(event) {
    updateFormData({
      newQuantity: event.target.value
    });
  }

  function doIncrement(resolved) {
    if (resolved?.isMissingName) {
      nextStep();
    } else if (currentValue === 'IMMEDIATE' && !isSingleUser) {
      nextStep(2);
    }
  }

  const hasFromComments = _.size(roots) > 0;
  function onTerminate() {
    let checkedString;
    roots.forEach((comment) => {
      if (checkedString) {
        checkedString += `&fromCommentId=${comment.id}`;
      } else {
        checkedString = `&fromCommentId=${comment.id}`;
      }
    });
    startOver();
    navigate(history, `${formMarketAddInvestibleLink(marketId, groupId)}${checkedString}`);
  }

  const defaultFromPage = jobType === undefined ? 'IMMEDIATE' : (jobType === '0' ? 'READY' : 'NOT_READY');
  const currentValue = newQuantity || defaultFromPage || '';

  function getNext(doCreateTasks=false) {
    return currentValue === 'NOT_READY' ? () => onNotReady(doCreateTasks) : (currentValue === 'READY' ?
      () => createJob(true, doCreateTasks).then(({link}) => {
        onFinish({ link });
      }) : (isSingleUser ? () => createJob(false, doCreateTasks).then(({link}) => {
        onFinish({ link });
      }) : () => createJob(false, doCreateTasks)));
  }

  return (
    <WizardStepContainer
      {...props}
      isLarge
    >
      <Typography className={classes.introText}>
        How would you describe this job?
      </Typography>
      <Typography className={classes.introSubText} variant="subtitle1" style={{marginBottom: 0}}>
        Use the second button 'Create with tasks' with a list like below or add tasks later.
        <ul>
          <li>My first task.</li>
          <li>My second task.</li>
        </ul>
      </Typography>
      <FormControl>
        <FormLabel
          className={radioClasses.certaintyLabel}
          id="add-vote-certainty"
        >
        </FormLabel>
        <RadioGroup
          aria-labelledby="add-vote-certainty"
          style={{display: 'flex', flexDirection: 'row'}}
          onChange={onChange}
          value={currentValue}
        >
          {['IMMEDIATE', 'READY', 'NOT_READY'].map(certainty => {
            return (
              <FormControlLabel
                key={certainty}
                id={`${certainty}`}
                className={radioClasses.certaintyValue}
                classes={{
                  label: radioClasses.certaintyValueLabel
                }}
                /* prevent clicking the label stealing focus */
                onMouseDown={e => e.preventDefault()}
                control={<Radio />}
                label={<FormattedMessage id={`jobTypeLabel${certainty}`} />}
                labelPlacement="start"
                value={certainty}
              />
            );
          })}
        </RadioGroup>
      </FormControl>
      <div style={{maxHeight: '300px', overflowY: 'auto', overflowX: 'hidden'}}>
        {Editor}
      </div>
      <div className={classes.borderBottom} />
      <WizardStepButtons
        {...props}
        validForm={hasValue}
        nextLabel='jobCreate'
        onNext={getNext()}
        showOtherNext
        otherNextLabel='jobCreateWithTasks'
        onOtherNext={getNext(true)}
        onIncrement={doIncrement}
        isFinal={currentValue !== 'IMMEDIATE' || isSingleUser}
        showTerminate={hasFromComments}
        onTerminate={onTerminate}
        terminateLabel='JobWizardStartOver'
      />
    </WizardStepContainer>
  );
}

JobDescriptionStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

JobDescriptionStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default JobDescriptionStep;