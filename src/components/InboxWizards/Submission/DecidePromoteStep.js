import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import CommentBox from '../../../containers/CommentBox/CommentBox';
import { getCommentRoot } from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { removeWorkListItem, workListStyles } from '../../../pages/Home/YourWork/WorkListItem';
import { useIntl } from 'react-intl';
import { formInvestibleAddCommentLink, navigate } from '../../../utils/marketIdPathFunctions';
import { DECISION_COMMENT_WIZARD_TYPE } from '../../../constants/markets';
import { useHistory } from 'react-router';
import { moveInvestibleToCurrentVoting } from '../../../api/investibles';
import { refreshInvestibles } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import {
  getInCurrentVotingStage,
  getProposedOptionsStage
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import JobDescription from '../JobDescription';

function DecidePromoteStep(props) {
  const { marketId, commentId, investibleId, commentMarketId, message } = props;
  const history = useHistory();
  const [commentState] = useContext(CommentsContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [, messagesDispatch] = useContext(NotificationsContext);
  const [, invDispatch] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [selectedInvestibleId, setSelectedInvestibleId] = useState(investibleId);
  const inCurrentVotingStage = getInCurrentVotingStage(marketStagesState, marketId);
  const proposedStage = getProposedOptionsStage(marketStagesState, marketId);
  const commentRoot = getCommentRoot(commentState, commentMarketId, commentId) || {id: 'fake'};
  const comments = (commentState[commentMarketId] || []).filter((comment) =>
    comment.root_comment_id === commentRoot.id || comment.id === commentRoot.id);
  const classes = wizardStyles();
  const intl = useIntl();
  const workItemClasses = workListStyles();

  function myOnFinish() {
    removeWorkListItem(message, workItemClasses.removed, messagesDispatch);
  }

  function promote() {
    const moveInfo = {
      marketId,
      investibleId: selectedInvestibleId || investibleId,
      stageInfo: {
        current_stage_id: proposedStage.id,
        stage_id: inCurrentVotingStage.id,
      },
    };
    return moveInvestibleToCurrentVoting(moveInfo)
      .then((inv) => {
        setOperationRunning(false);
        refreshInvestibles(invDispatch, () => {}, [inv]);
        myOnFinish();
      });
  }

  return (
    <WizardStepContainer
      {...props}
    >
    <div>
      <Typography className={classes.introText}>
        {intl.formatMessage({id: 'DecidePromotionTitle'})}
      </Typography>
      {commentRoot.investible_id && (
        <JobDescription marketId={marketId} investibleId={commentRoot.investible_id} comments={comments}
                        removeActions
                        showVoting
                        showDescription={false}
                        showAssigned={false}
                        selectedInvestibleIdParent={selectedInvestibleId}
                        setSelectedInvestibleIdParent={setSelectedInvestibleId} />
      )}
      {!commentRoot.investible_id && (
        <div className={classes.wizardCommentBoxDiv}>
          <CommentBox
            comments={comments}
            marketId={marketId}
            allowedTypes={[]}
            isInbox
            removeActions
            showVoting
            selectedInvestibleIdParent={selectedInvestibleId}
            setSelectedInvestibleIdParent={setSelectedInvestibleId}
          />
        </div>
      )}
      <WizardStepButtons
        {...props}
        nextLabel="promoteOption"
        onNext={promote}
        showOtherNext
        otherNextLabel="createComment"
        otherSpinOnClick={false}
        onOtherNext={() => navigate(history,
          formInvestibleAddCommentLink(DECISION_COMMENT_WIZARD_TYPE, investibleId))}
        showTerminate
        terminateLabel={message.type_object_id.startsWith('UNREAD') ? 'notificationDelete' : 'defer'}
        onTerminate={myOnFinish}
      />
    </div>
    </WizardStepContainer>
  );
}

DecidePromoteStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

DecidePromoteStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default DecidePromoteStep;