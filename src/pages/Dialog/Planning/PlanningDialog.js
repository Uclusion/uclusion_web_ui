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
import { QUESTION_TYPE, REPLY_TYPE, REPORT_TYPE, SUGGEST_CHANGE_TYPE, TODO_TYPE } from '../../../constants/comments';
import CommentBox, { getSortedRoots } from '../../../containers/CommentBox/CommentBox';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { getMarketPresences, getPresenceMap } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
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
  formArchiveCommentLink,
  formGroupArchiveLink,
  formGroupEditLink,
  formMarketAddCommentLink, formMarketAddInvestibleLink, formWizardLink,
  navigate
} from '../../../utils/marketIdPathFunctions';
import { WARNING_COLOR } from '../../../components/Buttons/ButtonConstants';
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
  function isSectionOpen(section) {
    return sectionOpen === section || (!sectionOpen && section === 'storiesSection');
  }

  useEffect(() => {
    if (hash && !hidden) {
      const element = document.getElementById(hash.substring(1, hash.length));
      if (!element) {
        if (hash.includes('option')) {
          updatePageState({ sectionOpen: 'discussionSection', tabIndex: 3 });
        } else {
          const found = comments.find((comment) => hash.includes(comment.id));
          if (!_.isEmpty(found)) {
            const rootComment = filterToRoot(comments, found.id);
            if (_.isEmpty(rootComment.investible_id)) {
              if (!rootComment.resolved) {
                if (rootComment.comment_type === TODO_TYPE) {
                  updatePageState({ sectionOpen: 'marketTodos', tabIndex: 2 });
                } else {
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
      navigate(history, `${formWizardLink(JOB_STAGE_WIZARD_TYPE, marketId, id)}&isAssign=${isAssigned}`)
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
        setOperationRunning(true);
        return stageChangeInvestible(moveInfo)
          .then((newInv) => {
            onInvestibleStageChange(furtherWorkStage.id, newInv, id, marketId, commentsState,
              commentsDispatch, investiblesDispatch, () => {}, marketStagesState, undefined,
              getFullStage(marketStagesState, marketId, marketInfo.stage), marketPresencesDispatch);
            setOperationRunning(false);
            navigate(history, `${formWizardLink(JOB_STAGE_WIZARD_TYPE, marketId, id)}&stageId=${furtherWorkStage.id}&isAssign=${isAssigned}`);
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

  return (
    <Screen
      title={groupName}
      hidden={hidden}
      tabTitle={groupName}
      banner={banner}
      showBanner={banner != null}
      openMenuItems={navListItemTextArray}
      navigationOptions={{useHoverFunctions: !mobileLayout, resetFunction: () => resetFunction(0)}}
    >
      <GmailTabs
        value={tabIndex}
        id='dialog-header'
        onChange={(event, value) => {
          resetFunction(value);
        }}
        indicatorColors={['#00008B', '#00008B', '#00008B', '#00008B', '#00008B']}
        style={{ paddingBottom: '0.25rem', zIndex: 8, position: 'fixed',
          paddingTop: mobileLayout ? '0.5rem' : '1.25rem',
          marginTop: '-30px', paddingLeft: 0, marginLeft: '-0.5rem' }}>
        <GmailTabItem icon={<AssignmentInd />} onDrop={onDropAssigned}
                      onDragOver={(event)=>event.preventDefault()} toolTipId='assignedJobsToolTip'
                      label={intl.formatMessage({id: 'planningDialogNavStoriesLabel'})}
                      tag={_.isEmpty(search) || jobsSearchResults === 0 ? undefined : `${jobsSearchResults}`} />
        <GmailTabItem icon={<AssignmentIcon />} onDrop={onDropBacklog}
                      onDragOver={(event)=>event.preventDefault()} toolTipId='backlogJobsToolTip'
                      label={intl.formatMessage({id: 'planningDialogBacklog'})}
                      tag={_.isEmpty(search) || backlogSearchResults === 0 ? undefined : `${backlogSearchResults}`} />
        <GmailTabItem icon={<BugReport />} label={intl.formatMessage({id: 'todoSection'})}
                      toolTipId='bugsToolTip'
                      tag={_.isEmpty(search) || _.isEmpty(todoComments) ? undefined : `${_.size(todoComments)}` } />
        <GmailTabItem icon={<QuestionIcon />} toolTipId='discussionToolTip'
                      label={intl.formatMessage({id: 'planningDialogDiscussionLabel'})}
                      tag={_.isEmpty(search) || _.isEmpty(questionSuggestionComments) ? undefined :
                        `${_.size(questionSuggestionComments)}`} />
      </GmailTabs>
      <div style={{display: 'flex', overflow: 'hidden'}}>
        <DialogOutset marketPresences={marketPresences} marketId={marketId} groupId={groupId} hidden={hidden}
                      archivedSize={archivedSize} />
      <div style={{paddingTop: '4rem', width: '96%', marginLeft: 'auto', marginRight: 'auto', overflow: 'hidden'}}>
        <div ref={refToTop}></div>
        {isSectionOpen('discussionSection') && (
          <div id="discussionSection">
            <Grid item id="discussionAddArea" xs={12}>
              {_.isEmpty(search) && marketId && !hidden && (
                <>
                  <div style={{display: 'flex', marginBottom: '1.5rem'}}>
                    <SpinningButton id="newMarketQuestion"
                                    icon={AddIcon} iconColor="black"
                                    className={wizardClasses.actionNext}
                                    style={{display: "flex", marginTop: '1rem',
                                      marginRight: mobileLayout ? undefined : '2rem'}}
                                    variant="text" doSpin={false}
                                    onClick={() => navigate(history,
                                      formMarketAddCommentLink(DISCUSSION_WIZARD_TYPE, marketId, groupId,
                                        QUESTION_TYPE))}>
                      <FormattedMessage id='createQuestion'/>
                    </SpinningButton>
                    <SpinningButton id="createSuggestion"
                                    icon={AddIcon} iconColor="black"
                                    className={wizardClasses.actionNext}
                                    style={{display: "flex", marginTop: '1rem'}}
                                    variant="text" doSpin={false}
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
                      be used at the group level and later moved to a job.
                    </div>
                  }/>
                </>
              )}
              <CommentBox
                comments={notTodoComments.filter((comment) =>
                  [QUESTION_TYPE, SUGGEST_CHANGE_TYPE, REPLY_TYPE].includes(comment.comment_type))}
                marketId={marketId} allowedTypes={[QUESTION_TYPE]}/>
            </Grid>
          </div>
        )}
        {isSectionOpen('storiesSection') && (
          <div id="storiesSection" style={{overflowX: 'hidden'}}>
            {!_.isEmpty(blockedOrRequiresInputInvestibles) && (
              <>
                <SubSection
                  type={SECTION_TYPE_SECONDARY_WARNING}
                  bolder
                  titleIcon={blockedOrRequiresInputInvestibles.length > 0 ?
                    <span className={'MuiTabItem-tag'} style={{backgroundColor: WARNING_COLOR,
                      borderRadius: 22, paddingLeft: '5px', paddingRight: '6px', paddingTop: '1px', fontSize: 12,
                      marginRight: '1rem', maxHeight: '20px'}}>
                      {blockedOrRequiresInputInvestibles.length} total
                    </span> : undefined}
                  title={intl.formatMessage({ id: 'blockedHeader' })}
                  helpLink='https://documentation.uclusion.com/groups/jobs/stages/#assistance'
                  id="blocked"
                >
                  <ArchiveInvestbiles
                    comments={comments}
                    elevation={0}
                    marketId={marketId}
                    presenceMap={presenceMap}
                    investibles={blockedOrRequiresInputInvestibles}
                    presenceId={myPresence.id}
                    allowDragDrop
                  />
                </SubSection>
                <div style={{ paddingBottom: '2rem' }}/>
              </>
            )}
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
                             display={_.isEmpty(blockedOrRequiresInputInvestibles)&&_.isEmpty(swimlaneInvestibles)}
                             text={
                               isEveryoneGroup(groupId, marketId) ?
                                 <div>
                                   There are no assigned jobs. Use the "Add job" button above
                                   and <Link href="https://documentation.uclusion.com/groups/#everyone" target="_blank">everyone</Link> will
                                   be notified.
                                 </div> :
              <div>
                There are no assigned jobs. Use the "Add job" button above
                and <Link href="https://documentation.uclusion.com/notifications" target="_blank">notifications</Link> are
                sent to this group backed by instructional wizards.
              </div>
            }/>
          </div>
        )}
        {isSectionOpen('backlogSection') && (
          <div id="backlogSection" style={{overflowX: 'hidden'}}>
            <Backlog group={group} marketPresences={marketPresences}
                     furtherWorkReadyToStart={furtherWorkReadyToStart} furtherWorkInvestibles={furtherWorkInvestibles}
                     comments={comments} />
          </div>
        )}
        <MarketTodos comments={unResolvedMarketComments} marketId={marketId} groupId={groupId}
                     sectionOpen={isSectionOpen('marketTodos')}
                     hidden={hidden}
                     setSectionOpen={() => {
                       updatePageState({sectionOpen: 'marketTodos', tabIndex: 1});
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
