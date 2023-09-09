import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { Typography } from '@material-ui/core'
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import CommentBox from '../../../containers/CommentBox/CommentBox'
import {
  addCommentToMarket
} from '../../../contexts/CommentsContext/commentsContextHelper'
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext'
import {
  getInvestible
} from '../../../contexts/InvestibesContext/investiblesContextHelper'
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'
import { getMarketInfo } from '../../../utils/userFunctions'
import { getFullStage } from '../../../contexts/MarketStagesContext/marketStagesContextHelper'
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext'
import { resolveComment } from '../../../api/comments'
import { SUGGEST_CHANGE_TYPE } from '../../../constants/comments'
import { removeMessagesForCommentId } from '../../../utils/messageUtils'
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext'


function DecideResolveStep(props) {
  const { marketId, commentId, marketComments, setResolvedId } = props;
  const [commentState, commentDispatch] = useContext(CommentsContext);
  const [investibleState] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [messagesState] = useContext(NotificationsContext);
  const comment = (marketComments || []).find((comment) => comment.id === commentId) || {id: 'fake'};
  const classes = useContext(WizardStylesContext);
  const inv = comment.investible_id ? getInvestible(investibleState, comment.investible_id) : undefined;
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const { stage } = marketInfo;
  const fullStage = getFullStage(marketStagesState, marketId, stage) || {};
  const isSuggestion = comment.comment_type === SUGGEST_CHANGE_TYPE;

  function resolve() {
    return resolveComment(marketId, commentId)
      .then((comment) => {
        addCommentToMarket(comment, commentState, commentDispatch);
        removeMessagesForCommentId(commentId, messagesState);
        setResolvedId(commentId);
      });
  }

  if (comment.id === 'fake') {
    return React.Fragment;
  }

  return (
    <WizardStepContainer
      {...props}
      isLarge
    >
      <Typography className={classes.introText}>
        Will you resolve this {isSuggestion ? 'suggestion' : 'question'}?
      </Typography>
      <div className={classes.wizardCommentBoxDiv}>
        <CommentBox
          comments={[comment]}
          marketId={marketId}
          allowedTypes={[]}
          fullStage={fullStage}
          investible={inv}
          marketInfo={marketInfo}
          isInbox
          removeActions
          showVoting
        />
      </div>
      <WizardStepButtons
        {...props}
        nextLabel="commentResolveLabel"
        onNext={resolve}
        isFinal={false}
        showSkip
      />
    </WizardStepContainer>
  );
}

DecideResolveStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

DecideResolveStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default DecideResolveStep;