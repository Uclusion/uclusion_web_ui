/**
 * A component that renders a _planning_ dialog
 */
import React, { useContext, useEffect, useState } from 'react'
import { useHistory, useLocation } from 'react-router'
import { useIntl } from 'react-intl'
import PropTypes from 'prop-types'
import _ from 'lodash'
import { Grid, Typography, useMediaQuery, useTheme } from '@material-ui/core'
import Card from '@material-ui/core/Card'
import CardContent from '@material-ui/core/CardContent'
import CardHeader from '@material-ui/core/CardHeader'
import { makeStyles } from '@material-ui/core/styles'
import Summary from './Summary'
import PlanningIdeas from './PlanningIdeas'
import Screen from '../../../containers/Screen/Screen'
import {
  baseNavListItem,
  formMarketArchivesLink, formMarketLink,
  makeArchiveBreadCrumbs,
  makeBreadCrumbs,
  navigate
} from '../../../utils/marketIdPathFunctions'
import {
  QUESTION_TYPE, REPLY_TYPE,
  REPORT_TYPE,
  SUGGEST_CHANGE_TYPE,
  TODO_TYPE
} from '../../../constants/comments'
import CommentAddBox from '../../../containers/CommentBox/CommentAddBox'
import CommentBox, { getSortedRoots } from '../../../containers/CommentBox/CommentBox'
import { ACTIVE_STAGE } from '../../../constants/markets'
import { getUserInvestibles, sumNotificationCounts } from './userUtils'
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext'
import {
  getMarketPresences,
  getPresenceMap,
  marketHasOnlyCurrentUser
} from '../../../contexts/MarketPresencesContext/marketPresencesHelper'
import DismissableText from '../../../components/Notifications/DismissableText'
import {
  PLACEHOLDER,
  SECTION_SUB_HEADER,
  SECTION_TYPE_SECONDARY_WARNING,
  SECTION_TYPE_WARNING
} from '../../../constants/global'
import ArchiveInvestbiles from '../../DialogArchives/ArchiveInvestibles'
import SubSection from '../../../containers/SubSection/SubSection'
import { addInvestible, getInvestiblesInStage } from '../../../contexts/InvestibesContext/investiblesContextHelper'
import UclusionTour from '../../../components/Tours/UclusionTour'
import { INVITED_USER_WORKSPACE } from '../../../contexts/TourContext/tourContextHelper';
import { getMarketInfo, hasNotVoted } from '../../../utils/userFunctions'
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext'
import MarketTodos from './MarketTodos'
import Gravatar from '../../../components/Avatars/Gravatar';
import { LocalPlanningDragContext } from './InvestiblesByWorkspace'
import { isInReviewStage } from '../../../contexts/MarketStagesContext/marketStagesContextHelper'
import { findMessageOfType, findMessageOfTypeAndId } from '../../../utils/messageUtils'
import NotificationCountChips from '../NotificationCountChips'
import AddIcon from '@material-ui/icons/Add'
import ExpandableAction from '../../../components/SidebarActions/Planning/ExpandableAction'
import PlaylistAddCheckIcon from '@material-ui/icons/PlaylistAddCheck';
import { workspaceInvitedUserSteps } from '../../../components/Tours/InviteTours/workspaceInvitedUser';
import WorkIcon from '@material-ui/icons/Work'
import ListAltIcon from '@material-ui/icons/ListAlt'
import EditIcon from '@material-ui/icons/Edit'
import BlockIcon from '@material-ui/icons/Block'
import QuestionIcon from '@material-ui/icons/ContactSupport'
import UpdateIcon from '@material-ui/icons/Update'
import ChangeSuggstionIcon from '@material-ui/icons/ChangeHistory'
import AgilePlanIcon from '@material-ui/icons/PlaylistAdd'
import MenuBookIcon from '@material-ui/icons/MenuBook'
import PlayForWorkIcon from '@material-ui/icons/PlayForWork'
import { getFakeCommentsArray } from '../../../utils/stringFunctions'
import Chip from '@material-ui/core/Chip'
import { getThreadIds } from '../../../utils/commentFunctions'
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext'
import { SearchResultsContext } from '../../../contexts/SearchResultsContext/SearchResultsContext'
import { getPageReducerPage, usePageStateReducer } from '../../../components/PageState/pageStateHooks'
import DialogManage from '../DialogManage'
import { useMetaDataStyles } from '../../Investible/Planning/PlanningInvestible'
import SettingsIcon from '@material-ui/icons/Settings'
import PlanningDialogEdit from './PlanningDialogEdit'
import PlanningInvestibleAdd from './PlanningInvestibleAdd'
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'
import { DiffContext } from '../../../contexts/DiffContext/DiffContext'
import { usePlanFormStyles } from '../../../components/AgilePlan'

function PlanningDialog(props) {
  const history = useHistory();
  const {
    market,
    investibles,
    marketStages,
    comments,
    hidden,
    myPresence,
    banner
  } = props;
  const [searchResults] = useContext(SearchResultsContext);
  const { results, parentResults, search } = searchResults;
  const location = useLocation();
  const { hash } = location;
  const classes = useInvestiblesByPersonStyles();
  const [marketsState] = useContext(MarketsContext);
  const intl = useIntl();
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('md'));
  const { name: marketName, id: marketId, market_stage: marketStage, created_by: createdBy, created_at: createdAt,
    budget_unit: budgetUnit, use_budget: useBudget, votes_required: votesRequired} = market;
  const activeMarket = marketStage === ACTIVE_STAGE;
  const inArchives = !activeMarket || (myPresence && !myPresence.following);
  const isAdmin = myPresence.is_admin;
  const breadCrumbs = inArchives
      ? makeArchiveBreadCrumbs(history)
      : makeBreadCrumbs(history);
  const unResolvedMarketComments = comments.filter(comment => !comment.investible_id && !comment.resolved) || [];
  // There is no link to a reply so including them should be okay
  const notTodoComments = unResolvedMarketComments.filter(comment =>
    [QUESTION_TYPE, SUGGEST_CHANGE_TYPE, REPORT_TYPE, REPLY_TYPE].includes(comment.comment_type)) || [];
  const allowedCommentTypes = [QUESTION_TYPE, REPORT_TYPE, SUGGEST_CHANGE_TYPE];
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [, diffDispatch] = useContext(DiffContext);
  // For security reasons you can't access source data while being dragged in case you are not the target website
  const [beingDraggedHack, setBeingDraggedHack] = useState({});
  const [pageStateFull, pageDispatch] = usePageStateReducer('market');
  const isDraft = marketHasOnlyCurrentUser(marketPresencesState, marketId);
  const [pageState, updatePageState, pageStateReset] = getPageReducerPage(pageStateFull, pageDispatch, marketId,
    {sectionOpen: 'workspaceMain', collaboratorsOpen: isDraft && myPresence.id === createdBy });
  const {
    sectionOpen,
    collaboratorsOpen,
    furtherWorkType
  } = pageState;
  function setSectionOpen(section) {
    updatePageState({sectionOpen: section});
  }
  const presences = getMarketPresences(marketPresencesState, marketId) || [];
  const acceptedStage = marketStages.find(stage => stage.assignee_enter_only) || {};
  const inDialogStage = marketStages.find(stage => stage.allows_investment) || {};
  const inReviewStage = marketStages.find(stage => isInReviewStage(stage)) || {};
  const inBlockingStage = marketStages.find(stage => stage.move_on_comment && stage.allows_issues) || {};
  const inVerifiedStage = marketStages.find(stage => stage.appears_in_market_summary) || {};
  const visibleStages = marketStages.filter((stage) => stage.appears_in_context) || [];
  const visibleStageIds = visibleStages.map((stage) => stage.id);
  const assignablePresences = presences.filter((presence) => !presence.market_banned && presence.following
    && !presence.market_guest) || [];
  const isChannel = _.isEmpty(investibles);

  const furtherWorkStage = marketStages.find((stage) => (!stage.allows_assignment && !stage.close_comments_on_entrance)) || {};
  const requiresInputStage = marketStages.find((stage) => (!stage.allows_issues && stage.move_on_comment)) || {};
  const furtherWorkInvestibles = getInvestiblesInStage(investibles, furtherWorkStage.id) || [];
  const furtherWorkReadyToStart = _.remove(furtherWorkInvestibles, (investible) => {
    const marketInfo = getMarketInfo(investible, marketId);
    const { open_for_investment: openForInvestment } = marketInfo;
    return openForInvestment;
  });
  const requiresInputInvestibles = getInvestiblesInStage(investibles, requiresInputStage.id);
  const blockedInvestibles = getInvestiblesInStage(investibles, inBlockingStage.id);
  const swimlaneInvestibles = investibles.filter((inv) => {
    const { market_infos } = inv;
    if (!market_infos) {
      return false;
    }
    return market_infos.find((info) => {
      const stage = marketStages.find((stage) => stage.id === info.stage);
      return stage && stage.appears_in_context && !stage.appears_in_market_summary;
    });
  });
  const archiveInvestibles = investibles.filter((inv) => {
    const { market_infos } = inv;
    if (!market_infos) {
      return false;
    }
    return market_infos.find((info) => {
      const stage = marketStages.find((stage) => stage.id === info.stage);
      return stage && stage.close_comments_on_entrance;
    });
  });
  const highlightMap = {};
  requiresInputInvestibles.forEach((investible) => {
    if (hasNotVoted(investible, marketPresencesState, marketsState, comments, marketId, myPresence.external_id)) {
      highlightMap[investible.investible.id] = true;
    }
  });
  const presenceMap = getPresenceMap(marketPresencesState, marketId);

  function isSectionOpen(section) {
    return sectionOpen === section || !_.isEmpty(search) || mobileLayout ||
      (!sectionOpen && section === 'workspaceMain');
  }

  function isSectionBold(section) {
    return (sectionOpen === section || (!sectionOpen && section === 'workspaceMain')) && _.isEmpty(search);
  }

  useEffect(() => {
    if (hash) {
      const presences = getMarketPresences(marketPresencesState, marketId) || []
      const assignablePresences = presences.filter((presence) => !presence.market_banned && presence.following
        && !presence.market_guest) || []
      const linkPresence = assignablePresences.find((presence) => hash.includes(presence.id))
      if (linkPresence) {
        if (hash.startsWith('#cv')) {
          if (sectionOpen !== 'discussionSection') {
            updatePageState({ sectionOpen: 'discussionSection' });
          }
        }
        else if (sectionOpen !== 'storiesSection') {
          updatePageState({ sectionOpen: 'storiesSection' })
        }
      } else if (hash.includes('workspaceMain')) {
        if (sectionOpen !== 'workspaceMain') {
          updatePageState({ sectionOpen: 'workspaceMain' })
        }
      } else if (sectionOpen !== 'discussionSection') {
        const unResolvedMarketComments = comments.filter(comment => !comment.investible_id && !comment.resolved) || []
        // There is no link to a reply so including them should be okay
        const notTodoComments = unResolvedMarketComments.filter(comment =>
          [QUESTION_TYPE, SUGGEST_CHANGE_TYPE, REPORT_TYPE, REPLY_TYPE].includes(comment.comment_type)) || []
        const noTodoCommentIds = getThreadIds(notTodoComments, comments)
        const foundCommentId = noTodoCommentIds.find((anId) => hash.includes(anId))
        if (foundCommentId) {
          updatePageState({ sectionOpen: 'discussionSection' });
        }
      }
    }
  }, [marketId, marketPresencesState, comments, hash, sectionOpen, updatePageState]);

  function onClickFurtherStart() {
    updatePageState({furtherWorkType: 'readyToStart'});
  }

  function onClickFurther() {
    updatePageState({furtherWorkType: 'notReadyToStart'});
  }

  function openSubSection(subSection) {
    setSectionOpen(subSection);
  }

  function getNavListItemOnClick(subSection, target) {
    return () => {
      openSubSection(subSection);
      navigate(history, target, false, true);
    };
  }

  function createNavListItem(icon, textId, anchorId, howManyNum, subSection, alwaysShow, isBold) {
    const nav = baseNavListItem(formMarketLink(marketId), icon, textId, anchorId, howManyNum, alwaysShow);
    if (subSection && nav.target) {
      nav['onClickFunc'] = getNavListItemOnClick(subSection, nav.target);
    }
    if (isBold) {
      nav['isBold'] = true;
    }
    return nav;
  }
  const sortedRoots = getSortedRoots(notTodoComments, searchResults);
  const questions = sortedRoots.filter((comment) => comment.comment_type === QUESTION_TYPE);
  const { id: questionId } = getFakeCommentsArray(questions)[0];
  const suggestions = sortedRoots.filter((comment) => comment.comment_type === SUGGEST_CHANGE_TYPE);
  const { id: suggestId } = getFakeCommentsArray(suggestions)[0];
  const reports = sortedRoots.filter((comment) => comment.comment_type === REPORT_TYPE);
  const { id: reportId } = getFakeCommentsArray(reports)[0];
  const todoComments = unResolvedMarketComments.filter((comment) => {
    if (_.isEmpty(search)) {
      return comment.comment_type === TODO_TYPE;
    }
    return comment.comment_type === TODO_TYPE && (results.find((item) => item.id === comment.id)
      || parentResults.find((id) => id === comment.id));
  });
  const resolvedMarketComments = comments.filter((comment) => {
    if (_.isEmpty(search)) {
      return !comment.investible_id && comment.resolved;
    }
    return !comment.investible_id && comment.resolved && (results.find((item) => item.id === comment.id)
      || parentResults.find((id) => id === comment.id));
  });
  const archivedSize = _.size(archiveInvestibles) + _.size(resolvedMarketComments);

  const discussionItems = [inArchives ? {} : createNavListItem(AddIcon,'commentAddBox',
    undefined, undefined, 'discussionSection'),
    createNavListItem(QuestionIcon,'questions', `c${questionId}`, _.size(questions),
      'discussionSection'),
    createNavListItem(UpdateIcon,'reports', `c${reportId}`, _.size(reports),
      'discussionSection'),
    createNavListItem(ChangeSuggstionIcon,'suggestions', `c${suggestId}`, _.size(suggestions),
      'discussionSection')];

  const storiesItems = [createNavListItem(AgilePlanIcon,'swimLanes', 'swimLanes',
    _.size(swimlaneInvestibles), 'storiesSection', _.isEmpty(search)),
    createNavListItem(WorkIcon,'planningInvestibleMoveToFurtherWorkLabel', 'furtherWork',
      _.size(furtherWorkReadyToStart) + _.size(furtherWorkInvestibles), 'storiesSection',
      !inArchives && _.isEmpty(search))];

  if (_.size(requiresInputInvestibles) > 0) {
    storiesItems.unshift(createNavListItem(PlayForWorkIcon,'requiresInputStageLabel', 'requiresInput',
      _.size(requiresInputInvestibles), 'storiesSection'));
  }

  if (_.size(blockedInvestibles) > 0) {
    storiesItems.unshift(createNavListItem(BlockIcon,'planningBlockedStageLabel',
      'blocked', _.size(blockedInvestibles), 'storiesSection'));
  }

  const navigationMenu = {
    navHeaderIcon: PlaylistAddCheckIcon, navTooltip: 'planningNavTooltip',
    navListItemTextArray: [
      createNavListItem(EditIcon, 'planningDialogNavDetailsLabel', 'workspaceMain',
      _.isEmpty(search) || results.find((result) => result.id === marketId) ? undefined : 0,
      'workspaceMain', true, isSectionBold('workspaceMain')),
      createNavListItem(AddIcon, 'addStoryLabel', 'addStorySection',
        undefined, 'addStorySection', true, isSectionBold('addStorySection')),
      {
        text: intl.formatMessage({ id: 'planningDialogNavStoriesLabel' }),
        subItems: storiesItems, isBold: isSectionBold('storiesSection')
      },
      createNavListItem(ListAltIcon, 'todoSection', 'marketTodos', _.size(todoComments),
        'marketTodos', !inArchives && _.isEmpty(search), isSectionBold('marketTodos')),
      {
        text: intl.formatMessage({ id: 'planningDialogNavDiscussionLabel' }),
        subItems: discussionItems, isBold: isSectionBold('discussionSection')
      },
      {
        icon: MenuBookIcon, text: intl.formatMessage({ id: 'planningDialogViewArchivesLabel' }),
        target: archivedSize > 0 ? formMarketArchivesLink(marketId) : undefined,
        num: _.isEmpty(search) ? undefined : archivedSize, newPage: true
      },
      createNavListItem(SettingsIcon, 'settings', 'settingsSection',
        undefined, 'settingsSection', true, isSectionBold('settingsSection'))
    ]
  }
  const furtherWorkReadyToStartChip = furtherWorkReadyToStart.length > 0
    && <Chip label={`${furtherWorkReadyToStart.length}`} color="primary" size='small'
             className={classes.chipStyleYellow} />;
  const furtherWorkNotReadyToStartChip = furtherWorkInvestibles.length > 0 &&
    <Chip label={`${furtherWorkInvestibles.length}`} size='small' className={classes.chipStyleBlue} />;

  const planningInvestibleAddClasses = usePlanFormStyles();
  const marketPresences = getMarketPresences(marketPresencesState, marketId);
  function onInvestibleSave(investible) {
    addInvestible(investiblesDispatch, diffDispatch, investible);
  }

  function onDone(destinationLink) {
    openSubSection('storiesSection');
    if (destinationLink) {
      navigate(history, destinationLink);
    }
  }

  return (
    <Screen
      title={marketName}
      hidden={hidden}
      tabTitle={marketName}
      breadCrumbs={breadCrumbs}
      banner={banner}
      navigationOptions={navigationMenu}
    >
      <UclusionTour
        name={INVITED_USER_WORKSPACE}
        hidden={hidden}
        steps={workspaceInvitedUserSteps({name: myPresence.name, isCreator: createdBy === myPresence.id})}
      />
      <div id="workspaceMain" style={{ display: isSectionOpen('workspaceMain') ? 'block' : 'none' }}>
        {collaboratorsOpen && (
          <DialogManage marketId={marketId} onClose={() => updatePageState({collaboratorsOpen: false})}/>
        )}
        <DismissableText textId="planningEditHelp"/>
        <Summary market={market} hidden={hidden} activeMarket={activeMarket} inArchives={inArchives}
                 pageState={pageState} updatePageState={updatePageState} pageStateReset={pageStateReset}
                 isDraft={isDraft}/>
      </div>
      <div id="addStorySection">
        {!hidden && marketId && isSectionOpen('addStorySection') && !mobileLayout && (
          <PlanningInvestibleAdd
            marketId={marketId}
            onCancel={() => openSubSection('storiesSection')}
            onSave={onInvestibleSave}
            onSpinComplete={onDone}
            marketPresences={marketPresences}
            createdAt={createdAt}
            classes={planningInvestibleAddClasses}
            maxBudgetUnit={budgetUnit}
            useBudget={useBudget ? useBudget : false}
            votesRequired={votesRequired}
          />
        )}
      </div>
      <LocalPlanningDragContext.Provider value={[beingDraggedHack, setBeingDraggedHack]}>
        <div id="storiesSection"
             style={{ display: isSectionOpen('storiesSection') ? 'block' : 'none' }}>
          <DismissableText textId="storyHelp"/>
          {!isChannel && (
            <DismissableText textId="stageHelp"/>
          )}
          {!_.isEmpty(blockedInvestibles) && (
            <SubSection
              type={SECTION_TYPE_SECONDARY_WARNING}
              titleIcon={blockedInvestibles.length > 0 ? <Chip label={`${blockedInvestibles.length}`}
                                                               color="primary"
                                                               size='small'
                                                               className={classes.chipStyle} /> : undefined}
              title={intl.formatMessage({ id: 'blockedHeader' })}
              helpTextId="blockedSectionHelp"
              id="blocked"
            >
              <ArchiveInvestbiles
                elevation={0}
                marketId={market.id}
                presenceMap={getPresenceMap(marketPresencesState, market.id)}
                investibles={blockedInvestibles}
                presenceId={myPresence.id}
                stage={inBlockingStage}
                allowDragDrop
                comments={comments}
              />
            </SubSection>
          )}
          {!_.isEmpty(blockedInvestibles) && (<div style={{ paddingBottom: '2rem' }}/>)}
          {!_.isEmpty(requiresInputInvestibles) && (
            <SubSection
              type={SECTION_TYPE_SECONDARY_WARNING}
              titleIcon={requiresInputInvestibles.length > 0 ? <Chip label={`${requiresInputInvestibles.length}`}
                                                                      color="primary" size='small'
                                                                      className={classes.chipStyle} /> : undefined}
              title={intl.formatMessage({ id: 'requiresInputHeader' })}
              helpTextId="requiresInputSectionHelp"
              id="requiresInput"
            >
              <ArchiveInvestbiles
                comments={comments}
                elevation={0}
                marketId={marketId}
                presenceMap={presenceMap}
                investibles={requiresInputInvestibles}
                highlightMap={highlightMap}
                stage={requiresInputStage}
                presenceId={myPresence.id}
                allowDragDrop
              />
            </SubSection>
          )}
          {!_.isEmpty(requiresInputInvestibles) && (<div style={{ paddingBottom: '2rem' }}/>)}
          <div id="swimLanes">
            <InvestiblesByPerson
              comments={comments}
              investibles={investibles}
              marketId={marketId}
              marketPresences={assignablePresences}
              visibleStages={visibleStageIds}
              acceptedStage={acceptedStage}
              inDialogStage={inDialogStage}
              inBlockingStage={inBlockingStage}
              inReviewStage={inReviewStage}
              inVerifiedStage={inVerifiedStage}
              requiresInputStage={requiresInputStage}
              market={market}
              isAdmin={isAdmin}
              mobileLayout={mobileLayout}
              pageState={pageState} updatePageState={updatePageState}
            />
          </div>
          <SubSection
            type={SECTION_SUB_HEADER}
            isBlackText
            helpTextId="furtherSectionHelp"
            id="furtherWork"
            title={intl.formatMessage({ id: 'readyFurtherWorkHeader' })}
          >
            {furtherWorkType === 'readyToStart' && (
              <PlanningInvestibleAdd
                marketId={marketId}
                onCancel={() => updatePageState({furtherWorkType: undefined})}
                onSave={onInvestibleSave}
                onSpinComplete={(destinationLink) => {
                  updatePageState({furtherWorkType: undefined});
                  onDone(destinationLink);
                }}
                marketPresences={marketPresences}
                createdAt={createdAt}
                classes={planningInvestibleAddClasses}
                maxBudgetUnit={budgetUnit}
                useBudget={useBudget ? useBudget : false}
                votesRequired={votesRequired}
                furtherWorkType={furtherWorkType}
              />
            )}
            <div style={{paddingTop: '1rem'}} />
            <SubSection
              type={SECTION_TYPE_SECONDARY_WARNING}
              titleIcon={furtherWorkReadyToStartChip === false ? undefined : furtherWorkReadyToStartChip}
              title={intl.formatMessage({ id: 'readyToStartHeader' })}
              actionButton={
                <ExpandableAction
                  icon={<AddIcon htmlColor="black"/>}
                  label={intl.formatMessage({ id: 'createFurtherWorkExplanation' })}
                  openLabel={intl.formatMessage({ id: 'planningDialogAddInvestibleLabel'})}
                  onClick={onClickFurtherStart}
                  disabled={!isAdmin}
                  tipPlacement="top-end"
                />
              }
            >
              <ArchiveInvestbiles
                comments={comments}
                elevation={0}
                marketId={marketId}
                presenceMap={presenceMap}
                investibles={furtherWorkReadyToStart}
                stage={furtherWorkStage}
                presenceId={myPresence.id}
                allowDragDrop
                isReadyToStart
              />
            </SubSection>
            {!_.isEmpty(furtherWorkInvestibles) && (<div style={{ paddingBottom: '15px' }}/>)}
            {furtherWorkType === 'notReadyToStart' && (
              <PlanningInvestibleAdd
                marketId={marketId}
                onCancel={() => updatePageState({furtherWorkType: undefined})}
                onSave={onInvestibleSave}
                onSpinComplete={(destinationLink) => {
                  updatePageState({furtherWorkType: undefined});
                  onDone(destinationLink);
                }}
                marketPresences={marketPresences}
                createdAt={createdAt}
                classes={planningInvestibleAddClasses}
                maxBudgetUnit={budgetUnit}
                useBudget={useBudget ? useBudget : false}
                votesRequired={votesRequired}
                furtherWorkType={furtherWorkType}
              />
            )}
            <SubSection
              type={SECTION_TYPE_WARNING}
              titleIcon={furtherWorkNotReadyToStartChip === false ? undefined : furtherWorkNotReadyToStartChip}
              title={intl.formatMessage({ id: 'notReadyToStartHeader' })}
              actionButton={
                <ExpandableAction
                  icon={<AddIcon htmlColor="black"/>}
                  label={intl.formatMessage({ id: 'createFurtherWorkExplanation' })}
                  openLabel={intl.formatMessage({ id: 'planningDialogAddInvestibleLabel'})}
                  onClick={onClickFurther}
                  disabled={!isAdmin}
                  tipPlacement="top-end"
                />
              }
            >
              <ArchiveInvestbiles
                comments={comments}
                elevation={0}
                marketId={marketId}
                presenceMap={presenceMap}
                investibles={furtherWorkInvestibles}
                stage={furtherWorkStage}
                presenceId={myPresence.id}
                allowDragDrop
              />
            </SubSection>
          </SubSection>
        </div>
        <MarketTodos comments={unResolvedMarketComments} marketId={marketId}
                     sectionOpen={isSectionOpen('marketTodos')}
                     setSectionOpen={setSectionOpen} market={market} userId={myPresence.id}/>
      </LocalPlanningDragContext.Provider>
      <Grid container spacing={2} id="discussionSection"
            style={{ display: isSectionOpen('discussionSection') ? 'block' : 'none' }}>
        <DismissableText textId="workspaceCommentHelp"/>
        <Grid item id="commentAddArea" xs={12}>
          {!inArchives && _.isEmpty(search) && marketId && !hidden && (
            <CommentAddBox
              allowedTypes={allowedCommentTypes}
              marketId={marketId}
              numProgressReport={_.size(reports)}
            />
          )}
          <CommentBox comments={notTodoComments} marketId={marketId} allowedTypes={allowedCommentTypes}/>
        </Grid>
      </Grid>
      <Grid container spacing={2} id="settingsSection">
        {!hidden && !_.isEmpty(acceptedStage) && !_.isEmpty(inVerifiedStage) &&
          isSectionOpen('settingsSection') && !mobileLayout && (
          <PlanningDialogEdit
            market={market}
            userId={myPresence.id}
            onCancel={() => openSubSection('workspaceMain')}
            acceptedStage={acceptedStage}
            verifiedStage={inVerifiedStage}
          />
        )}
      </Grid>
    </Screen>
  );
}

PlanningDialog.propTypes = {
  market: PropTypes.object.isRequired,
  investibles: PropTypes.arrayOf(PropTypes.object),
  marketPresences: PropTypes.arrayOf(PropTypes.object),
  marketStages: PropTypes.arrayOf(PropTypes.object),
  hidden: PropTypes.bool,
  comments: PropTypes.arrayOf(PropTypes.object),
  myPresence: PropTypes.object.isRequired,
};

PlanningDialog.defaultProps = {
  investibles: [],
  marketPresences: [],
  marketStages: [],
  hidden: false,
  comments: []
};

export const useInvestiblesByPersonStyles = makeStyles(
  theme => {
    return {
      root: {
        margin: theme.spacing(1, 0, '2rem')
      },
      content: {
        padding: theme.spacing(0, 1),
        "&:last-child": {
          paddingBottom: "inherit"
        }
      },
      smallGravatar: {
      },
      header: {
        padding: theme.spacing(1)
      },
      menuButton: {
        width: '100%',
        padding: '12px'
      },
      expansionControl: {
        backgroundColor: '#ecf0f1',
        width: '30%',
        [theme.breakpoints.down('sm')]: {
          width: 'auto'
        }
      },
      fontControl: {
        alignItems: "center",
        textTransform: 'none',
        marginRight: 'auto',
        marginLeft: '5px',
        fontWeight: 700
      },
      rightSpace: {
        paddingRight: theme.spacing(1),
      },
      chipStyle: {
        marginRight: '5px',
        backgroundColor: '#E85757'
      },
      chipStyleYellow: {
        marginRight: '5px',
        color: 'black',
        backgroundColor: '#e6e969'
      },
      chipStyleBlue: {
        marginRight: '5px',
        color: 'white',
        backgroundColor: '#2F80ED'
      },
    };
  },
  { name: "InvestiblesByPerson" }
);

export function checkInProgressWarning(investibles, myPresence, messagesState) {
  const warnHash = {};
  if (!myPresence.id) {
    return warnHash;
  }
  investibles.forEach((fullInvestible) => {
    const { investible } = fullInvestible;
    const { id } = investible;
    if (findMessageOfTypeAndId(id, messagesState, 'REPORT')
      || findMessageOfType('REPORT_REQUIRED', id, messagesState)) {
      warnHash[id] = true;
    }
  });
  return warnHash;
}

export function countByType(investible, comments, commentTypes) {
  const { id } = investible;
  if (_.isEmpty(comments)) {
    return 0;
  }
  const openComments = comments.filter((comment) => {
    const { investible_id: investibleId, comment_type: commentType, resolved } = comment;
    return !resolved && id === investibleId && commentTypes.includes(commentType);
  });
  return _.size(openComments);
}

function InvestiblesByPerson(props) {
  const {
    comments,
    investibles,
    marketId,
    marketPresences,
    visibleStages,
    acceptedStage,
    inDialogStage,
    inBlockingStage,
    inReviewStage,
    requiresInputStage,
    inVerifiedStage,
    market,
    isAdmin,
    mobileLayout,
    pageState, updatePageState
  } = props;
  const intl = useIntl();
  const history = useHistory();
  const metaClasses = useMetaDataStyles();
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [messagesState] = useContext(NotificationsContext);
  const classes = useInvestiblesByPersonStyles();
  const planningInvestibleAddClasses = usePlanFormStyles();
  const { storyAssignee } = pageState;
  const { market_stage: marketStage, created_at: createdAt, budget_unit: budgetUnit, use_budget: useBudget,
    votes_required: votesRequired} = market;
  const activeMarket = marketStage === ACTIVE_STAGE;
  const marketPresencesSortedAlmost = _.sortBy(marketPresences, 'name');
  const marketPresencesSorted = _.sortBy(marketPresencesSortedAlmost, function (presence) {
    return !presence.current_user;
  });
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [, diffDispatch] = useContext(DiffContext);

  function onClick(id) {
    updatePageState({storyAssignee: id});
  }

  return marketPresencesSorted.map(presence => {
    const { id, email, placeholder_type: placeholderType } = presence;
    const name = (presence.name || '').replace('@', ' ');
    const showAsPlaceholder = placeholderType === PLACEHOLDER;
    const { criticalNotificationCount, delayableNotificationCount } = sumNotificationCounts(presence, comments,
      marketPresencesState, messagesState, marketId);
    const myInvestibles = getUserInvestibles(
      id,
      marketId,
      investibles,
      visibleStages,
    );
    function onInvestibleSave(investible) {
      addInvestible(investiblesDispatch, diffDispatch, investible);
    }
    function onDone(destinationLink) {
      if (destinationLink) {
        navigate(history, destinationLink);
      }
    }
    const myClassName = showAsPlaceholder ? metaClasses.archivedColor : metaClasses.normalColor;
    return (
      <>
        {storyAssignee === id && (
          <PlanningInvestibleAdd
            marketId={marketId}
            onCancel={() => updatePageState({storyAssignee: undefined})}
            onSave={onInvestibleSave}
            onSpinComplete={(destinationLink) => {
              updatePageState({storyAssignee: undefined});
              onDone(destinationLink);
            }}
            marketPresences={marketPresences}
            createdAt={createdAt}
            classes={planningInvestibleAddClasses}
            maxBudgetUnit={budgetUnit}
            useBudget={useBudget ? useBudget : false}
            votesRequired={votesRequired}
            storyAssignee={storyAssignee}
          />
        )}
        <Card id={`sl${id}`} key={id} className={classes.root} elevation={3}>
          <CardHeader
            className={classes.header}
            id={`u${id}`}
            title={
            <div style={{alignItems: "center", display: "flex", flexDirection: 'row'}}>
              <Typography variant="h6" className={myClassName}>
                {name}
                {!mobileLayout && (
                  <NotificationCountChips id={id} criticalNotifications={criticalNotificationCount}
                                          delayableNotifications={delayableNotificationCount} />
                )}
              </Typography>
              <div style={{flexGrow: 1}} />
              <ExpandableAction
                icon={<AddIcon htmlColor="black"/>}
                label={intl.formatMessage({ id: 'createAssignmentExplanation' })}
                openLabel={intl.formatMessage({ id: 'createAssignment'})}
                onClick={() => onClick(id)}
                disabled={!isAdmin}
                tipPlacement="top-end"
              />
            </div>}
            avatar={showAsPlaceholder ? undefined : <Gravatar className={classes.smallGravatar} email={email}
                                                              name={name}/>}
            titleTypographyProps={{ variant: "subtitle2" }}
          />
          <CardContent className={classes.content}>
            {marketId &&
              acceptedStage &&
              inDialogStage &&
              inReviewStage &&
              inVerifiedStage &&
              inBlockingStage && (
                <PlanningIdeas
                  investibles={myInvestibles}
                  marketId={marketId}
                  acceptedStage={acceptedStage}
                  inDialogStageId={inDialogStage.id}
                  inReviewStageId={inReviewStage.id}
                  inBlockingStageId={inBlockingStage.id}
                  inRequiresInputStageId={requiresInputStage.id}
                  inVerifiedStageId={inVerifiedStage.id}
                  activeMarket={activeMarket}
                  comments={comments}
                  presenceId={presence.id}
                />
              )}
          </CardContent>
        </Card>
      </>
    );
  });
}

export default PlanningDialog;
