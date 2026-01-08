import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, Tooltip, Typography } from '@material-ui/core';
import _ from 'lodash';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import {
  editorEmpty,
  focusEditor,
  getQuillStoredState,
  resetEditor,
  storeState
} from '../../TextEditors/Utilities/CoreUtils';
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
import { useHotkeys } from 'react-hotkeys-hook';
import { getGroupPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { GroupMembersContext } from '../../../contexts/GroupMembersContext/GroupMembersContext';

function JobDescriptionStep (props) {
  const { marketId, groupId, updateFormData = () => {}, onFinish, roots, formData = {}, jobType, startOver, nextStep,
    moveFromComments, isSingleUser, myPresenceId, presences } = props;
  const history = useHistory();
  const intl = useIntl();
  const [marketStagesState] = useContext(MarketStagesContext);
  const [commentState, commentDispatch] = useContext(CommentsContext);
  const [groupPresencesState] = useContext(GroupMembersContext);
  const radioClasses = bugRadioStyles();
  const groupPresences = getGroupPresences(presences, groupPresencesState, marketId, groupId) || [];
  const myGroupPresence = groupPresences.find((presence) => presence.id === myPresenceId);
  const isMovingTasks = !_.isEmpty(roots);
  const editorName = isMovingTasks ? `addJobWizard${roots[0].id}` : `addJobWizard${groupId}`;
  const { newQuantity } = formData;
  const jobTypes = ['READY', 'NOT_READY'];
  const showImmediate = !_.isEmpty(myGroupPresence)||!isSingleUser;
  const marketHasOthers = _.size(presences) > 1;
  if (showImmediate) {
    jobTypes.unshift('IMMEDIATE');
  }

  function getDefaultDescription() {
    let defaultDescription = undefined;
    if (_.isEmpty(getQuillStoredState(editorName))&&isMovingTasks) {
      const isNotBugMove = roots.find((fromComment) => !fromComment?.ticket_code?.startsWith('B'));
      if (isNotBugMove) {
        // If moving more than one non bug task don't default the description
        if (_.size(roots) === 1) {
          const fromComment = roots[0];
          const { body } = fromComment || {};
          // No need to clip to 80 here as that will happen when save
          const { name } = convertDescription(body, 200);
          defaultDescription = name;
        }
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
    placeholder: "Ex: Make magic happen. A bullet list in this description will be become tasks.",
    value: getQuillStoredState(editorName),
    marketId,
    autoFocus: true,
    maxHeight: '300px',
    onUpload: setUploadedFiles,
    onChange: () => { setHasValue(!editorEmpty(getQuillStoredState(editorName))); },
  };

  const [Editor] = useEditor(editorName, editorSpec);

  function onChange(event) {
    updateFormData({
      newQuantity: event.target.value
    });
    focusEditor(editorName);
  }

  function doIncrement(resolved) {
    if (resolved?.isMissingName) {
      nextStep();
    } else if (currentValue === 'IMMEDIATE' && (resolved?.useApprovals || !isSingleUser)) {
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

  function createJob(useApprovals) {
    const readyToStart = currentValue === 'IMMEDIATE' ? undefined : (currentValue === 'READY');
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
      return Promise.resolve({isMissingName: true, useApprovals});
    }
    const addInfo = {
      name,
      description,
      groupId,
      marketId,
      uploadedFiles: filteredUploads
    }
    const todos = extractTodosList(tokensRemoved);
    if (!_.isEmpty(todos)) {
      addInfo.todos = todos;
    }
    if (readyToStart !== undefined) {
      addInfo.openForInvestment = readyToStart;
    }
    else if (isSingleUser) {
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
        refreshInvestibles(investiblesDispatch, () => {}, [inv]);
        const { id: investibleId } = inv.investible;
        let link = formInvestibleLink(marketId, investibleId);
        // reset the editor box
        resetEditor(editorName);
        // update the form data with the saved investible
        updateFormData({
          investibleId,
          link
        });
        if (moveFromComments) {
          return moveFromComments(inv, formData, updateFormData).then(() => {
            if (readyToStart !== undefined || (isSingleUser && !useApprovals)) {
              return onFinish({
                link
              });
            }
            return {link, useApprovals};
          });
        }
        if (readyToStart !== undefined || (isSingleUser && !useApprovals)) {
          return onFinish({
            link
          });
        }
        return {link, useApprovals};
      })
  }

  function simulatePriority(key) {
    return () => {
      const target = {value: key};
      onChange({target});
    };
  }
  useHotkeys('ctrl+alt+1', simulatePriority('IMMEDIATE'), {enabled: showImmediate,
      enableOnContentEditable: true}, []);
  useHotkeys('ctrl+alt+2', simulatePriority('READY'), {enableOnContentEditable: true},
    []);
  useHotkeys('ctrl+alt+3', simulatePriority('NOT_READY'), {enableOnContentEditable: true},
    []);

  return (
    <WizardStepContainer
      {...props}
      isLarge
    >
      <Typography className={classes.introText}>
        How would you describe this job?
      </Typography>
      <Typography className={classes.introSubText} variant="subtitle1" style={{marginBottom: 0}}>
        Fill the description below and the job name will be created automatically. A bullet list will become tasks.
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
          {jobTypes.map(certainty => {
            return (
              <Tooltip title={<h3>
                {intl.formatMessage({ id: `certaintyTip${certainty}` })}
              </h3>} placement="top">
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
              </Tooltip>
            );
          })}
        </RadioGroup>
      </FormControl>
      {Editor}
      <div className={classes.borderBottom} />
      <WizardStepButtons
        {...props}
        validForm={hasValue}
        nextLabel='jobCreate'
        onNext={createJob}
        showOtherNext={isSingleUser && marketHasOthers}
        otherNextLabel='useApprovals'
        onOtherNext={() => createJob(true)}
        onIncrement={doIncrement}
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

export default JobDescriptionStep;