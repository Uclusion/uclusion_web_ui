import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { Box, Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext'
import WizardStepButtons from '../WizardStepButtons';
import CommentBox from '../../../containers/CommentBox/CommentBox'
import { addCommentToMarket, getCommentRoot } from '../../../contexts/CommentsContext/commentsContextHelper'
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext'
import { getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper'
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'
import { getMarketInfo } from '../../../utils/userFunctions'
import { getFullStage, getStageNameForId } from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import { useHistory } from 'react-router'
import { formCommentLink, navigate } from '../../../utils/marketIdPathFunctions';
import { resolveComment, updateComment } from '../../../api/comments'
import { QUESTION_TYPE, SUGGEST_CHANGE_TYPE, TODO_TYPE } from '../../../constants/comments';
import { getFormerStageId, handleAcceptSuggestion, isSingleAssisted } from '../../../utils/commentFunctions';
import { useIntl } from 'react-intl';
import JobDescription from '../JobDescription';
import { changePresence, getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import GravatarGroup from '../../Avatars/GravatarGroup';
import { pokeUsers } from '../../../api/users';
import Link from '@material-ui/core/Link';
import _ from 'lodash';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';


function DecideAssistanceStep(props) {
  const { marketId, commentId, formData, updateFormData } = props;
  const intl = useIntl();
  const [commentState] = useContext(CommentsContext);
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const [investibleState, investiblesDispatch] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const [marketPresencesState, marketPresencesDispatch] = useContext(MarketPresencesContext);
  const history = useHistory();
  const commentRoot = getCommentRoot(commentState, marketId, commentId) || {id: 'fake'};
  const comments = (commentState[marketId] || []).filter((comment) =>
    comment.root_comment_id === commentRoot.id || comment.id === commentRoot.id);
  const classes = wizardStyles();
  const inv = getInvestible(investibleState, commentRoot.investible_id) || {};
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const { stage, former_stage_id: formerStageId, assigned } = marketInfo;
  const fullStage = getFullStage(marketStagesState, marketId, stage);
  const nextStageId = getFormerStageId(formerStageId, marketId, marketStagesState);
  const nextStageName = getStageNameForId(marketStagesState, marketId, nextStageId, intl);
  const isSingle = isSingleAssisted(comments, assigned);
  const isSuggest = commentRoot.comment_type === SUGGEST_CHANGE_TYPE;
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
  const snoozed = marketPresences.filter((presence) => {
    const { deferred_notifications: deferred } = presence;
    return (deferred || []).includes(commentId);
  });
  const deferredUserIds = (snoozed || []).map((presence) => presence.id);
  const { useCompression } = formData;

  function myOnFinish() {
    navigate(history, formCommentLink(marketId, commentRoot.group_id, commentRoot.investible_id, commentRoot.id));
  }

  function accept() {
    return updateComment({marketId, commentId, commentType: TODO_TYPE}).then((comment) => {
      handleAcceptSuggestion({ isMove: isSingle, comment, investible: inv, investiblesDispatch,
        marketStagesState, commentsState, commentsDispatch, messagesState, messagesDispatch })
      setOperationRunning(false);
    })
  }

  function resolve() {
    return resolveComment(marketId, commentId)
      .then((comment) => {
        addCommentToMarket(comment, commentsState, commentsDispatch);
        setOperationRunning(false);
      });
  }

  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText}>
        Done with this
        {commentRoot.comment_type === QUESTION_TYPE ? ' question' : (isSuggest ? ' suggestion' : ' blocking issue')}?
      </Typography>
      {isSingle && (
        <Typography className={classes.introSubText} variant="subtitle1">
          Resolving moves this job to {nextStageName}.
        </Typography>
      )}
      <Typography className={classes.introSubText} variant="subtitle1">
        Poke to resend notifications and message <Link href="https://documentation.uclusion.com/notifications/slack/#adding-uclusion-to-a-slack-channel" target="_blank">configured channels</Link>.
      </Typography>
      {!_.isEmpty(snoozed) && (
        <Box sx={{ p: 2, border: '1px solid grey' }} style={{marginBottom: '1rem', paddingTop: 0, width: '50rem'}}>
          <Typography className={classes.introSubText} variant="subtitle1">
            Snoozed.
          </Typography>
          <GravatarGroup users={snoozed}/>
        </Box>
      )}
      {commentRoot.investible_id && (
        <JobDescription marketId={marketId} investibleId={commentRoot.investible_id} comments={comments}
                        removeActions
                        showVoting
                        useCompression={useCompression}
                        toggleCompression={() => updateFormData({useCompression: !useCompression})}
                        showDescription={false}
                        showAssigned={false} />
      )}
      {!commentRoot.investible_id && (
        <div className={classes.wizardCommentBoxDiv}>
          <CommentBox
            comments={comments}
            marketId={marketId}
            allowedTypes={[]}
            fullStage={fullStage}
            investible={inv}
            marketInfo={marketInfo}
            isInbox
            showVoting
            removeActions
          />
        </div>
      )}
      <WizardStepButtons
        {...props}
        finish={myOnFinish}
        nextLabel={isSuggest ? 'wizardAcceptLabel' : 'commentResolveLabel'}
        onNext={() => {
          if (isSuggest) {
            return accept();
          }
          resolve();
        }}
        showOtherNext={isSuggest}
        otherNextLabel="commentResolveLabel"
        onOtherNext={resolve}
        showTerminate
        terminateLabel="poke"
        terminateSpinOnClick
        onFinish={() => pokeUsers(marketId, commentId, deferredUserIds).then(() => {
          // quick remove the comment id on the deferred_notifications of the snoozed presences
          (snoozed || []).forEach((presence) => {
            const { deferred_notifications: deferred } = presence;
            const newDeferred = deferred.filter((id) => id !== commentId) || [];
            changePresence(presence, marketPresencesDispatch, marketId,
              { deferred_notifications: newDeferred });
          });
          setOperationRunning(false);
        })}
      />
    </WizardStepContainer>
  );
}

DecideAssistanceStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

DecideAssistanceStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default DecideAssistanceStep;