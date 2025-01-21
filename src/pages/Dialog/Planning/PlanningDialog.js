/**
 * A component that renders a single group's view of a planning market
 */
import React, { useContext, useEffect, useRef } from 'react';
import { useHistory, useLocation } from 'react-router';
import { FormattedMessage, useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { Grid, Link, useMediaQuery, useTheme } from '@material-ui/core';
import Screen from '../../../containers/Screen/Screen';
import {
  QUESTION_TYPE,
  REPLY_TYPE,
  REPORT_TYPE,
  SUGGEST_CHANGE_TYPE,
  TODO_TYPE
} from '../../../constants/comments';
import CommentBox, { getSortedRoots } from '../../../containers/CommentBox/CommentBox';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import {
  getMarketPresences,
  getPresenceMap,
  isSingleUserMarket
} from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import DismissableText from '../../../components/Notifications/DismissableText';
import ArchiveInvestbiles from '../../DialogArchives/ArchiveInvestibles';
import { getInvestible, getInvestiblesInStage } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { getMarketInfo } from '../../../utils/userFunctions';
import MarketTodos from './MarketTodos';
import {
  getFullStage,
  isAcceptedStage,
  isBlockedStage,
  isFurtherWorkStage,
  isInReviewStage,
  isRequiredInputStage
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import QuestionIcon from '@material-ui/icons/ContactSupport';
import { SearchResultsContext } from '../../../contexts/SearchResultsContext/SearchResultsContext';
import { getPageReducerPage, usePageStateReducer } from '../../../components/PageState/pageStateHooks';
import AssignmentIcon from '@material-ui/icons/Assignment';
import { MarketGroupsContext } from '../../../contexts/MarketGroupsContext/MarketGroupsContext';
import { getGroup } from '../../../contexts/MarketGroupsContext/marketGroupsContextHelper';
import { GmailTabItem, GmailTabs } from '../../../containers/Tab/Inbox';
import { AssignmentInd, BugReport } from '@material-ui/icons';
import Backlog from './Backlog';
import InvestiblesByPerson from './InvestiblesByPerson';
import { SECTION_TYPE_SECONDARY_WARNING } from '../../../constants/global';
import SubSection from '../../../containers/SubSection/SubSection';
import { filterToRoot } from '../../../contexts/CommentsContext/commentsContextHelper';
import {
  ASSIGNED_HASH,
  BACKLOG_HASH,
  DISCUSSION_HASH,
  formArchiveCommentLink,
  formGroupArchiveLink,
  formGroupEditLink,
  formMarketAddCommentLink, formMarketAddInvestibleLink, formWizardLink,
  navigate
} from '../../../utils/marketIdPathFunctions';
import { isEveryoneGroup } from '../../../contexts/GroupMembersContext/groupMembersHelper';
import { DISCUSSION_WIZARD_TYPE, JOB_STAGE_WIZARD_TYPE } from '../../../constants/markets';
import DialogOutset from './DialogOutset';
import SettingsIcon from '@material-ui/icons/Settings';
import MenuBookIcon from '@material-ui/icons/MenuBook';
import SpinningButton from '../../../components/SpinBlocking/SpinningButton';
import { wizardStyles } from '../../../components/AddNewWizards/WizardStylesContext';
import AddIcon from '@material-ui/icons/Add';
import { stageChangeInvestible } from '../../../api/investibles';
import { onInvestibleStageChange } from '../../../utils/investibleFunctions';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import SwimlanesOnboardingBanner from '../../../components/Banners/SwimlanesOnboardingBanner';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import { getMarket, marketIsDemo } from '../../../contexts/MarketsContext/marketsContextHelper';
import EditIcon from '@material-ui/icons/Edit';
import { hasDiscussionComment } from '../../../components/AddNewWizards/Discussion/AddCommentStep';
import { useHotkeys } from 'react-hotkeys-hook';
import { findMessagesForCommentIds, findMessagesForInvestibleIds } from '../../../utils/messageUtils';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { isInInbox } from '../../../contexts/NotificationsContext/notificationsContextHelper';
import { RED_LEVEL } from '../../../constants/notifications';

function getAnchorId(tabIndex) {
  switch (tabIndex) {
    case 0:
      return 'storiesSection';
    case 1:
      return 'backlogSection';
    case 2:
      return 'marketTodos'
    case 3:
      return 'discussionSection';
    default:
      return 'storiesSection';
  }
}

function PlanningDialog(props) {
  const {
    marketInvestibles,
    marketStages,
    comments,
    hidden,
    myPresence,
    banner,
    marketId,
    groupId
  } = props;
  const [searchResults] = useContext(SearchResultsContext);
  const { results, parentResults, search } = searchResults;
  const history = useHistory();
  const location = useLocation();
  const { hash } = location;
  const intl = useIntl();
  const wizardClasses = wizardStyles();
  const theme = useTheme();
  const refToTop = useRef();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('md'));
  const [investibleState, investiblesDispatch] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const [, marketPresencesDispatch] = useContext(MarketPresencesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [groupState] = useContext(MarketGroupsContext);
  const [marketsState] = useContext(MarketsContext);
  const [messagesState] = useContext(NotificationsContext);
  const market = getMarket(marketsState, marketId) || {};
  const group = getGroup(groupState, marketId, groupId);
  const { name: groupName } = group || {};
  const isAdmin = myPresence.is_admin;
  const unResolvedMarketComments = comments.filter(comment => !comment.investible_id && !comment.resolved) || [];
  // There is no link to a reply so including them should be okay
  const notTodoComments = unResolvedMarketComments.filter(comment =>
    [QUESTION_TYPE, SUGGEST_CHANGE_TYPE, REPORT_TYPE, REPLY_TYPE].includes(comment.comment_type)) || [];
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [pageStateFull, pageDispatch] = usePageStateReducer('group');
  const [pageState, updatePageState] = getPageReducerPage(pageStateFull, pageDispatch, groupId,
    {sectionOpen: 'storiesSection', tabIndex: 0 });
  const {
    sectionOpen,
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
    return stage && stage.appears_in_context && stage.allows_tasks;
  });
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
  const presenceMap = getPresenceMap(marketPresences);
  const isDemo = marketIsDemo(market);

  function isSectionOpen(section) {
    return sectionOpen === section || (!sectionOpen && section === 'storiesSection');
  }

  useHotkeys('ctrl+a', () => navigate(history, formMarketAddInvestibleLink(marketId, groupId)),
    {enabled: !hidden && (isSectionOpen('backlogSection')||isSectionOpen('storiesSection'))},
    [history, groupId, marketId]);
  useHotkeys('ctrl+q', () => navigate(history,
      formMarketAddCommentLink(DISCUSSION_WIZARD_TYPE, marketId, groupId, QUESTION_TYPE)),
    {enabled: !hidden}, [history, groupId, marketId]);
  useHotkeys('ctrl+alt+s', () => navigate(history,
      formMarketAddCommentLink(DISCUSSION_WIZARD_TYPE, marketId, groupId, SUGGEST_CHANGE_TYPE)),
    {enabled: !hidden}, [history, groupId, marketId]);

  useEffect(() => {
    if (hash && !hidden) {
      const element = document.getElementById(hash.substring(1, hash.length));
      if (!element) {
        if (hash.includes('option')||hash.includes(DISCUSSION_HASH)) {
          updatePageState({ sectionOpen: 'discussionSection', tabIndex: 3 });
        } else if (hash.includes(ASSIGNED_HASH)) {
          updatePageState({ sectionOpen: 'storiesSection', tabIndex: 0 });
        } else if (hash.includes(BACKLOG_HASH)) {
          updatePageState({ sectionOpen: 'backlogSection', tabIndex: 1 });
        } else {
          const found = comments.find((comment) => hash.includes(comment.id));
          if (!_.isEmpty(found)) {
            const rootComment = filterToRoot(comments, found.id);
            if (_.isEmpty(rootComment.investible_id)) {
              if (!rootComment.resolved) {
                if (rootComment.comment_type !== TODO_TYPE) {
                  // TO DO TYPE handled by MarketTodos so is no op here
                  updatePageState({ sectionOpen: 'discussionSection', tabIndex: 3 });
                }
              } else {
                // send over to the archives
                navigate(history, formArchiveCommentLink(marketId, groupId, found.id), true);
              }
            }
          }
        }
      }
    }
  }, [comments, groupId, hash, hidden, history, marketId, updatePageState]);

  function openSubSection(subSection) {
    updatePageState({sectionOpen: subSection});
  }

  const sortedRoots = getSortedRoots(notTodoComments, searchResults);
  const questionSuggestionComments = sortedRoots.filter((comment) =>
    [QUESTION_TYPE, SUGGEST_CHANGE_TYPE].includes(comment.comment_type));
  const todoComments = unResolvedMarketComments.filter((comment) => {
    if (_.isEmpty(search)) {
      return comment.comment_type === TODO_TYPE;
    }
    return comment.comment_type === TODO_TYPE && (results.find((item) => item.id === comment.id)
      || parentResults.find((id) => id === comment.id));
  });
  const criticalTodoComments = todoComments.filter((comment) => comment.notification_type === RED_LEVEL);
  const archiveInvestibles = investibles.filter((inv) => {
    const marketInfo = getMarketInfo(inv, marketId) || {};
    const stage = marketStages.find((stage) => stage.id === marketInfo.stage);
    const archived = stage && stage.close_comments_on_entrance;
    if (_.isEmpty(search)) {
      return archived;
    }
    return archived && (results.find((item) => item.id === inv.investible.id)
      || parentResults.find((id) => id === inv.investible.id));
  });
  const resolvedMarketComments = comments.filter((comment) => {
    if (_.isEmpty(search)) {
      return !comment.investible_id && comment.resolved;
    }
    return !comment.investible_id && comment.resolved && (results.find((item) => item.id === comment.id)
      || parentResults.find((id) => id === comment.id));
  });
  const archivedSize = _.isEmpty(search) ? undefined :
    _.size(archiveInvestibles) + _.size(resolvedMarketComments);
  const jobsSearchResults = _.size(requiresInputInvestibles) + _.size(blockedInvestibles) + _.size(swimlaneInvestibles);
  const backlogSearchResults = _.size(furtherWorkReadyToStart) + _.size(furtherWorkInvestibles);
  const isSingleUser = isSingleUserMarket(marketPresences, market);
  let navListItemTextArray = undefined;
  if (mobileLayout) {
    navListItemTextArray = [
      {icon: SettingsIcon, text: intl.formatMessage({id: 'settings'}),
        target: formGroupEditLink(marketId, groupId), num: 0, isBold: false},
      {icon: MenuBookIcon, text: intl.formatMessage({id: 'planningDialogViewArchivesLabel'}),
        target: formGroupArchiveLink(marketId, groupId), num: archivedSize, isBold: false}
    ];
  }

  function resetFunction(tabIndex) {
    updatePageState({tabIndex});
    const anchorId = getAnchorId(tabIndex);
    openSubSection(anchorId);
    refToTop.current?.scrollIntoView({ block: "end" });
  }

  function onDropBug(id, isAssigned) {
    let bugBaseUrl = `${formMarketAddInvestibleLink(marketId, groupId)}&fromCommentId=${id}&isAssigned=${isAssigned}`;
    if (!isAssigned) {
      bugBaseUrl += "&jobType=0";
    }
    navigate(history, bugBaseUrl);
  }

  function onDropJob(id, isAssigned) {
    if (isAssigned) {
      if (isSingleUser) {
        const presence = marketPresences.find((presence) => !presence.market_banned);
        const inv = getInvestible(investibleState, id);
        const marketInfo = getMarketInfo(inv, marketId) || {};
        if (marketInfo.stage !== acceptedStage.id) {
          const moveInfo = {
            marketId,
            investibleId: id,
            stageInfo: {
              current_stage_id: marketInfo.stage,
              stage_id: acceptedStage.id,
              assignments: [presence.id]
            },
          };
          setOperationRunning(true);
          return stageChangeInvestible(moveInfo)
            .then((newInv) => {
              onInvestibleStageChange(furtherWorkStage.id, newInv, id, marketId, commentsState,
                commentsDispatch, investiblesDispatch, () => {}, marketStagesState, undefined,
                getFullStage(marketStagesState, marketId, marketInfo.stage), marketPresencesDispatch);
              setOperationRunning(false);
            });
        }
      } else {
        navigate(history, `${formWizardLink(JOB_STAGE_WIZARD_TYPE, marketId, id)}&isAssign=${isAssigned}`);
      }
    } else {
      const inv = getInvestible(investibleState, id);
      const marketInfo = getMarketInfo(inv, marketId) || {};
      if (marketInfo.stage !== furtherWorkStage.id) {
        const moveInfo = {
          marketId,
          investibleId: id,
          stageInfo: {
            current_stage_id: marketInfo.stage,
            stage_id: furtherWorkStage.id,
          },
        };
        const isBlocked = marketInfo.stage === inBlockingStage.id;
        setOperationRunning(true);
        return stageChangeInvestible(moveInfo)
          .then((newInv) => {
            onInvestibleStageChange(furtherWorkStage.id, newInv, id, marketId, commentsState,
              commentsDispatch, investiblesDispatch, () => {}, marketStagesState, undefined,
              getFullStage(marketStagesState, marketId, marketInfo.stage), marketPresencesDispatch);
            setOperationRunning(false);
            if (!isBlocked) {
              navigate(history, `${formWizardLink(JOB_STAGE_WIZARD_TYPE, marketId, id)}&stageId=${furtherWorkStage.id}&isAssign=${isAssigned}`);
            }
          });
      }
    }
  }

  function onDropAssigned(event) {
    const id = event.dataTransfer.getData('text');
    const notificationType = event.dataTransfer.getData('notificationType');
    if (notificationType) {
      onDropBug(id, true);
    } else {
      onDropJob(id, true);
    }
  }

  function onDropBacklog(event) {
    const id = event.dataTransfer.getData('text');
    const notificationType = event.dataTransfer.getData('notificationType');
    if (notificationType) {
      onDropBug(id, false);
    } else {
      onDropJob(id, false);
    }
  }
  const groupIsEveryone = isEveryoneGroup(groupId, marketId);
  const tabName = groupIsEveryone ? market?.name : groupName;
  const tabTitle = `${tabName} ${intl.formatMessage({id: 'tabGroupAppend'})}`;
  const swimlaneEmptyPreText = _.isEmpty(blockedOrRequiresInputInvestibles) ? 'There are no assigned jobs.' :
  'All assigned jobs require assistance.';
  function getTabCount(tabIndex) {
    if (!_.isEmpty(search)) {
      return undefined;
    }
    if (tabIndex === 0) {
      let investibleIds = (blockedOrRequiresInputInvestibles || []).map((investible)=>investible.investible.id);
      investibleIds = investibleIds.concat((swimlaneInvestibles||[]).map((investible)=>investible.investible.id));
      const numNewMessagesRaw = findMessagesForInvestibleIds(investibleIds, messagesState, true)||[];
      const numNewMessages = numNewMessagesRaw.filter((message) => isInInbox(message));
      if (!_.isEmpty(numNewMessages)) {
        return `${_.size(numNewMessages)}`;
      }
    }
    if (tabIndex === 1) {
      let investibleIds = (furtherWorkReadyToStart || []).map((investible)=>investible.investible.id);
      investibleIds = investibleIds.concat((furtherWorkInvestibles||[]).map((investible)=>investible.investible.id));
      const numNewMessagesRaw = findMessagesForInvestibleIds(investibleIds, messagesState, true)||[];
      const numNewMessages = numNewMessagesRaw.filter((message) => isInInbox(message));
      if (!_.isEmpty(numNewMessages)) {
        return `${_.size(numNewMessages)}`;
      }
    }
    if (tabIndex === 2) {
      const commentIds = (todoComments ||[]).map((comment) => comment.id);
      const numNewMessagesRaw = findMessagesForCommentIds(commentIds, messagesState, !isSingleUser);
      const numNewMessages = numNewMessagesRaw.filter((message) => isInInbox(message));
      if (!_.isEmpty(numNewMessages)) {
        return isSingleUser ? `${_.size(criticalTodoComments)}` : `${_.size(numNewMessages)}`;
      }
    }
    if (tabIndex === 3) {
      const commentIds = (questionSuggestionComments ||[]).map((comment) => comment.id);
      const numNewMessagesRaw = findMessagesForCommentIds(commentIds, messagesState, true);
      const numNewMessages = numNewMessagesRaw.filter((message) => isInInbox(message));
      if (!_.isEmpty(numNewMessages)) {
        return `${_.size(numNewMessages)}`;
      }
    }
    return undefined;
  }
  function getTagLabel(tabCount, tabIndex) {
    if (tabCount) {
      if (isSingleUser && tabIndex === 2) {
        return intl.formatMessage({ id: 'immediateLower' });
      }
      return intl.formatMessage({ id: 'new' });
    }
    return undefined;
  }
  const tabCount0 = getTabCount(0);
  const tabCount1 = getTabCount(1);
  const tabCount2 = getTabCount(2);
  const tabCount3 = getTabCount(3);
  return (
    <Screen
      title={groupName}
      hidden={hidden}
      tabTitle={tabTitle}
      banner={banner}
      showBanner={banner != null}
      openMenuItems={navListItemTextArray}
      navigationOptions={{useHoverFunctions: !mobileLayout, resetFunction: () => resetFunction(0)}}
    >
      <div style={{ paddingBottom: '0.25rem', paddingLeft: 0, marginLeft: '-0.5rem' }}>
        <SwimlanesOnboardingBanner group={group} sectionOpen={sectionOpen} isDemo={isDemo} isSingleUser={isSingleUser}/>
        <GmailTabs
          value={tabIndex}
          id='dialog-header'
          onChange={(event, value) => {
            resetFunction(value);
          }}
          indicatorColors={['#00008B', '#00008B', '#00008B', '#00008B']}>
          <GmailTabItem icon={<AssignmentInd />} onDrop={onDropAssigned} tagLabel={getTagLabel(tabCount0)}
                        onDragOver={(event)=>event.preventDefault()} toolTipId='assignedJobsToolTip' tagColor='#E85757'
                        label={intl.formatMessage({id: 'planningDialogNavStoriesLabel'})}
                        tag={_.isEmpty(search) || jobsSearchResults === 0 ? tabCount0 : `${jobsSearchResults}`} />
          <GmailTabItem icon={<AssignmentIcon />} onDrop={onDropBacklog} tagLabel={getTagLabel(tabCount1)}
                        onDragOver={(event)=>event.preventDefault()} toolTipId='backlogJobsToolTip' tagColor='#E85757'
                        label={intl.formatMessage({id: 'planningDialogBacklog'})}
                        tag={_.isEmpty(search) || backlogSearchResults === 0 ? tabCount1 : `${backlogSearchResults}`} />
          <GmailTabItem icon={<BugReport />} label={intl.formatMessage({id: 'todoSection'})}
                        toolTipId='bugsToolTip' tagLabel={getTagLabel(tabCount2, 2)} tagColor='#E85757'
                        tag={_.isEmpty(search) || _.isEmpty(todoComments) ? tabCount2 : `${_.size(todoComments)}` } />
          <GmailTabItem icon={<QuestionIcon />} toolTipId='discussionToolTip' tagLabel={getTagLabel(tabCount3)}
                        label={intl.formatMessage({id: 'planningDialogDiscussionLabel'})} tagColor='#E85757'
                        tag={_.isEmpty(search) || _.isEmpty(questionSuggestionComments) ? tabCount3 :
                          `${_.size(questionSuggestionComments)}`} />
        </GmailTabs>
      </div>
      <div style={{display: 'flex', overflow: 'hidden'}}>
        <DialogOutset marketPresences={marketPresences} marketId={marketId} groupId={groupId} hidden={hidden}
                      archivedSize={archivedSize} />
      <div style={{paddingTop: '1rem', width: '96%', marginLeft: 'auto', marginRight: 'auto', overflow: 'hidden'}}>
        <div ref={refToTop}></div>
        {isSectionOpen('discussionSection') && (
          <div id="discussionSection">
            <Grid item id="discussionAddArea" xs={12}>
              {_.isEmpty(search) && marketId && !hidden && (
                <>
                  <div style={{display: 'flex', marginBottom: '1.5rem', marginLeft: '0.5rem'}}>
                    <SpinningButton id="newMarketQuestion"
                                    icon={hasDiscussionComment(groupId, QUESTION_TYPE) ? EditIcon : AddIcon}
                                    iconColor="black"
                                    className={wizardClasses.actionNext}
                                    style={{display: "flex", marginTop: '1rem',
                                      marginRight: mobileLayout ? undefined : '2rem'}}
                                    variant="text" doSpin={false} toolTipId='hotKeyQUESTION'
                                    onClick={() => navigate(history,
                                      formMarketAddCommentLink(DISCUSSION_WIZARD_TYPE, marketId, groupId,
                                        QUESTION_TYPE))}>
                      <FormattedMessage id='createQuestion'/>
                    </SpinningButton>
                    <SpinningButton id="createSuggestion"
                                    icon={hasDiscussionComment(groupId, SUGGEST_CHANGE_TYPE) ? EditIcon : AddIcon}
                                    iconColor="black"
                                    className={wizardClasses.actionNext}
                                    style={{display: "flex", marginTop: '1rem'}}
                                    variant="text" doSpin={false} toolTipId='hotKeySUGGEST'
                                    onClick={() => navigate(history,
                                      formMarketAddCommentLink(DISCUSSION_WIZARD_TYPE, marketId, groupId,
                                        SUGGEST_CHANGE_TYPE))}>
                      <FormattedMessage id='createSuggestion'/>
                    </SpinningButton>
                  </div>
                  <DismissableText textId="workspaceCommentHelp" display={_.isEmpty(questionSuggestionComments)} noPad
                                   text={
                    <div>
                      <Link href="https://documentation.uclusion.com/structured-comments" target="_blank">Questions and suggestions</Link> can
                      be used at the view level and later moved to a job.
                    </div>
                  }/>
                </>
              )}
              <CommentBox
                comments={notTodoComments.filter((comment) =>
                  [QUESTION_TYPE, SUGGEST_CHANGE_TYPE, REPLY_TYPE].includes(comment.comment_type))}
                marketId={marketId} />
            </Grid>
          </div>
        )}
        {isSectionOpen('storiesSection') && (
          <div id="storiesSection" style={{overflowX: 'hidden', marginTop: '0.5rem'}}>
              <SubSection
                type={SECTION_TYPE_SECONDARY_WARNING}
                bolder
                title={intl.formatMessage({ id: 'blockedHeader' })}
                helpLink='https://documentation.uclusion.com/views/jobs/stages/#assistance'
                id="blocked"
              >
                <DismissableText textId="assistanceHelp"
                                 display={_.isEmpty(blockedOrRequiresInputInvestibles)}
                                 text={
                                       <div>
                                         When there is a blocker or an assignee creates a question or suggestion the
                                         job moves here.
                                       </div>
                                 }/>
                {!_.isEmpty(blockedOrRequiresInputInvestibles) && (
                  <ArchiveInvestbiles
                    comments={comments}
                    marketId={marketId}
                    presenceMap={presenceMap}
                    investibles={blockedOrRequiresInputInvestibles}
                    allowDragDrop
                  />
                )}
              </SubSection>
              <div style={{ paddingBottom: '2rem' }}/>
            <InvestiblesByPerson
              comments={comments}
              investibles={investibles}
              visibleStages={visibleStages}
              acceptedStage={acceptedStage}
              inDialogStage={inDialogStage}
              inBlockingStage={inBlockingStage}
              inReviewStage={inReviewStage}
              requiresInputStage={requiresInputStage}
              group={group}
              isAdmin={isAdmin}
              mobileLayout={mobileLayout}
              pageState={pageState} updatePageState={updatePageState}
            />
            <DismissableText textId="notificationHelp"
                             display={_.isEmpty(swimlaneInvestibles)}
                             text={
                              groupIsEveryone ? (market?.market_sub_type === 'SUPPORT' ?
                                   <div>
                                     {swimlaneEmptyPreText} Use the "Add job" button above to assign a new job to
                                     support.
                                   </div>
                                   :
                                   <div>
                                     {swimlaneEmptyPreText} The "Add job" button above creates a job and
                                     notifies <Link href="https://documentation.uclusion.com/views/#everyone"
                                               target="_blank">everyone</Link>.
                                   </div>) :
                                 <div>
                                   {swimlaneEmptyPreText} The "Add job" button above creates a job
                                   and sends <Link href="https://documentation.uclusion.com/notifications"
                                             target="_blank">notifications</Link> to this group.
                                 </div>
                             }/>
          </div>
        )}
        {isSectionOpen('backlogSection') && (
          <div id="backlogSection" style={{overflowX: 'hidden', paddingBottom: '5rem'}}>
            <Backlog group={group} marketPresences={marketPresences}
                     furtherWorkReadyToStart={furtherWorkReadyToStart} furtherWorkInvestibles={furtherWorkInvestibles}
                     comments={comments} isSingleUser={isSingleUser} />
          </div>
        )}
        <MarketTodos comments={unResolvedMarketComments} marketId={marketId} groupId={groupId}
                     sectionOpen={isSectionOpen('marketTodos')}
                     hidden={hidden}
                     setSectionOpen={() => {
                       updatePageState({sectionOpen: 'marketTodos', tabIndex: 2});
                     }} group={group} />
      </div>
      </div>
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
