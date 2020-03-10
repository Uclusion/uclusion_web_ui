/**
 * A component that renders a _planning_ dialog
 */
import React, { useState, useRef, useContext } from 'react'
import { useHistory } from 'react-router';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { Grid, Typography } from '@material-ui/core';
import GridList from '@material-ui/core/GridList';
import GridListTile from '@material-ui/core/GridListTile';
import ListSubheader from '@material-ui/core/ListSubheader';
import Summary from './Summary';
import PlanningIdeas from './PlanningIdeas';
import Screen from '../../../containers/Screen/Screen';
import {
  formMarketManageLink,
  makeArchiveBreadCrumbs,
  makeBreadCrumbs,
  navigate,
} from '../../../utils/marketIdPathFunctions';
import { ISSUE_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE } from '../../../constants/comments'
import RaiseIssue from '../../../components/SidebarActions/RaiseIssue';
import AskQuestions from '../../../components/SidebarActions/AskQuestion';
import SubSection from '../../../containers/SubSection/SubSection';
import CommentAddBox from '../../../containers/CommentBox/CommentAddBox';
import CommentBox from '../../../containers/CommentBox/CommentBox';
import ViewArchiveActionButton from './ViewArchivesActionButton';
import { scrollToCommentAddBox } from '../../../components/Comments/commentFunctions';
import { ACTIVE_STAGE, DECISION_TYPE, PLANNING_TYPE } from '../../../constants/markets'
import ManageParticipantsActionButton from './ManageParticipantsActionButton';
import { SECTION_TYPE_SECONDARY } from '../../../constants/global';
import { getUserInvestibles } from './userUtils';
import { getDialogTypeIcon } from '../../../components/Dialogs/dialogIconFunctions';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { marketHasOnlyApprovers } from '../../../contexts/MarketPresencesContext/marketPresencesHelper'
import ExpandableSidebarAction from '../../../components/SidebarActions/ExpandableSidebarAction'
import InsertLinkIcon from '@material-ui/icons/InsertLink'
import SuggestChanges from '../../../components/SidebarActions/SuggestChanges'

function PlanningDialog(props) {
  const history = useHistory();
  const {
    market,
    investibles,
    marketPresences,
    marketStages,
    comments,
    hidden,
    myPresence,
  } = props;
  const breadCrumbs = myPresence && myPresence.market_hidden?
    makeArchiveBreadCrumbs(history) :
    makeBreadCrumbs(history);

  const intl = useIntl();
  const commentAddRef = useRef(null);
  const { id: marketId, market_stage: marketStage } = market;
  const activeMarket = marketStage === ACTIVE_STAGE;
  const marketComments = comments.filter(comment => !comment.investible_id);
  const [commentAddType, setCommentAddType] = useState(ISSUE_TYPE);
  const [commentAddHidden, setCommentAddHidden] = useState(true);
  const allowedCommentTypes = [ISSUE_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE];
  const { name: marketName, locked_by: lockedBy } = market;
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const isChannel = marketHasOnlyApprovers(marketPresencesState, marketId);

  let lockedByName;
  if (lockedBy) {
    const lockedByPresence = marketPresences.find(
      presence => presence.id === lockedBy,
    );
    if (lockedByPresence) {
      const { name } = lockedByPresence;
      lockedByName = name;
    }
  }

  function toggleManageUsersMode() {
    navigate(history, formMarketManageLink(marketId));
  }

  function commentButtonOnClick(type) {
    setCommentAddType(type);
    setCommentAddHidden(false);
    scrollToCommentAddBox(commentAddRef);
  }

  function closeCommentAddBox() {
    setCommentAddHidden(true);
  }

  function getInvestiblesByPerson(investibles, marketPresences) {
    const followingPresences = marketPresences.filter(
      presence => presence.following,
    );
    const acceptedStage = marketStages.find(
      stage => !stage.allows_investment && stage.singular_only,
    );
    const inDialogStage = marketStages.find(stage => stage.allows_investment);
    const inReviewStage = marketStages.find(
      stage =>
        stage.appears_in_context &&
        !stage.singular_only &&
        !stage.allows_issues,
    );
    const inBlockingStage = marketStages.find(
      stage => stage.appears_in_context && stage.allows_issues,
    );
    return (
      <GridList key="toppresencelist" cellHeight="auto" cols={3}>
        <GridListTile
          key="Subheader1"
          cols={1}
          style={{ height: 'auto', width: '25%' }}
        >
          <ListSubheader component="div">
            {intl.formatMessage({ id: 'planningVotingStageLabel' })}
          </ListSubheader>
        </GridListTile>
        <GridListTile
          key="Subheader2"
          cols={1}
          style={{ height: 'auto', width: '25%' }}
        >
          <ListSubheader component="div">
            {intl.formatMessage({ id: 'planningAcceptedStageLabel' })}
          </ListSubheader>
        </GridListTile>
        <GridListTile
          key="Subheader3"
          cols={1}
          style={{ height: 'auto', width: '25%' }}
        >
          <ListSubheader component="div">
            {intl.formatMessage({ id: 'planningReviewStageLabel' })}
          </ListSubheader>
        </GridListTile>
        <GridListTile
          key="Subheader4"
          cols={1}
          style={{ height: 'auto', width: '25%' }}
        >
          <ListSubheader component="div">
            {intl.formatMessage({ id: 'planningBlockedStageLabel' })}
          </ListSubheader>
        </GridListTile>
        {followingPresences.map(presence => {
          const myInvestibles = getUserInvestibles(
            presence.id,
            marketId,
            investibles,
          );
          const { id, name } = presence;
          return (
            <GridList key={`topof${id}`} cellHeight="auto" cols={3}>
              <GridListTile
                key={`namecolumn${id}`}
                cols={3}
                style={{ height: 'auto', width: '100%' }}
              >
                <ListSubheader component="div">
                  <div id={`u${id}`}>{name}</div>
                </ListSubheader>
              </GridListTile>
              {marketId &&
                acceptedStage &&
                inDialogStage &&
                inReviewStage &&
                inBlockingStage && (
                  <PlanningIdeas
                    investibles={myInvestibles}
                    marketId={marketId}
                    acceptedStageId={acceptedStage.id}
                    inDialogStageId={inDialogStage.id}
                    inReviewStageId={inReviewStage.id}
                    inBlockingStageId={inBlockingStage.id}
                    comments={comments}
                    presenceId={presence.id}
                  />
                )}
            </GridList>
          );
        })}
      </GridList>
    );
  }

  function getSidebarActions() {
    if (!activeMarket) {
      return [
        <ManageParticipantsActionButton
          key="addParticipants"
          onClick={toggleManageUsersMode}
        />,
        <ViewArchiveActionButton key="archives" marketId={marketId} />
        ];
    }
    return [
      <ManageParticipantsActionButton
        key="addParticipants"
        onClick={toggleManageUsersMode}
      />,
      <ViewArchiveActionButton key="archives" marketId={marketId} />,
      <RaiseIssue key="issue" onClick={commentButtonOnClick} />,
      <AskQuestions key="question" onClick={commentButtonOnClick} />,
      <SuggestChanges key="suggest" onClick={commentButtonOnClick} />,
      <ExpandableSidebarAction
        id="link"
        key="link"
        icon={<InsertLinkIcon />}
        label={intl.formatMessage({ id: 'planningInvestibleDecision' })}
        onClick={() => navigate(history, `/dialogAdd#type=${DECISION_TYPE}&id=${marketId}`)}
      />,
    ];
  }

  const sidebarActions = getSidebarActions();
  return (
    <Screen
      title={marketName}
      hidden={hidden}
      tabTitle={marketName}
      breadCrumbs={breadCrumbs}
      sidebarActions={sidebarActions}
    >
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <SubSection
            title={intl.formatMessage({ id: 'planningDialogSummaryLabel' })}
            titleIcon={getDialogTypeIcon(PLANNING_TYPE)}
          >
            <Summary
              market={market}
              hidden={hidden}
            />
            {lockedBy && (
              <Typography>
                {intl.formatMessage({ id: 'lockedBy' }, { x: lockedByName })}
              </Typography>
            )}
          </SubSection>
        </Grid>
        {!isChannel && (
          <Grid item xs={12}>
            <SubSection
              type={SECTION_TYPE_SECONDARY}
              title={intl.formatMessage({ id: 'planningDialogPeopleLabel' })}
            >
              {getInvestiblesByPerson(investibles, marketPresences)}
            </SubSection>
          </Grid>
        )}
        <Grid item xs={12}>
          <SubSection
            type={SECTION_TYPE_SECONDARY}
            title={intl.formatMessage({ id: 'planningDialogDiscussionLabel' })}
          >
            <CommentAddBox
              hidden={commentAddHidden}
              type={commentAddType}
              allowedTypes={allowedCommentTypes}
              marketId={marketId}
              onSave={closeCommentAddBox}
              onCancel={closeCommentAddBox}
            />
            <CommentBox comments={marketComments} marketId={marketId} />
          </SubSection>
        </Grid>
      </Grid>
    </Screen>
  );
}

PlanningDialog.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  market: PropTypes.object.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  investibles: PropTypes.arrayOf(PropTypes.object),
  // eslint-disable-next-line react/forbid-prop-types
  marketPresences: PropTypes.arrayOf(PropTypes.object),
  // eslint-disable-next-line react/forbid-prop-types
  marketStages: PropTypes.arrayOf(PropTypes.object),
  hidden: PropTypes.bool,
  // eslint-disable-next-line react/forbid-prop-types
  comments: PropTypes.arrayOf(PropTypes.object),
  // eslint-disable-next-line react/forbid-prop-types
  myPresence: PropTypes.object.isRequired,
};

PlanningDialog.defaultProps = {
  investibles: [],
  marketPresences: [],
  marketStages: [],
  hidden: false,
  comments: [],
};

export default PlanningDialog;
