import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from './WizardStepContainer';
import { wizardStyles } from './WizardStylesContext';
import {
  getCommentRoot,
  getInvestibleComments
} from '../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext';
import { getInvestible } from '../../contexts/InvestibesContext/investiblesContextHelper';
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext';
import { getMarketInfo } from '../../utils/userFunctions';
import { getFullStage } from '../../contexts/MarketStagesContext/marketStagesContextHelper';
import { MarketStagesContext } from '../../contexts/MarketStagesContext/MarketStagesContext';
import { dismissWorkListItem } from '../../pages/Home/YourWork/WorkListItem';
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext';
import CommentBox from '../../containers/CommentBox/CommentBox';
import { useHistory } from 'react-router';

function ReplyStep(props) {
  const { marketId, commentId, message } = props;
  const history = useHistory();
  const [commentState] = useContext(CommentsContext);
  const [investibleState] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [, messagesDispatch] = useContext(NotificationsContext);
  const commentRoot = getCommentRoot(commentState, marketId, commentId) || {id: 'fake'};
  const classes = wizardStyles();
  const inv = commentRoot.investible_id ? getInvestible(investibleState, commentRoot.investible_id) : undefined;
  const investibleComments = getInvestibleComments(inv?.investible?.id, marketId, commentState);
  const comments = investibleComments.filter((comment) => comment.root_comment_id === commentRoot?.id
    || comment.id === commentRoot?.id);
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const { stage } = marketInfo;
  const fullStage = getFullStage(marketStagesState, marketId, stage) || {};

  function myTerminate() {
    dismissWorkListItem(message, messagesDispatch, history);
  }

  return (
    <WizardStepContainer
      {...props}
    >
    <div>
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
        wizardProps={{...props, isReply: true, onSave: myTerminate}}
      />
    </div>
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