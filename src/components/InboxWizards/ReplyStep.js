import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from './WizardStepContainer';
import { wizardStyles } from './WizardStylesContext';
import { getComment, getCommentRoot } from '../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext';
import { getInvestible } from '../../contexts/InvestibesContext/investiblesContextHelper';
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext';
import { getMarketInfo } from '../../utils/userFunctions';
import { getFullStage } from '../../contexts/MarketStagesContext/marketStagesContextHelper';
import { MarketStagesContext } from '../../contexts/MarketStagesContext/MarketStagesContext';
import { removeWorkListItem, workListStyles } from '../../pages/Home/YourWork/WorkListItem';
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext';
import CommentBox from '../../containers/CommentBox/CommentBox';

function ReplyStep(props) {
  const { marketId, commentId, message } = props;
  const [commentState] = useContext(CommentsContext);
  const [investibleState] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [, messagesDispatch] = useContext(NotificationsContext);
  const commentRoot = getCommentRoot(commentState, marketId, commentId) || {id: 'fake'};
  const comment = getComment(commentState, marketId, commentId) || {};
  const classes = wizardStyles();
  const workItemClasses = workListStyles();
  const inv = commentRoot.investible_id ? getInvestible(investibleState, commentRoot.investible_id) : undefined;
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const { stage } = marketInfo;
  const fullStage = getFullStage(marketStagesState, marketId, stage) || {};

  function myTerminate() {
    removeWorkListItem(message, workItemClasses.removed, messagesDispatch);
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
        comments={[comment]}
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