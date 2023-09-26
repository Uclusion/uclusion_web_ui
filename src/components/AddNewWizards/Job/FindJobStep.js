import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import { formCommentLink, formMarketAddInvestibleLink, navigate } from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import { getCommentThreads } from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import _ from 'lodash';
import { moveComments } from '../../../api/comments';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import ChooseJob from '../../Search/ChooseJob';
import {
  getStages,
  isInReviewStage,
  isNotDoingStage
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { getGroup } from '../../../contexts/MarketGroupsContext/marketGroupsContextHelper';
import { MarketGroupsContext } from '../../../contexts/MarketGroupsContext/MarketGroupsContext';
import { onCommentsMove } from '../../../utils/commentFunctions';

function FindJobStep(props) {
  const { marketId, groupId, updateFormData, formData, marketComments, startOver, clearFormData,
    fromCommentIds } = props;
  const history = useHistory();
  const classes = useContext(WizardStylesContext);
  const [, commentsDispatch] = useContext(CommentsContext);
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [groupState] = useContext(MarketGroupsContext);
  const { investibleId } = formData;
  const group = getGroup(groupState, marketId, groupId) || {};
  const marketStages = getStages(marketStagesState, marketId);
  const activeMarketStages = marketStages.filter((stage) => {
    return !isInReviewStage(stage) && !isNotDoingStage(stage);
  });
  const roots = (fromCommentIds || []).map((fromCommentId) =>
    marketComments.find((comment) => comment.id === fromCommentId) || {id: 'notFound'});
  const comments = getCommentThreads(roots, marketComments);
  const currentInvestibleId = roots[0].investible_id;

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
        onCommentsMove(fromCommentIds, messagesState, marketComments, investibleId, commentsDispatch, marketId,
          movedComments, messagesDispatch);
        clearFormData();
        navigate(history, link);
      });
  }

  if (comments.find((comment) => comment.id === 'notFound')) {
    return React.Fragment;
  }

  return (
    <WizardStepContainer
      {...props}
      isLarge
    >
        <Typography className={classes.introText} variant="h6">
          Which active job in group {group.name}?
        </Typography>
        <ChooseJob
          marketId={marketId}
          groupId={groupId}
          formData={formData}
          marketStages={activeMarketStages}
          excluded={currentInvestibleId ? [currentInvestibleId] : undefined}
          onChange={(id) => {
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