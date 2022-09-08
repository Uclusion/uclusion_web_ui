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
  useMediaQuery,
  useTheme,
  Link
} from '@material-ui/core'
import Summary from './Summary'
import { usePlanningIdStyles } from './PlanningIdeas'
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
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext'
import {
  getMarketPresences,
  getPresenceMap
} from '../../../contexts/MarketPresencesContext/marketPresencesHelper'
import DismissableText from '../../../components/Notifications/DismissableText'
import ArchiveInvestbiles from '../../DialogArchives/ArchiveInvestibles'
import { addInvestible, getInvestiblesInStage } from '../../../contexts/InvestibesContext/investiblesContextHelper'
import UclusionTour from '../../../components/Tours/UclusionTour'
import { INVITED_USER_WORKSPACE } from '../../../contexts/TourContext/tourContextHelper';
import { getMarketInfo } from '../../../utils/userFunctions'
import MarketTodos from './MarketTodos'
import {
  isAcceptedStage,
  isBlockedStage,
  isFurtherWorkStage,
  isInReviewStage, isRequiredInputStage
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper'
import AddIcon from '@material-ui/icons/Add'
import { workspaceInvitedUserSteps } from '../../../components/Tours/InviteTours/workspaceInvitedUser';
import ListAltIcon from '@material-ui/icons/ListAlt'
import QuestionIcon from '@material-ui/icons/ContactSupport'
import MenuBookIcon from '@material-ui/icons/MenuBook'
import { getThreadIds } from '../../../utils/commentFunctions'
import { SearchResultsContext } from '../../../contexts/SearchResultsContext/SearchResultsContext'
import { getPageReducerPage, usePageStateReducer } from '../../../components/PageState/pageStateHooks'
import DialogManage from '../DialogManage'
import SettingsIcon from '@material-ui/icons/Settings'
import PlanningDialogEdit from './PlanningDialogEdit'
import PlanningInvestibleAdd from './PlanningInvestibleAdd'
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'
import { DiffContext } from '../../../contexts/DiffContext/DiffContext'
import { usePlanFormStyles } from '../../../components/AgilePlan'
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext'
import AssignmentIcon from '@material-ui/icons/Assignment'
import queryString from 'query-string'
import { MarketGroupsContext } from '../../../contexts/MarketGroupsContext/MarketGroupsContext'
import { getGroup } from '../../../contexts/MarketGroupsContext/marketGroupsContextHelper'
import { GmailTabItem, GmailTabs } from '../../../containers/Tab/Inbox'
import { isEveryoneGroup } from '../../../contexts/GroupMembersContext/groupMembersHelper'
import { AssignmentInd, Info } from '@material-ui/icons'
import Backlog from './Backlog'
import InvestiblesByPerson from './InvestiblesByPerson'

export const LocalPlanningDragContext = React.createContext([]);

function getAnchorId(tabIndex) {
  switch (tabIndex) {
    case 0:
      return 'storiesSection';
    case 1:
      return 'backlogSection';
    case 2:
      return 'marketTodos'
    default:
      return 'workspaceMain';
  }
}

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
  const swimClasses = usePlanningIdStyles();
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
  const allowedCommentTypes = [QUESTION_TYPE, SUGGEST_CHANGE_TYPE];
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [messagesState] = useContext(NotificationsContext);
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [, diffDispatch] = useContext(DiffContext);
  // For security reasons you can't access source data while being dragged in case you are not the target website
  const [beingDraggedHack, setBeingDraggedHack] = useState({});
  const [pageStateFull, pageDispatch] = usePageStateReducer('group');
  const [pageState, updatePageState, pageStateReset] = getPageReducerPage(pageStateFull, pageDispatch, groupId,
    {sectionOpen: 'storiesSection', tabIndex: 0 });
  const {
    sectionOpen,
    furtherWorkType,
    tabIndex
  } = pageState;
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
  const blockedOrRequiresInputInvestibles = blockedInvestibles.concat(requiresInputInvestibles);
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
      (!sectionOpen && section === 'storiesSection');
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

  function openSubSection(subSection, doScroll=true) {
    updatePageState({sectionOpen: subSection});
    if (doScroll) {
      window.scrollTo(0, 0);
    }
  }

  function createNavListItem(icon, textId, anchorId, howManyNum, alwaysShow, isBold, isSearch) {
    const nav = baseNavListItem(formMarketLink(marketId, groupId), icon, textId, anchorId,
      isSearch ? howManyNum : undefined, alwaysShow);
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
  const navListItemTextArray = [
    createNavListItem(AddIcon, 'addStoryLabel', 'addStorySection',
      undefined, false, isSectionBold('addStorySection'), !_.isEmpty(search))
  ];
  if (!isEveryoneGroup(groupId, marketId)) {
    navListItemTextArray.push(createNavListItem(AddIcon, 'dialogAddParticipantsLabel',
      'addCollaboratorSection', undefined, false,
      isSectionBold('addCollaboratorSection'), !_.isEmpty(search)));
  }
  if (!mobileLayout) {
    navListItemTextArray.push(createNavListItem(SettingsIcon, 'settings', 'settingsSection',
      undefined, false, isSectionBold('settingsSection'), !_.isEmpty(search)));
  }

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

  const discussionSearchResults = (results.find((result) => result.id === marketId) ? 1 : 0) + _.size(questions)
                        + _.size(suggestions) + _.size(reports);
  const jobsSearchResults = _.size(requiresInputInvestibles) + _.size(blockedInvestibles) + _.size(swimlaneInvestibles);
  const backlogSearchResults = _.size(furtherWorkReadyToStart) + _.size(furtherWorkInvestibles);

  const isFromSideBarMenu = ['addStorySection', 'addCollaboratorSection', 'settingsSection'].includes(sectionOpen);
  function resetTabs() {
    updatePageState({sectionOpen: undefined, tabIndex: 0});
  }
  return (
    <Screen
      title={groupName}
      hidden={hidden}
      tabTitle={groupName}
      breadCrumbs={breadCrumbs}
      banner={banner}
      openMenuItems={navListItemTextArray}
    >
      <UclusionTour
        name={INVITED_USER_WORKSPACE}
        hidden={hidden || mobileLayout || banner}
        steps={workspaceInvitedUserSteps({name: myPresence.name, isCreator: createdBy === myPresence.id})}
      />
      {!isFromSideBarMenu && (
        <GmailTabs
          value={tabIndex}
          onChange={(event, value) => {
            updatePageState({tabIndex: value});
            if (value === 4) {
              navigate(history, formMarketArchivesLink(marketId, groupId));
            } else {
              const isSearch = !_.isEmpty(search);
              const anchorId = getAnchorId(value);
              const isScrolling = (mobileLayout || isSearch) && !singleSections.includes(anchorId);
              openSubSection(anchorId, !isScrolling);
              if (isScrolling) {
                navigate(history, `${formMarketLink(marketId, groupId)}#${anchorId}`);
              }
            }
          }}
          indicatorColors={['#00008B']}
          style={{ borderTop: '1px ridge lightgrey', paddingBottom: '0.25rem' }}>
          <GmailTabItem icon={<AssignmentInd />} label={intl.formatMessage({id: 'planningDialogNavStoriesLabel'})}
                        color='black'
                        tag={_.isEmpty(search) || jobsSearchResults === 0 ? undefined : `${jobsSearchResults}`} />
          <GmailTabItem icon={<AssignmentIcon />} label={intl.formatMessage({id: 'planningDialogBacklog'})}
                        color='black'
                        tag={_.isEmpty(search) || backlogSearchResults === 0 ? undefined : `${backlogSearchResults}`} />
          <GmailTabItem icon={<ListAltIcon />} label={intl.formatMessage({id: 'todoSection'})}
                        tag={_.isEmpty(search) || _.isEmpty(todoComments) ? undefined : `${_.size(todoComments)}` } />
          <GmailTabItem icon={<QuestionIcon />}
                        label={intl.formatMessage({id: 'planningDialogNavDiscussionLabel'})}
                        tag={_.isEmpty(search) || discussionSearchResults === 0 ? undefined :
                          `${discussionSearchResults}`} />
          <GmailTabItem icon={<MenuBookIcon />}
                        label={intl.formatMessage({id: 'planningDialogViewArchivesLabel'})}
                        tag={_.isEmpty(search) ? undefined : `${archivedSize}`} />
        </GmailTabs>
      )}
      {isSectionOpen('workspaceMain') && (
        <div id="workspaceMain">
          {(_.isEmpty(search) || results.find((item) => item.id === marketId)) && (
            <Summary group={group} hidden={hidden} pageState={pageState} updatePageState={updatePageState}
                     pageStateReset={pageStateReset}/>
          )}
          <Grid item id="commentAddArea" xs={12} style={{marginTop: '2rem'}}>
            <DismissableText textId="workspaceCommentHelp" text={
              <div>
                <Link href="https://documentation.uclusion.com/structured-comments" target="_blank">Comments</Link> can
                be used at the workspace level and later moved to a job.
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
            onCancel={() => resetTabs()}
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
            <DismissableText textId="notificationHelp" text={
              <div>
                Uclusion will generate all <Link href="https://documentation.uclusion.com/notifications" target="_blank">notifications</Link> necessary
                to keep the status in these <Link href="https://documentation.uclusion.com/channels/swimlanes" target="_blank">swimlanes</Link> up to date.
              </div>
            }/>
            {!_.isEmpty(requiresInputInvestibles) && (
              <ArchiveInvestbiles
                comments={comments}
                elevation={0}
                marketId={marketId}
                presenceMap={presenceMap}
                investibles={blockedOrRequiresInputInvestibles}
                highlightMap={highlightMap}
                presenceId={myPresence.id}
                allowDragDrop
              />
            )}
            {!_.isEmpty(requiresInputInvestibles) && (<div style={{ paddingBottom: '2rem' }}/>)}
            <dl className={swimClasses.stages} style={{background: theme.palette.grey['100']}}>
              <div>
                <FormattedMessage id="planningVotingStageLabel" />
                {!mobileLayout && (
                  <Link href="https://documentation.uclusion.com/channels/jobs/stages/#ready-for-approval" target="_blank">
                    <Info style={{height: '1.1rem'}} />
                  </Link>
                )}
              </div>
              <div>
                <FormattedMessage id='planningAcceptedStageLabel' />
                {!mobileLayout && (
                  <Link href="https://documentation.uclusion.com/channels/jobs/stages/#started"
                        target="_blank">
                    <Info style={{height: '1.1rem'}} />
                  </Link>
                )}
              </div>
              <div>
                <FormattedMessage id="planningReviewStageLabel"/>
                {!mobileLayout && (
                  <Link href="https://documentation.uclusion.com/channels/jobs/stages/#ready-for-feedback" target="_blank">
                    <Info style={{height: '1.1rem'}} />
                  </Link>
                )}
              </div>
              <div>
                <FormattedMessage id="verifiedBlockedStageLabel"/>
                {!mobileLayout && (
                  <Link href="https://documentation.uclusion.com/channels/jobs/stages/#verified-and-not-doing"
                        target="_blank">
                    <Info style={{height: '1.1rem'}} />
                  </Link>
                )}
              </div>
            </dl>
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
          </div>
        )}
        {isSectionOpen('backlogSection') && (
          <div id="backlogSection">
            <Backlog furtherWorkType={furtherWorkType} group={group} updatePageState={updatePageState}
                     onInvestibleSave={onInvestibleSave} onDone={onDone} marketPresences={marketPresences}
                     furtherWorkReadyToStart={furtherWorkReadyToStart} furtherWorkInvestibles={furtherWorkInvestibles}
                     isAdmin={isAdmin} comments={comments} presenceMap={presenceMap}
                     furtherWorkStage={furtherWorkStage} myPresence={myPresence} />
          </div>
        )}
        <MarketTodos comments={unResolvedMarketComments} marketId={marketId} groupId={groupId}
                     sectionOpen={isSectionOpen('marketTodos')}
                     setSectionOpen={() => {
                       updatePageState({sectionOpen: 'marketTodos', tabIndex: 1});
                     }} group={group} userId={myPresence.id}/>
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
                onCancel={() => resetTabs()}
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

export default PlanningDialog;
