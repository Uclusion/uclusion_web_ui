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
import { formInvestibleLink, formMarketLink, navigate } from '../../../utils/marketIdPathFunctions';
import { processTextAndFilesForSave } from '../../../api/files';
import { refreshInvestibles } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { FormattedMessage } from 'react-intl';
import { bugRadioStyles } from '../Bug/BugDescriptionStep';
import { useHistory } from 'react-router';
import { moveCommentsFromIds } from './DecideWhereStep';
import { getCommentThreads } from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';

function JobDescriptionStep (props) {
  const { marketId, groupId, updateFormData, onFinish, fromCommentIds, marketComments, formData, jobType } = props;
  const history = useHistory();
  const [, commentsDispatch] = useContext(CommentsContext);
  const [messagesState] = useContext(NotificationsContext);
  const radioClasses = bugRadioStyles();
  const roots = (fromCommentIds || []).map((fromCommentId) =>
    marketComments.find((comment) => comment.id === fromCommentId) || {id: 'notFound'});
  const comments = getCommentThreads(roots, marketComments);
  const isSingleComment = _.size(fromCommentIds) === 1;
  const editorName = isSingleComment ? `addJobWizardF${fromCommentIds[0]}` : `addJobWizard${groupId}`;
  if (isSingleComment && _.isEmpty(getQuillStoredState(editorName))) {
    const fromComment = marketComments.find((comment) => comment.id === fromCommentIds[0]);
    const { body, ticket_code: ticketCode } = fromComment || {};
    // No need to clip to 80 here as that will happen when save
    const { name } = convertDescription(body, 200);
    if (!_.isEmpty(name)) {
      storeState(editorName,
        `<p>${name} From <a href="${window.location.protocol}//${window.location.host}/${marketId}/${ticketCode}">${ticketCode}</a>.</p>`);
    }
  }
  const [hasValue, setHasValue] = useState(!editorEmpty(getQuillStoredState(editorName)));
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const classes = useContext(WizardStylesContext);

  const editorSpec = {
    placeholder: "Ex: make magic happen via A, B, C",
    value: getQuillStoredState(editorName),
    marketId,
    onUpload: setUploadedFiles,
    onChange: () => setHasValue(true),
  };

  const [Editor] = useEditor(editorName, editorSpec);

  const { newQuantity } = formData;

  function createJob(readyToStart) {
    const {
      uploadedFiles: filteredUploads,
      text: tokensRemoved,
    } = processTextAndFilesForSave(uploadedFiles, getQuillStoredState(editorName));
    const { name, description} = convertDescription(tokensRemoved);
    const addInfo = {
      name,
      description,
      groupId,
      marketId,
      uploadedFiles: filteredUploads
    }
    if (readyToStart !== undefined) {
      addInfo.openForInvestment = readyToStart;
    }
    return addPlanningInvestible(addInfo)
      .then((inv) => {
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
        if (fromCommentIds) {
          return moveCommentsFromIds(inv, comments, fromCommentIds, marketId, groupId, messagesState, updateFormData,
            commentsDispatch)
        }
        return {link};
      })
  }

  function onNotReady(formData){
     createJob()
      .then(({link}) => {
        onFinish({
          ...formData,
          link
        });
      });
  }

  function onChange(event) {
    updateFormData({
      newQuantity: event.target.value
    });
  }

  const defaultFromPage = jobType === undefined ? 'IMMEDIATE' : (jobType === '0' ? 'READY' : 'NOT_READY');
  const currentValue = newQuantity || defaultFromPage || '';
  const onNext = currentValue === 'NOT_READY' ? onNotReady : (currentValue === 'READY' ?
    () => createJob(true).then(({link}) => {
    onFinish({
      ...formData,
      link
    });
  }) : createJob);
  return (
    <WizardStepContainer
      {...props}
      isLarge
    >
      <Typography className={classes.introText}>
        How would you describe this job?
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
        nextLabel="jobCreate"
        onNext={onNext}
        onNextDoAdvance={currentValue === 'IMMEDIATE'}
        showTerminate
        onTerminate={() => navigate(history, formMarketLink(marketId, groupId))}
        terminateLabel="JobWizardGotoJob"
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