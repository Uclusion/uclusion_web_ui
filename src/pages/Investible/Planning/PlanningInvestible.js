import React, { useContext, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { Paper, Typography } from '@material-ui/core';
import { useHistory } from 'react-router';
import { useIntl } from 'react-intl';
import SubSection from '../../../containers/SubSection/SubSection';
import YourVoting from '../Voting/YourVoting';
import Voting from '../Decision/Voting';
import ReadOnlyQuillEditor from '../../../components/TextEditors/ReadOnlyQuillEditor';
import CommentBox from '../../../containers/CommentBox/CommentBox';
import {
  ISSUE_TYPE, JUSTIFY_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE,
} from '../../../constants/comments';
import DisplayAssignments from './Assignments/DisplayAssignments';
import { formMarketLink, makeBreadCrumbs } from '../../../utils/marketIdPathFunctions';
import Screen from '../../../containers/Screen/Screen';
import RaiseIssue from '../../../components/SidebarActions/RaiseIssue';
import AskQuestions from '../../../components/SidebarActions/AskQuestion';
import SuggestChanges from '../../../components/SidebarActions/SuggestChanges';
import CommentAddBox from '../../../containers/CommentBox/CommentAddBox';
import MoveToNextVisibleStageActionButton from './MoveToNextVisibleStageActionButton';
import { getMarketInfo } from '../../../utils/userFunctions';
import {
  getAcceptedStage,
  getBlockedStage,
  getInCurrentVotingStage,
  getInReviewStage, getVerifiedStage,
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import MoveToVerifiedActionButton from './MoveToVerifiedActionButton';
import MoveToVotingActionButton from './MoveToVotingActionButton';
import MoveToNotDoingActionButton from './MoveToNotDoingActionButton';
import { scrollToCommentAddBox } from '../../../components/Comments/commentFunctions';
import MoveToAcceptedActionButton from './MoveToAcceptedActionButton';
import MoveToInReviewActionButton from './MoveToInReviewActionButton';
import PlanningInvestibleEditActionButton from './PlanningInvestibleEditActionButton';
import ExpiresDisplay from '../../../components/Expiration/ExpiresDisplay';
import { convertDates } from '../../../contexts/ContextUtils';
import { ACTIVE_STAGE } from '../../../constants/markets';
import { SECTION_TYPE_SECONDARY } from '../../../constants/global';
import { getDiff } from '../../../contexts/DiffContext/diffContextHelper';
import { DiffContext } from '../../../contexts/DiffContext/DiffContext';
import DiffDisplay from '../../../components/TextEditors/DiffDisplay';

/**
 * A page that represents what the investible looks like for a DECISION Dialog
 * @param props
 * @constructor
 */
function PlanningInvestible(props) {
  const history = useHistory();
  const intl = useIntl();
  const {
    investibleId,
    marketPresences,
    investibleComments,
    userId,
    market,
    marketInvestible,
    investibles,
    toggleEdit,
    isAdmin,
    hidden,
  } = props;
  const {
    name: marketName,
    id: marketId,
    investment_expiration: expirationDays,
    market_stage: marketStage,
  } = market;
  const activeMarket = marketStage === ACTIVE_STAGE;
  const breadCrumbTemplates = [{ name: marketName, link: formMarketLink(marketId) }];
  const breadCrumbs = makeBreadCrumbs(history, breadCrumbTemplates, true);
  const investmentReasonsRemoved = investibleComments.filter((comment) => comment.comment_type !== JUSTIFY_TYPE);
  const investmentReasons = investibleComments.filter((comment) => comment.comment_type === JUSTIFY_TYPE);
  const [commentAddType, setCommentAddType] = useState(ISSUE_TYPE);
  const [commentAddHidden, setCommentAddHidden] = useState(true);
  const marketInfo = getMarketInfo(marketInvestible, marketId);
  const { stage, assigned } = marketInfo;
  const { investible } = marketInvestible;
  const { description, name, locked_by: lockedBy } = investible;
  let lockedByName;
  if (lockedBy) {
    const lockedByPresence = marketPresences.find((presence) => presence.id === lockedBy);
    if (lockedByPresence) {
      const { name } = lockedByPresence;
      lockedByName = name;
    }
  }
  const commentAddRef = useRef(null);
  const [marketStagesState] = useContext(MarketStagesContext);
  const inReviewStage = getInReviewStage(marketStagesState, marketId);
  const isInReview = inReviewStage && stage === inReviewStage.id;
  const inAcceptedStage = getAcceptedStage(marketStagesState, marketId);
  const isInAccepted = inAcceptedStage && stage === inAcceptedStage.id;
  const inBlockedStage = getBlockedStage(marketStagesState, marketId);
  const isInBlocked = inBlockedStage && stage === inBlockedStage.id;
  const inVerifiedStage = getVerifiedStage(marketStagesState, marketId);
  const isInVerified = inVerifiedStage && stage === inVerifiedStage.id;
  const inCurrentVotingStage = getInCurrentVotingStage(marketStagesState, marketId);
  const isInVoting = inCurrentVotingStage && stage === inCurrentVotingStage.id;
  const allowedCommentTypes = [ISSUE_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE];
  // eslint-disable-next-line no-nested-ternary
  const stageName = isInVoting ? intl.formatMessage({ id: 'planningVotingStageLabel' })
    // eslint-disable-next-line no-nested-ternary
    : isInReview ? intl.formatMessage({ id: 'planningReviewStageLabel' })
      // eslint-disable-next-line no-nested-ternary
      : isInAccepted ? intl.formatMessage({ id: 'planningAcceptedStageLabel' })
        // eslint-disable-next-line no-nested-ternary
        : isInBlocked ? intl.formatMessage({ id: 'planningBlockedStageLabel' })
          : isInVerified ? intl.formatMessage({ id: 'planningVerifiedStageLabel' })
            : intl.formatMessage({ id: 'planningNotDoingStageLabel' });

  function getNewestVote() {
    let latest;
    marketPresences.forEach((presence) => {
      const { investments } = presence;
      investments.forEach((investment) => {
        const { updated_at: updatedAt, investible_id: invId } = convertDates(investment);
        if (investibleId === invId && (!latest || updatedAt > latest)) {
          latest = updatedAt;
        }
      });
    });
    return latest;
  }

  function commentButtonOnClick(type) {
    setCommentAddType(type);
    setCommentAddHidden(false);
    scrollToCommentAddBox(commentAddRef);
  }

  function closeCommentAdd() {
    setCommentAddHidden(true);
  }

  const [diffState] = useContext(DiffContext);
  const diff = getDiff(diffState, investibleId);

  if (!investibleId) {
    // we have no usable data;
    return <></>;
  }
  const invested = marketPresences.filter((presence) => {
    const { investments } = presence;
    if (!Array.isArray(investments) || investments.length === 0) {
      return false;
    }
    let found = false;
    investments.forEach((investment) => {
      const { investible_id: invId } = investment;
      if (invId === investibleId) {
        found = true;
      }
    });
    return found;
  });

  function assignedInStage(investibles, userId, stageId) {
    return investibles.filter((investible) => {
      const { market_infos: marketInfos } = investible;
      // console.log(`Investible id is ${id}`);
      const marketInfo = marketInfos.find((info) => info.market_id === marketId);
      // eslint-disable-next-line max-len
      return marketInfo.stage === stageId && marketInfo.assigned && marketInfo.assigned.includes(userId);
    });
  }

  function getSidebarActions() {
    if (!activeMarket) {
      return [];
    }
    const sidebarActions = [];

    if (isAdmin) {
      sidebarActions.push(<PlanningInvestibleEditActionButton
        marketId={marketId}
        key="edit"
        onClick={toggleEdit}
      />);
    }
    // you can only move stages besides not doing or verfied if you're assigned to it
    if (assigned && assigned.includes(userId)) {
      if (isInVoting || isInAccepted) {
        const nextStageId = isInVoting ? inAcceptedStage.id : inReviewStage.id;
        const assignedInNextStage = assignedInStage(investibles, userId, nextStageId);
        if (!_.isEmpty(invested) && (_.isEmpty(assignedInNextStage) || isInAccepted)) {
          sidebarActions.push(<MoveToNextVisibleStageActionButton
            key="visible"
            investibleId={investibleId}
            marketId={marketId}
            stageId={stage}
          />);
        }
      }
      if (isInBlocked) {
        // eslint-disable-next-line max-len
        const blockingComments = investibleComments.filter((comment) => comment.comment_type === ISSUE_TYPE && !comment.resolved);
        if (_.isEmpty(blockingComments)) {
          // eslint-disable-next-line max-len
          const assignedInVotingStage = assignedInStage(investibles, userId, inCurrentVotingStage.id);
          if (_.isEmpty(assignedInVotingStage)) {
            sidebarActions.push(<MoveToVotingActionButton
              investibleId={investibleId}
              marketId={marketId}
              stageId={stage}
              key="voting"
            />);
          }
          if (!_.isEmpty(invested)) {
            // eslint-disable-next-line max-len
            const assignedInAcceptedStage = assignedInStage(investibles, userId, inAcceptedStage.id);
            if (_.isEmpty(assignedInAcceptedStage)) {
              sidebarActions.push(<MoveToAcceptedActionButton
                investibleId={investibleId}
                marketId={marketId}
                stageId={stage}
                key="accepted"
              />);
            }
            sidebarActions.push(<MoveToInReviewActionButton
              investibleId={investibleId}
              marketId={marketId}
              stageId={stage}
              key="inreview"
            />);
          }
        }
      }
    }
    if (!isInVerified) {
      sidebarActions.push(<MoveToVerifiedActionButton
        investibleId={investibleId}
        marketId={marketId}
        stageId={stage}
        key="verified"
      />);
      sidebarActions.push(<MoveToNotDoingActionButton
        investibleId={investibleId}
        marketId={marketId}
        stageId={stage}
        key="notdoing"
      />);
    }
    sidebarActions.push(<RaiseIssue key="issue" onClick={commentButtonOnClick}/>);
    sidebarActions.push(<AskQuestions key="question" onClick={commentButtonOnClick}/>);
    sidebarActions.push(<SuggestChanges key="suggest" onClick={commentButtonOnClick}/>);
    return sidebarActions;
  }

  const discussionVisible = !commentAddHidden || !_.isEmpty(investmentReasonsRemoved);
  const newestVote = getNewestVote();

  return (
    <Screen
      title={name}
      tabTitle={name}
      breadCrumbs={breadCrumbs}
      hidden={hidden}
      sidebarActions={getSidebarActions()}
    >
      <Typography>
        {stageName}
      </Typography>
      {newestVote && isInVoting && (
        <ExpiresDisplay
          createdAt={newestVote}
          expirationMinutes={expirationDays * 1440}
        />
      )}
      {lockedBy && (
        <Typography>
          {intl.formatMessage({ id: 'lockedBy' }, { x: lockedByName })}
        </Typography>
      )}
      {(!assigned || !assigned.includes(userId)) && isInVoting && (
        <SubSection
          type={SECTION_TYPE_SECONDARY}
          title={intl.formatMessage({ id: 'decisionInvestibleYourVoting' })}
        >
          <YourVoting
            investibleId={investibleId}
            marketPresences={marketPresences}
            comments={investmentReasons}
            userId={userId}
            market={market}
            showBudget
          />
        </SubSection>
      )}
      <SubSection
        type={SECTION_TYPE_SECONDARY}
        title={intl.formatMessage({ id: 'decisionInvestibleOthersVoting' })}
      >
        <Voting
          investibleId={investibleId}
          marketPresences={marketPresences}
          investmentReasons={investmentReasons}
        />
      </SubSection>
      <SubSection
        type={SECTION_TYPE_SECONDARY}
        title={intl.formatMessage({ id: 'planningInvestibleAssignments' })}
      >
        {marketId && investible && (
          <DisplayAssignments
            marketId={marketId}
            marketPresences={marketPresences}
            investible={marketInvestible}
          />
        )}
      </SubSection>
      <SubSection
        type={SECTION_TYPE_SECONDARY}
        title={intl.formatMessage({ id: 'decisionInvestibleDescription' })}
      >
        <Paper>
          {diff && (
            <DiffDisplay id={investibleId}/>
          )}
          {!diff && (
            <ReadOnlyQuillEditor
              value={description}
            />
          )}

        </Paper>
      </SubSection>
      {discussionVisible && (
        <SubSection
          type={SECTION_TYPE_SECONDARY}
          title={intl.formatMessage({ id: 'decisionInvestibleDiscussion' })}
        >
          <CommentAddBox
            hidden={commentAddHidden}
            allowedTypes={allowedCommentTypes}
            investible={investible}
            marketId={marketId}
            type={commentAddType}
            onSave={closeCommentAdd}
            onCancel={closeCommentAdd}
          />
          <div ref={commentAddRef}/>
          <CommentBox comments={investmentReasonsRemoved} marketId={marketId}/>
        </SubSection>
      )}

    </Screen>
  );
}

PlanningInvestible.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  market: PropTypes.object.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  marketInvestible: PropTypes.object.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  marketPresences: PropTypes.arrayOf(PropTypes.object),
  // eslint-disable-next-line react/forbid-prop-types
  investibleComments: PropTypes.arrayOf(PropTypes.object),
  // eslint-disable-next-line react/forbid-prop-types
  investibles: PropTypes.arrayOf(PropTypes.object),
  investibleId: PropTypes.string.isRequired,
  userId: PropTypes.string.isRequired,
  toggleEdit: PropTypes.func,
  isAdmin: PropTypes.bool,
  hidden: PropTypes.bool,
};

PlanningInvestible.defaultProps = {
  marketPresences: [],
  investibleComments: [],
  investibles: [],
  toggleEdit: () => {
  },
  isAdmin: false,
  hidden: false,
};
export default PlanningInvestible;
