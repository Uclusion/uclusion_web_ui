import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types'
import { Typography } from '@material-ui/core'
import _ from 'lodash'
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import { editorEmpty, getQuillStoredState, resetEditor, storeState } from '../../TextEditors/Utilities/CoreUtils'
import { useEditor } from '../../TextEditors/quillHooks'
import { convertDescription, nameFromDescription } from '../../../utils/stringFunctions'
import { addPlanningInvestible } from '../../../api/investibles'
import { formCommentLink, formInvestibleLink } from '../../../utils/marketIdPathFunctions';
import { processTextAndFilesForSave } from '../../../api/files'
import { refreshInvestibles } from '../../../contexts/InvestibesContext/investiblesContextHelper'
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'
import { getCommentThreads, refreshMarketComments } from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext'
import { moveComments } from '../../../api/comments'
import { removeMessagesForCommentId } from '../../../utils/messageUtils'
import CommentBox from '../../../containers/CommentBox/CommentBox'
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext'
import FindJobStep from './FindJobStep';


function JobDescriptionStep (props) {
  const { marketId, groupId, updateFormData, onFinish, fromCommentIds, marketComments, formData,
    startOver, clearFormData } = props;
  const isSingleComment = _.size(fromCommentIds) === 1;
  const editorName = isSingleComment ? `addJobWizard${fromCommentIds[0]}` : `addJobWizard${groupId}`;
  if (isSingleComment && _.isEmpty(getQuillStoredState(editorName))) {
    const fromComment = marketComments.find((comment) => comment.id === fromCommentIds[0]);
    const { body } = fromComment || {};
    const name = nameFromDescription(body);
    if (!_.isEmpty(name)) {
      storeState(editorName,`<p>${name}</p>`);
    }
  }
  const [hasValue, setHasValue] = useState(!editorEmpty(getQuillStoredState(editorName)));
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [, commentsDispatch] = useContext(CommentsContext);
  const [messagesState] = useContext(NotificationsContext);
  const classes = useContext(WizardStylesContext);
  const roots = (fromCommentIds || []).map((fromCommentId) =>
    marketComments.find((comment) => comment.id === fromCommentId) || {id: 'notFound'});
  const comments = getCommentThreads(roots, marketComments);

  const editorSpec = {
    placeholder: "Ex: make magic happen via A, B, C",
    value: getQuillStoredState(editorName),
    marketId,
    onUpload: setUploadedFiles,
    onChange: () => setHasValue(true),
  };

  const [Editor] = useEditor(editorName, editorSpec);

  if (comments.find((comment) => comment.id === 'notFound')) {
    return React.Fragment;
  }

  const { isMoveExisting } = formData;

  if (isMoveExisting && !_.isEmpty(comments)) {
    return <FindJobStep marketId={marketId} groupId={groupId} roots={roots} marketComments={marketComments}
      updateFormData={updateFormData} formData={formData} startOver={startOver} clearFormData={clearFormData}/>;
  }

  function createJob() {
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
    return addPlanningInvestible(addInfo)
      .then((inv) => {
        refreshInvestibles(investiblesDispatch, () => {}, [inv]);
        const { id: investibleId } = inv.investible;
        // reset the editor box
        let link = formInvestibleLink(marketId, investibleId);
        resetEditor(editorName);
        // update the form data with the saved investible
        updateFormData({
          investibleId,
          link,
        });
        if (fromCommentIds) {
          const { investible } = inv;
          return moveComments(marketId, investible.id, fromCommentIds)
            .then((movedComments) => {
              let threads = []
              fromCommentIds.forEach((commentId) => {
                removeMessagesForCommentId(commentId, messagesState);
                const thread = comments.filter((aComment) => {
                  return aComment.root_comment_id === commentId;
                });
                const fixedThread = thread.map((aComment) => {
                  return {investible_id: investible.id, ...aComment};
                });
                threads = threads.concat(fixedThread);
              });
              refreshMarketComments(commentsDispatch, marketId,
                [...movedComments, ...threads, ...marketComments]);
              link = formCommentLink(marketId, groupId, investibleId, fromCommentIds[0]);
              updateFormData({
                investibleId,
                link,
              });
              return {link};
            });
        }
        return {link};
      })
  }

  function myOnFinish(formData){
     createJob()
      .then(({link}) => {
        onFinish({
          ...formData,
          link
        });
      });
  }

  return (
    <WizardStepContainer
      {...props}
      isLarge
    >
    <div>
      <Typography className={classes.introText}>
        What has to be done?
      </Typography>
      <div style={{maxHeight: '300px', overflowY: 'auto', overflowX: 'hidden'}}>
        {Editor}
        <div className={classes.wizardCommentBoxDiv}>
          <CommentBox
            comments={comments}
            marketId={marketId}
            allowedTypes={[]}
            isInbox
            removeActions
          />
        </div>
      </div>
      <div className={classes.borderBottom} />
      <WizardStepButtons
        {...props}
        validForm={hasValue}
        nextLabel="JobWizardAssignJob"
        onNext={createJob}
        onTerminate={myOnFinish}
        showTerminate={hasValue}
        terminateLabel="JobWizardGotoJob"/>
    </div>
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