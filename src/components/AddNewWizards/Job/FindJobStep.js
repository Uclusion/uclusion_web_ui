import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import {
  formCommentLink,
  formMarketAddInvestibleLink,
  navigate
} from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import { refreshMarketComments } from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import _ from 'lodash';
import { moveComments } from '../../../api/comments';
import { removeMessagesForCommentId } from '../../../utils/messageUtils';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import ChooseJob from '../../Search/ChooseJob';
import {
  getStages,
  isNotDoingStage,
  isVerifiedStage
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';

function FindJobStep(props) {
  const { marketId, groupId, updateFormData, formData, marketComments, startOver, clearFormData, roots } = props;
  const history = useHistory();
  const classes = useContext(WizardStylesContext);
  const [, commentsDispatch] = useContext(CommentsContext);
  const [messagesState] = useContext(NotificationsContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const { investibleId } = formData;
  const currentInvestibleId = roots[0].investible_id;
  const marketStages = getStages(marketStagesState, marketId);
  const activeMarketStages = marketStages.filter((stage) => {
    return !isVerifiedStage(stage) && !isNotDoingStage(stage);
  });

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

  function onNext() {
    const fromCommentIds = roots.map((comment) => comment.id);
    const link = formCommentLink(marketId, groupId, investibleId, fromCommentIds[0]);
    return moveComments(marketId, investibleId, fromCommentIds)
      .then((movedComments) => {
        let threads = []
        fromCommentIds.forEach((commentId) => {
          removeMessagesForCommentId(commentId, messagesState);
          const thread = marketComments.filter((aComment) => {
            return aComment.root_comment_id === commentId;
          });
          const fixedThread = thread.map((aComment) => {
            return {investible_id: investibleId, ...aComment};
          });
          threads = threads.concat(fixedThread);
        });
        refreshMarketComments(commentsDispatch, marketId,
          [...movedComments, ...threads, ...marketComments]);
        clearFormData();
        navigate(history, link);
      });
  }

  return (
    <WizardStepContainer
      {...props}
      isLarge
    >
      <div>
        <Typography className={classes.introText} variant="h6">
          Which active job in this group?
        </Typography>
        <ChooseJob
          marketId={marketId}
          groupId={groupId}
          formData={formData}
          marketStages={activeMarketStages}
          excluded={currentInvestibleId ? [currentInvestibleId] : undefined}
          onChange={(id) => {
            console.debug(`updating to ${id}`)
            updateFormData({ investibleId: id })
          }}
        />
        <div className={classes.borderBottom}/>
        <WizardStepButtons
          {...props}
          validForm={!_.isEmpty(investibleId)}
          showTerminate={true}
          onNext={onNext}
          onTerminate={onTerminate}
          terminateLabel="JobWizardStartOver"
          nextLabel="storyFromComment"
        />
      </div>
    </WizardStepContainer>
  )
}

FindJobStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
}

FindJobStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
}

export default FindJobStep