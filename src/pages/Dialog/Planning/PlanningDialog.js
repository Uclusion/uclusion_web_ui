/**
 * A component that renders a single group's view of a planning market
 */
import React, { useContext, useEffect, useState } from 'react'
import { useLocation } from 'react-router'
import { useIntl } from 'react-intl'
import PropTypes from 'prop-types'
import _ from 'lodash'
import {
  Grid,
  useMediaQuery,
  useTheme,
  Link
} from '@material-ui/core'
import Summary from './Summary'
import Screen from '../../../containers/Screen/Screen'
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
import { getInvestiblesInStage } from '../../../contexts/InvestibesContext/investiblesContextHelper'
import { getMarketInfo } from '../../../utils/userFunctions'
import MarketTodos from './MarketTodos'
import {
  isAcceptedStage,
  isBlockedStage,
  isFurtherWorkStage,
  isInReviewStage, isRequiredInputStage
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper'
import ListAltIcon from '@material-ui/icons/ListAlt'
import QuestionIcon from '@material-ui/icons/ContactSupport'
import MenuBookIcon from '@material-ui/icons/MenuBook'
import { SearchResultsContext } from '../../../contexts/SearchResultsContext/SearchResultsContext'
import { getPageReducerPage, usePageStateReducer } from '../../../components/PageState/pageStateHooks'
import SettingsIcon from '@material-ui/icons/Settings'
import PlanningDialogEdit from './PlanningDialogEdit'
import AssignmentIcon from '@material-ui/icons/Assignment'
import queryString from 'query-string'
import { MarketGroupsContext } from '../../../contexts/MarketGroupsContext/MarketGroupsContext'
import { getGroup } from '../../../contexts/MarketGroupsContext/marketGroupsContextHelper'
import { GmailTabItem, GmailTabs } from '../../../containers/Tab/Inbox'
import { AssignmentInd } from '@material-ui/icons'
import Backlog from './Backlog'
import InvestiblesByPerson from './InvestiblesByPerson'
import { SECTION_TYPE_SECONDARY_WARNING } from '../../../constants/global'
import SubSection from '../../../containers/SubSection/SubSection'
import { filterToRoot } from '../../../contexts/CommentsContext/commentsContextHelper'
import DialogArchives from '../../DialogArchives/DialogArchives'
import { baseNavListItem, formMarketLink } from '../../../utils/marketIdPathFunctions'
import { isInStages } from './userUtils'
import { WARNING_COLOR } from '../../../components/Buttons/ButtonConstants'

export const LocalPlanningDragContext = React.createContext([]);

function getAnchorId(tabIndex) {
  switch (tabIndex) {
    case 0:
      return 'storiesSection';
    case 1:
      return 'backlogSection';
    case 2:
      return 'marketTodos'
    case 4:
      return 'archive';
    case 5:
      return 'settingsSection';
    default:
      return 'workspaceMain';
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
    marketId
  } = props;
  const [searchResults] = useContext(SearchResultsContext);
  const { results, parentResults, search } = searchResults;
  const location = useLocation();
  const { hash, search: querySearch } = location;
  const values = queryString.parse(querySearch);
  const { groupId } = values || {};
  const intl = useIntl();
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('md'));
  const singleTabLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const [groupState] = useContext(MarketGroupsContext);
  const group = getGroup(groupState, marketId, groupId);
  const { name: groupName } = group || {};
  const isAdmin = myPresence.is_admin;
  const unResolvedMarketComments = comments.filter(comment => !comment.investible_id && !comment.resolved) || [];
  // There is no link to a reply so including them should be okay
  const notTodoComments = unResolvedMarketComments.filter(comment =>
    [QUESTION_TYPE, SUGGEST_CHANGE_TYPE, REPORT_TYPE, REPLY_TYPE].includes(comment.comment_type)) || [];
  const allowedCommentTypes = [QUESTION_TYPE, SUGGEST_CHANGE_TYPE];
  const [marketPresencesState] = useContext(MarketPresencesContext);
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
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
  const presenceMap = getPresenceMap(marketPresences);
  function isSectionOpen(section) {
    return sectionOpen === section || (!sectionOpen && section === 'storiesSection');
  }

  useEffect(() => {
    if (hash) {
      if (hash.includes('workspaceMain')) {
        updatePageState({ sectionOpen: 'workspaceMain' })
      } else {
        const found = comments.find((anId) => hash.includes(anId));
        if (!_.isEmpty(found)) {
          const rootComment = filterToRoot(comments, found.id);
          if (_.isEmpty(rootComment.investible_id)) {
            if (!rootComment.resolved) {
              if (rootComment.comment_type === TODO_TYPE) {
                updatePageState({ sectionOpen: 'marketTodos' });
              } else {
                updatePageState({ sectionOpen: 'workspaceMain' });
              }
            } else {
              updatePageState({ sectionOpen: 'archive' });
            }
          }
        }
      }
    }
  }, [comments, hash, sectionOpen, updatePageState]);

  function openSubSection(subSection) {
    updatePageState({sectionOpen: subSection});
  }

  const sortedRoots = getSortedRoots(notTodoComments, searchResults);
  const questions = sortedRoots.filter((comment) => comment.comment_type === QUESTION_TYPE);
  const suggestions = sortedRoots.filter((comment) => comment.comment_type === SUGGEST_CHANGE_TYPE);
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

  const discussionSearchResults = (results.find((result) => result.id === marketId) ? 1 : 0) + _.size(questions)
                        + _.size(suggestions);
  const jobsSearchResults = _.size(requiresInputInvestibles) + _.size(blockedInvestibles) + _.size(swimlaneInvestibles);
  const backlogSearchResults = _.size(furtherWorkReadyToStart) + _.size(furtherWorkInvestibles);
  let navListItemTextArray = undefined;
  if (singleTabLayout) {
    function createNavListItem(icon, textId, itemTabIndex, howManyNum) {
      const isSearch = !_.isEmpty(search);
      const anchorId = getAnchorId(itemTabIndex);
      const nav = baseNavListItem(formMarketLink(marketId, groupId), icon, textId, anchorId,
        isSearch ? howManyNum : undefined, true);
      nav['onClickFunc'] = () => {
        updatePageState({tabIndex: itemTabIndex});
        openSubSection(anchorId);
      };
      nav['isBold'] = isSectionOpen(anchorId);
      return nav;
    }
    navListItemTextArray = [
      createNavListItem(AssignmentInd, 'planningDialogNavStoriesLabel', 0, jobsSearchResults),
      createNavListItem(AssignmentIcon, 'planningDialogBacklog', 1, backlogSearchResults),
      createNavListItem(ListAltIcon, 'todoSection', 2, _.size(todoComments)),
      createNavListItem(QuestionIcon, 'planningDialogNavDiscussionLabel', 3, discussionSearchResults),
      createNavListItem(MenuBookIcon, 'planningDialogViewArchivesLabel', 4, archivedSize),
      createNavListItem(SettingsIcon, 'settings', 5)
    ];
  }
  function resetTabs() {
    updatePageState({sectionOpen: undefined, tabIndex: 0});
  }
  return (
    <Screen
      title={groupName}
      hidden={hidden}
      tabTitle={groupName}
      banner={banner}
      openMenuItems={navListItemTextArray}
    >
      <GmailTabs
        value={singleTabLayout ? 0 : tabIndex}
        onChange={(event, value) => {
          updatePageState({tabIndex: value});
          const anchorId = getAnchorId(value);
          openSubSection(anchorId);
        }}
        indicatorColors={['#00008B', '#00008B', '#00008B', '#00008B', '#00008B', '#00008B']}
        style={{ borderTop: '1px ridge lightgrey', paddingBottom: '0.25rem' }}>
        {(!singleTabLayout || sectionOpen === 'storiesSection') && (
          <GmailTabItem icon={<AssignmentInd />}
                        label={intl.formatMessage({id: 'planningDialogNavStoriesLabel'})}
                        tag={_.isEmpty(search) || jobsSearchResults === 0 ? undefined : `${jobsSearchResults}`} />
        )}
        {(!singleTabLayout || sectionOpen === 'backlogSection') && (
          <GmailTabItem icon={<AssignmentIcon />} label={intl.formatMessage({id: 'planningDialogBacklog'})}
                        tag={_.isEmpty(search) || backlogSearchResults === 0 ? undefined : `${backlogSearchResults}`} />
        )}
        {(!singleTabLayout || sectionOpen === 'marketTodos') && (
          <GmailTabItem icon={<ListAltIcon />} label={intl.formatMessage({id: 'todoSection'})}
                        tag={_.isEmpty(search) || _.isEmpty(todoComments) ? undefined : `${_.size(todoComments)}` } />
        )}
        {(!singleTabLayout || sectionOpen === 'workspaceMain') && (
          <GmailTabItem icon={<QuestionIcon />}
                        label={intl.formatMessage({id: 'planningDialogNavDiscussionLabel'})}
                        tag={_.isEmpty(search) || discussionSearchResults === 0 ? undefined :
                          `${discussionSearchResults}`} />
        )}
        {(!singleTabLayout || sectionOpen === 'archive') && (
          <GmailTabItem icon={<MenuBookIcon />}
                        label={intl.formatMessage({id: 'planningDialogViewArchivesLabel'})}
                        tag={_.isEmpty(search) ? undefined : `${archivedSize}`} />
        )}
        {(!singleTabLayout || sectionOpen === 'settingsSection') && (
          <GmailTabItem icon={<SettingsIcon />}
                        label={intl.formatMessage({id: 'settings'})} />
        )}
      </GmailTabs>
      {isSectionOpen('workspaceMain') && (
        <div id="workspaceMain">
          {(_.isEmpty(search) || results.find((item) => item.id === marketId)) && (
            <Summary group={group} hidden={hidden} pageState={pageState} updatePageState={updatePageState}
                     pageStateReset={pageStateReset}/>
          )}
          <Grid item id="commentAddArea" xs={12} style={{marginTop: '2rem'}}>
            {_.isEmpty(search) && marketId && !hidden && (
              <>
                <DismissableText textId="workspaceCommentHelp" display={_.isEmpty(notTodoComments)} text={
                  <div>
                    <Link href="https://documentation.uclusion.com/structured-comments" target="_blank">Comments</Link> can
                    be used at the workspace level and later moved to a job.
                  </div>
                }/>
                <CommentAddBox
                  groupId={groupId}
                  allowedTypes={allowedCommentTypes}
                  marketId={marketId}
                />
              </>
            )}
            <CommentBox comments={notTodoComments} marketId={marketId} allowedTypes={allowedCommentTypes}/>
          </Grid>
        </div>
      )}
      <LocalPlanningDragContext.Provider value={[beingDraggedHack, setBeingDraggedHack]}>
        {isSectionOpen('storiesSection') && (
          <div id="storiesSection">
            {!_.isEmpty(requiresInputInvestibles) && (
              <SubSection
                type={SECTION_TYPE_SECONDARY_WARNING}
                bolder
                titleIcon={blockedOrRequiresInputInvestibles.length > 0 ?
                  <span className={'MuiTabItem-tag'} style={{backgroundColor: WARNING_COLOR, maxHeight: '20px',
                    borderRadius: 12, paddingRight: '2.79px', paddingLeft: '2.79px', marginRight: '1rem'}}>
                    {blockedOrRequiresInputInvestibles.length} total
                  </span> : undefined}
                title={intl.formatMessage({ id: 'blockedHeader' })}
                helpLink='https://documentation.uclusion.com/channels/jobs/stages/#blocked'
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
            )}
            <div style={{ paddingBottom: '2rem' }}/>
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
            <DismissableText textId="notificationHelp"
                             display={_.isEmpty(investibles.find((investible) =>
                               isInStages(investible, visibleStages, marketId)))}
                             text={
              <div>
                Use the "Add job" button above and each team member's inbox will have
                a <Link href="https://documentation.uclusion.com/notifications" target="_blank">notification</Link> until
                they approve, give feedback or answer questions as necessary.
              </div>
            }/>
          </div>
        )}
        {isSectionOpen('backlogSection') && (
          <div id="backlogSection">
            <Backlog furtherWorkType={furtherWorkType} group={group} updatePageState={updatePageState}
                     marketPresences={marketPresences}
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
      {!hidden && isSectionOpen('archive') && (
        <DialogArchives />
      )}
      <Grid container spacing={2} id="settingsSection">
        {!hidden && !_.isEmpty(acceptedStage) && !_.isEmpty(inVerifiedStage) &&
          isSectionOpen('settingsSection') && _.isEmpty(search) && (
            <PlanningDialogEdit
              group={group}
              userId={myPresence.id}
              onCancel={() => resetTabs()}
              acceptedStage={acceptedStage}
              verifiedStage={inVerifiedStage}
            />
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
