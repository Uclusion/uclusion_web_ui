/**
 * A component that renders a single group's view of a planning market
 */
import React, { useContext, useEffect, useState } from 'react'
import { useHistory, useLocation } from 'react-router'
import { FormattedMessage, useIntl } from 'react-intl'
import PropTypes from 'prop-types'
import _ from 'lodash'
import {
  Grid,
  Typography,
  useMediaQuery,
  useTheme,
  Link
} from '@material-ui/core'
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
import { getUserInvestibles, getUserSwimlaneInvestiblesHash } from './userUtils'
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext'
import {
  getMarketPresences,
  getPresenceMap
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
import { getMarketInfo } from '../../../utils/userFunctions'
import MarketTodos from './MarketTodos'
import Gravatar from '../../../components/Avatars/Gravatar';
import {
  isAcceptedStage,
  isBlockedStage,
  isFurtherWorkStage,
  isInReviewStage, isRequiredInputStage
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper'
import { findMessageOfType, findMessageOfTypeAndId } from '../../../utils/messageUtils'
import NotificationCountChips from '../NotificationCountChips'
import AddIcon from '@material-ui/icons/Add'
import ExpandableAction from '../../../components/SidebarActions/Planning/ExpandableAction'
import { workspaceInvitedUserSteps } from '../../../components/Tours/InviteTours/workspaceInvitedUser';
import ListAltIcon from '@material-ui/icons/ListAlt'
import QuestionIcon from '@material-ui/icons/ContactSupport'
import MenuBookIcon from '@material-ui/icons/MenuBook'
import Chip from '@material-ui/core/Chip'
import { getThreadIds } from '../../../utils/commentFunctions'
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
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext'
import AssignmentIcon from '@material-ui/icons/Assignment'
import { Inbox } from '@material-ui/icons'
import { getInboxTarget } from '../../../contexts/NotificationsContext/notificationsContextHelper'
import queryString from 'query-string'
import { MarketGroupsContext } from '../../../contexts/MarketGroupsContext/MarketGroupsContext'
import { getGroup } from '../../../contexts/MarketGroupsContext/marketGroupsContextHelper'

export const LocalPlanningDragContext = React.createContext([]);

function PlanningDialog(props) {
  const history = useHistory();
  const {
    marketInvestibles,
    marketStages,
    comments,
    hidden,
    myPresence,
    banner,
    marketId
  } = props;
  const [searchResults] = useContext(SearchResultsContext);
  const { results, parentResults, search } = searchResults;
  const location = useLocation();
  const { hash, search: querySearch } = location;
  const values = queryString.parse(querySearch);
  const { groupId } = values || {};
  const classes = useInvestiblesByPersonStyles();
  const intl = useIntl();
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('md'));
  const [groupState] = useContext(MarketGroupsContext);
  const group = getGroup(groupState, marketId, groupId);
  const { name: groupName, created_by: createdBy, created_at: createdAt,
    budget_unit: budgetUnit, use_budget: useBudget, votes_required: votesRequired} = group || {};
  const isAdmin = myPresence.is_admin;
  const breadCrumbs = makeBreadCrumbs(history);
  const unResolvedMarketComments = comments.filter(comment => !comment.investible_id && !comment.resolved) || [];
  // There is no link to a reply so including them should be okay
  const notTodoComments = unResolvedMarketComments.filter(comment =>
    [QUESTION_TYPE, SUGGEST_CHANGE_TYPE, REPORT_TYPE, REPLY_TYPE].includes(comment.comment_type)) || [];
  const allowedCommentTypes = [QUESTION_TYPE, REPORT_TYPE, SUGGEST_CHANGE_TYPE];
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [messagesState] = useContext(NotificationsContext);
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [, diffDispatch] = useContext(DiffContext);
  // For security reasons you can't access source data while being dragged in case you are not the target website
  const [beingDraggedHack, setBeingDraggedHack] = useState({});
  const [pageStateFull, pageDispatch] = usePageStateReducer('market');
  const [pageState, updatePageState, pageStateReset] = getPageReducerPage(pageStateFull, pageDispatch, groupId,
    {sectionOpen: 'workspaceMain' });
  const {
    sectionOpen,
    furtherWorkType
  } = pageState;
  function setSectionOpen(section) {
    updatePageState({sectionOpen: section});
  }
  const investibles = marketInvestibles.filter((investible) => {
    const marketInfo = getMarketInfo(investible, marketId);
    return marketInfo.group_id === groupId;
  });
  const acceptedStage = marketStages.find(stage => isAcceptedStage(stage)) || {};
  const inDialogStage = marketStages.find(stage => stage.allows_investment) || {};
  const inReviewStage = marketStages.find(stage => isInReviewStage(stage)) || {};
  const inBlockingStage = marketStages.find(stage => isBlockedStage(stage)) || {};
  const inVerifiedStage = marketStages.find(stage => stage.appears_in_market_summary) || {};
  const visibleStages = marketStages.filter((stage) => stage.appears_in_context) || [];
  const furtherWorkStage = marketStages.find((stage) => isFurtherWorkStage(stage)) || {};
  const requiresInputStage = marketStages.find((stage) => isRequiredInputStage(stage)) || {};
  const furtherWorkInvestibles = getInvestiblesInStage(investibles, furtherWorkStage.id, marketId) || [];
  const furtherWorkReadyToStart = _.remove(furtherWorkInvestibles, (investible) => {
    const marketInfo = getMarketInfo(investible, marketId);
    const { open_for_investment: openForInvestment } = marketInfo;
    return openForInvestment;
  });
  const requiresInputInvestibles = getInvestiblesInStage(investibles, requiresInputStage.id, marketId);
  const blockedInvestibles = getInvestiblesInStage(investibles, inBlockingStage.id, marketId);
  const swimlaneInvestibles = investibles.filter((inv) => {
    const marketInfo = getMarketInfo(inv, marketId) || {};
    const stage = marketStages.find((stage) => stage.id === marketInfo.stage);
    return stage && stage.appears_in_context && !stage.appears_in_market_summary;
  });
  const archiveInvestibles = investibles.filter((inv) => {
    const marketInfo = getMarketInfo(inv, marketId) || {};
    const stage = marketStages.find((stage) => stage.id === marketInfo.stage);
    return stage && stage.close_comments_on_entrance;
  });
  const highlightMap = {};
  requiresInputInvestibles.forEach((investible) => {
    const investibleId = investible.investible.id;
    const { messages } = (messagesState || {});
    const safeMessages = messages || [];
    const message = safeMessages.find((message) => {
      return ((message.investible_link && message.investible_link.includes(investibleId))
          || message.investible_id === investibleId) &&
        ['INLINE_STORY_INVESTIBLE', 'INLINE_STORY_COMMENT'].includes(message.link_type);
    });
    if (message) {
      highlightMap[investibleId] = true;
    }
  });
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
  const presenceMap = getPresenceMap(marketPresences);
  const singleSections = ['addCollaboratorSection', 'addStorySection'];
  function isSectionOpen(section) {
    return sectionOpen === section ||
      ((!_.isEmpty(search) || mobileLayout) &&
        (!singleSections.includes(section) && !singleSections.includes(sectionOpen))) ||
      (!sectionOpen && section === 'workspaceMain');
  }

  function isSectionBold(section) {
    return (sectionOpen === section || (!sectionOpen && section === 'workspaceMain')) && _.isEmpty(search) &&
      !mobileLayout;
  }

  useEffect(() => {
    if (hash) {
      if (sectionOpen !== 'workspaceMain') {
        if (hash.includes('workspaceMain')) {
          updatePageState({ sectionOpen: 'workspaceMain' })
        } else {
          const unResolvedMarketComments = comments.filter(comment => !comment.investible_id && !comment.resolved) || []
          // There is no link to a reply so including them should be okay
          const notTodoComments = unResolvedMarketComments.filter(comment =>
            [QUESTION_TYPE, SUGGEST_CHANGE_TYPE, REPORT_TYPE, REPLY_TYPE].includes(comment.comment_type)) || []
          const noTodoCommentIds = getThreadIds(notTodoComments, comments)
          const foundCommentId = noTodoCommentIds.find((anId) => hash.includes(anId))
          if (foundCommentId) {
            updatePageState({ sectionOpen: 'workspaceMain' });
          }
        }
      }
    }
  }, [comments, hash, sectionOpen, updatePageState]);

  function onClickFurtherStart() {
    updatePageState({furtherWorkType: 'readyToStart'});
  }

  function onClickFurther() {
    updatePageState({furtherWorkType: 'notReadyToStart'});
  }

  function openSubSection(subSection, doScroll=true) {
    setSectionOpen(subSection);
    if (doScroll) {
      window.scrollTo(0, 0);
    }
  }

  function createNavListItem(icon, textId, anchorId, howManyNum, alwaysShow, isBold, isSearch) {
    const nav = baseNavListItem(formMarketLink(marketId), icon, textId, anchorId, howManyNum, alwaysShow);
    nav['onClickFunc'] = () => {
      const isScrolling = (mobileLayout || isSearch) && !singleSections.includes(anchorId);
      openSubSection(anchorId, !isScrolling);
      if (isScrolling) {
        navigate(history, nav.target, false)
      }
    };
    if (isBold) {
      nav['isBold'] = true;
    }
    return nav;
  }
  const sortedRoots = getSortedRoots(notTodoComments, searchResults);
  const questions = sortedRoots.filter((comment) => comment.comment_type === QUESTION_TYPE);
  const suggestions = sortedRoots.filter((comment) => comment.comment_type === SUGGEST_CHANGE_TYPE);
  const reports = sortedRoots.filter((comment) => comment.comment_type === REPORT_TYPE);
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
  const navListItemTextArrayBeg = [
    {icon: Inbox, text: intl.formatMessage({ id: 'returnInbox' }), target: getInboxTarget(messagesState),
      newPage: true},
    createNavListItem(AddIcon, 'dialogAddParticipantsLabel', 'addCollaboratorSection',
      undefined, false, isSectionBold('addCollaboratorSection'), !_.isEmpty(search)),
    createNavListItem(QuestionIcon, 'planningDialogNavDiscussionLabel', 'workspaceMain',
      _.isEmpty(search) ? undefined :
        (results.find((result) => result.id === marketId) ? 1 : 0) + _.size(questions) + _.size(suggestions)
        + _.size(reports),
      true, isSectionBold('workspaceMain'), !_.isEmpty(search)),
    createNavListItem(AddIcon, 'addStoryLabel', 'addStorySection',
      undefined, false, isSectionBold('addStorySection'), !_.isEmpty(search))
  ];
  const navListItemTextArray = navListItemTextArrayBeg.concat([
    createNavListItem(AssignmentIcon, 'planningDialogNavStoriesLabel', 'storiesSection',
      _.size(requiresInputInvestibles) + _.size(blockedInvestibles) + _.size(swimlaneInvestibles)
      + _.size(furtherWorkReadyToStart) + _.size(furtherWorkInvestibles),
      true, isSectionBold('storiesSection'), !_.isEmpty(search)),
    createNavListItem(ListAltIcon, 'todoSection', 'marketTodos', _.size(todoComments),
      _.isEmpty(search), isSectionBold('marketTodos'), !_.isEmpty(search)),
    {
      icon: MenuBookIcon, text: intl.formatMessage({ id: 'planningDialogViewArchivesLabel' }),
      target: archivedSize > 0 ? formMarketArchivesLink(groupId) : undefined,
      num: _.isEmpty(search) ? undefined : archivedSize, newPage: true
    }
  ]);
  if (!mobileLayout) {
    navListItemTextArray.push(createNavListItem(SettingsIcon, 'settings', 'settingsSection',
      undefined, false, isSectionBold('settingsSection'), !_.isEmpty(search)));
  }
  const navigationMenu = { navListItemTextArray }
  const furtherWorkReadyToStartChip = furtherWorkReadyToStart.length > 0
    && <Chip label={`${furtherWorkReadyToStart.length}`} color="primary" size='small'
             className={classes.chipStyleYellow} />;
  const furtherWorkNotReadyToStartChip = furtherWorkInvestibles.length > 0 &&
    <Chip label={`${furtherWorkInvestibles.length}`} size='small' className={classes.chipStyleBlue} />;

  const planningInvestibleAddClasses = usePlanFormStyles();
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
      title={groupName}
      hidden={hidden}
      tabTitle={groupName}
      breadCrumbs={breadCrumbs}
      banner={banner}
      navigationOptions={banner ? [] : navigationMenu}
    >
      <UclusionTour
        name={INVITED_USER_WORKSPACE}
        hidden={hidden || mobileLayout || banner}
        steps={workspaceInvitedUserSteps({name: myPresence.name, isCreator: createdBy === myPresence.id})}
      />
      {isSectionOpen('workspaceMain') && (
        <div id="workspaceMain">
          <h2>
            <FormattedMessage id="planningDialogNavDiscussionLabel" />
          </h2>
          {(_.isEmpty(search) || results.find((item) => item.id === marketId)) && (
            <Summary group={group} hidden={hidden} pageState={pageState} updatePageState={updatePageState}
                     pageStateReset={pageStateReset}/>
          )}
          <Grid item id="commentAddArea" xs={12} style={{marginTop: '2rem'}}>
            <DismissableText textId="workspaceCommentHelp" text={
              <div>
                <Link href="https://documentation.uclusion.com/structured-comments" target="_blank">Comments</Link> can
                be used at the channel level and later moved to a job.
              </div>
            }/>
            {_.isEmpty(search) && marketId && !hidden && (
              <CommentAddBox
                groupId={groupId}
                allowedTypes={allowedCommentTypes}
                marketId={marketId}
              />
            )}
            <CommentBox comments={notTodoComments} marketId={marketId} allowedTypes={allowedCommentTypes}/>
          </Grid>
        </div>
      )}
      <div id="addCollaboratorSection">
        {!hidden && marketId && isSectionOpen('addCollaboratorSection') && _.isEmpty(search) && (
          <DialogManage marketId={marketId} group={group} />
        )}
      </div>
      <div id="addStorySection">
        {!hidden && marketId && isSectionOpen('addStorySection') && _.isEmpty(search) && (
          <PlanningInvestibleAdd
            marketId={marketId}
            groupId={groupId}
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
        {isSectionOpen('storiesSection') && (
          <div id="storiesSection">
            <h2>
              <FormattedMessage id="planningDialogNavStoriesLabel" />
            </h2>
            <DismissableText textId="notificationHelp" text={
              <div>
                Uclusion will generate all <Link href="https://documentation.uclusion.com/notifications" target="_blank">notifications</Link> necessary
                to keep the status in these <Link href="https://documentation.uclusion.com/channels/swimlanes" target="_blank">swimlanes</Link> up to date.
              </div>
            }/>
            {!_.isEmpty(blockedInvestibles) && (
              <SubSection
                type={SECTION_TYPE_SECONDARY_WARNING}
                titleIcon={blockedInvestibles.length > 0 ? <Chip label={`${blockedInvestibles.length}`}
                                                                 color="primary"
                                                                 size='small'
                                                                 className={classes.chipStyle} /> : undefined}
                title={intl.formatMessage({ id: 'blockedHeader' })}
                helpLink='https://documentation.uclusion.com/channels/jobs/stages/#blocked'
                id="blocked"
              >
                <ArchiveInvestbiles
                  elevation={0}
                  group={group}
                  presenceMap={getPresenceMap(marketPresences)}
                  investibles={blockedInvestibles}
                  presenceId={myPresence.id}
                  stage={inBlockingStage}
                  marketId={marketId}
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
                helpLink='https://documentation.uclusion.com/channels/jobs/stages/#requires-input'
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
            <SubSection
              type={SECTION_SUB_HEADER}
              isBlackText
              helpLink='https://documentation.uclusion.com/channels/swimlanes'
              id="swimLanes"
              title={intl.formatMessage({ id: 'swimLanes' })}
            >
              <InvestiblesByPerson
                comments={comments}
                investibles={investibles}
                visibleStages={visibleStages}
                acceptedStage={acceptedStage}
                inDialogStage={inDialogStage}
                inBlockingStage={inBlockingStage}
                inReviewStage={inReviewStage}
                inVerifiedStage={inVerifiedStage}
                requiresInputStage={requiresInputStage}
                group={group}
                isAdmin={isAdmin}
                mobileLayout={mobileLayout}
                pageState={pageState} updatePageState={updatePageState}
              />
            </SubSection>
            <SubSection
              type={SECTION_SUB_HEADER}
              isBlackText
              helpLink='https://documentation.uclusion.com/channels/jobs/stages/#further-work'
              id="furtherWork"
              title={intl.formatMessage({ id: 'readyFurtherWorkHeader' })}
            >
              {furtherWorkType === 'readyToStart' && (
                <PlanningInvestibleAdd
                  marketId={marketId}
                  groupId={groupId}
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
                  groupId={groupId}
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
        )}
        <MarketTodos comments={unResolvedMarketComments} marketId={marketId} groupId={groupId}
                     sectionOpen={isSectionOpen('marketTodos')}
                     setSectionOpen={setSectionOpen} group={group} userId={myPresence.id}/>
      </LocalPlanningDragContext.Provider>
      <Grid container spacing={2} id="settingsSection">
        {!hidden && !_.isEmpty(acceptedStage) && !_.isEmpty(inVerifiedStage) &&
          isSectionOpen('settingsSection') && _.isEmpty(search) && !mobileLayout && (
            <>
              <h2 style={{paddingLeft: '3rem'}}>
                <FormattedMessage id="settings" />
              </h2>
              <PlanningDialogEdit
                group={group}
                userId={myPresence.id}
                onCancel={() => openSubSection('workspaceMain')}
                acceptedStage={acceptedStage}
                verifiedStage={inVerifiedStage}
              />
            </>
        )}
      </Grid>
    </Screen>
  );
}

PlanningDialog.propTypes = {
  marketId: PropTypes.string.isRequired,
  marketInvestibles: PropTypes.arrayOf(PropTypes.object),
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
      titleContainer: {
        width: 'auto',
        display: 'flex',
        alignItems: 'center',
        marginBottom: '1rem'
      },
      title: {
        marginLeft: '1rem'
      }
    };
  },
  { name: "InvestiblesByPerson" }
);

function checkInvestibleWarning(investibles, myPresence, warningFunction) {
  const warnHash = {};
  if (!myPresence.id) {
    return warnHash;
  }
  investibles.forEach((fullInvestible) => {
    const { investible } = fullInvestible;
    const { id } = investible;
    if (warningFunction(id)) {
      warnHash[id] = true;
    }
  });
  return warnHash;
}

export function checkInProgressWarning(investibles, myPresence, messagesState) {
  return checkInvestibleWarning(investibles, myPresence,
    (id) => findMessageOfTypeAndId(id, messagesState, 'REPORT')
      || findMessageOfType('REPORT_REQUIRED', id, messagesState));
}

export function checkInApprovalWarning(investibles, myPresence, messagesState) {
  return checkInvestibleWarning(investibles, myPresence,
    (id) => findMessageOfType('NOT_FULLY_VOTED', id, messagesState));
}

export function checkInReviewWarning(investibles, myPresence, messagesState) {
  return checkInvestibleWarning(investibles, myPresence,
    (id) => findMessageOfType('REPORT_REQUIRED', id, messagesState));
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
    visibleStages,
    acceptedStage,
    inDialogStage,
    inBlockingStage,
    inReviewStage,
    requiresInputStage,
    inVerifiedStage,
    group,
    isAdmin,
    mobileLayout,
    pageState, updatePageState
  } = props;
  const intl = useIntl();
  const history = useHistory();
  const metaClasses = useMetaDataStyles();
  const classes = useInvestiblesByPersonStyles();
  const planningInvestibleAddClasses = usePlanFormStyles();
  const { storyAssignee } = pageState;
  const { created_at: createdAt, budget_unit: budgetUnit, use_budget: useBudget, votes_required: votesRequired,
    market_id: marketId} = group;
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const presences = getMarketPresences(marketPresencesState, marketId) || [];
  const marketPresencesSortedAlmost = _.sortBy(presences, 'name');
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
    const myInvestibles = getUserInvestibles(
      id,
      marketId,
      investibles,
      visibleStages
    );

    const myInvestiblesStageHash = getUserSwimlaneInvestiblesHash(myInvestibles, visibleStages, marketId);

    function onInvestibleSave(investible) {
      addInvestible(investiblesDispatch, diffDispatch, investible);
    }
    function onDone(destinationLink) {
      if (destinationLink) {
        navigate(history, destinationLink);
      }
    }
    const myClassName = showAsPlaceholder ? metaClasses.archivedColor : metaClasses.normalColor;
    const { mentioned_notifications: mentions, approve_notifications: approvals, review_notifications: reviews }
      = presence || {};
    if (_.isEmpty(myInvestiblesStageHash) && _.isEmpty(mentions) && _.isEmpty(approvals) && _.isEmpty(reviews)) {
      return <React.Fragment />
    }
    return (
      <React.Fragment key={`fragsl${id}`}>
        {storyAssignee === id && (
          <PlanningInvestibleAdd
            marketId={marketId}
            groupId={group.id}
            onCancel={() => updatePageState({storyAssignee: undefined})}
            onSave={onInvestibleSave}
            onSpinComplete={(destinationLink) => {
              updatePageState({storyAssignee: undefined});
              onDone(destinationLink);
            }}
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
                  <NotificationCountChips id={id} presence={presence || {}} />
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
                  myInvestiblesStageHash={myInvestiblesStageHash}
                  allInvestibles={investibles}
                  marketId={marketId}
                  acceptedStage={acceptedStage}
                  inDialogStageId={inDialogStage.id}
                  inReviewStageId={inReviewStage.id}
                  inBlockingStageId={inBlockingStage.id}
                  inRequiresInputStageId={requiresInputStage.id}
                  inVerifiedStageId={inVerifiedStage.id}
                  comments={comments}
                  presenceId={presence.id}
                />
              )}
          </CardContent>
        </Card>
      </React.Fragment>
    );
  });
}

export default PlanningDialog;
