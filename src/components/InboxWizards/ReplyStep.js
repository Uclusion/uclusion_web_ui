import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from './WizardStepContainer';
import { wizardStyles } from './WizardStylesContext';
import {
  addCommentToMarket, getComment,
  getCommentRoot,
  getInvestibleComments
} from '../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext';
import { addInvestible, getInvestible } from '../../contexts/InvestibesContext/investiblesContextHelper';
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext';
import { getMarketInfo } from '../../utils/userFunctions';
import { getFullStage, isRequiredInputStage } from '../../contexts/MarketStagesContext/marketStagesContextHelper';
import { MarketStagesContext } from '../../contexts/MarketStagesContext/MarketStagesContext';
import { dismissWorkListItem } from '../../pages/Home/YourWork/WorkListItem';
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext';
import CommentBox from '../../containers/CommentBox/CommentBox';
import { useHistory } from 'react-router';
import { resolveComment } from '../../api/comments';
import { removeInlineMarketMessages } from '../../utils/messageUtils';
import { isSingleAssisted } from '../../utils/commentFunctions';
import _ from 'lodash';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext';

function ReplyStep(props) {
  const { marketId, commentId, message } = props;
  const history = useHistory();
  const [commentState, commentDispatch] = useContext(CommentsContext);
  const [investibleState, investiblesDispatch] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const classes = wizardStyles();
  const comment = getComment(commentState, marketId, commentId);
  const inv = comment.investible_id ? getInvestible(investibleState, comment.investible_id) : undefined;
  const investibleComments = getInvestibleComments(inv?.investible?.id, marketId, commentState);
  const comments = [comment];
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const { stage, former_stage_id: formerStageId, assigned } = marketInfo;
  const fullStage = getFullStage(marketStagesState, marketId, stage) || {};

  function myTerminate() {
    dismissWorkListItem(message, messagesDispatch, history);
  }

  function resolve() {
    const commentRoot = getCommentRoot(commentState, marketId, commentId);
    return resolveComment(marketId, commentRoot.id)
      .then((comment) => {
        addCommentToMarket(comment, commentState, commentDispatch);
        const inlineMarketId = comment.inline_market_id;
        if (inlineMarketId) {
          removeInlineMarketMessages(inlineMarketId, investibleState, commentState, messagesState, messagesDispatch);
        }
        if (formerStageId && fullStage && isRequiredInputStage(fullStage) &&
          isSingleAssisted(investibleComments, assigned)) {
          const newInfo = {
            ...marketInfo,
            stage: formerStageId,
            last_stage_change_date: comment.updated_at,
          };
          const newInfos = _.unionBy([newInfo], inv.market_infos, 'id');
          const newInvestible = {
            investible: inv.investible,
            market_infos: newInfos
          };
          addInvestible(investiblesDispatch, () => {}, newInvestible);
        }
        setOperationRunning(false);
        dismissWorkListItem(message, messagesDispatch, history);
      });
  }

  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText}>
        What is your reply?
      </Typography>
      <CommentBox
        comments={comments}
        marketId={marketId}
        allowedTypes={[]}
        fullStage={fullStage}
        investible={inv}
        marketInfo={marketInfo}
        isInbox
        removeActions
        replyEditId={commentId}
        isReply
        displayRepliesAsTop
        wizardProps={{...props, isReply: true, onSave: myTerminate, onResolve: resolve}}
      />
    </WizardStepContainer>
  );
}

ReplyStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

ReplyStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default ReplyStep;