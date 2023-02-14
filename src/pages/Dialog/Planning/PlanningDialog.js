/**
 * A component that renders a single group's view of a planning market
 */
import React, { useContext, useEffect, useState } from 'react'
import { useHistory, useLocation } from 'react-router';
import { FormattedMessage, useIntl } from 'react-intl';
import PropTypes from 'prop-types'
import _ from 'lodash'
import {
  Grid,
  useMediaQuery,
  useTheme,
  Link
} from '@material-ui/core'
import Screen from '../../../containers/Screen/Screen'
import {
  QUESTION_TYPE, REPLY_TYPE,
  REPORT_TYPE,
  SUGGEST_CHANGE_TYPE,
  TODO_TYPE
} from '../../../constants/comments'
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
import QuestionIcon from '@material-ui/icons/ContactSupport'
import { SearchResultsContext } from '../../../contexts/SearchResultsContext/SearchResultsContext'
import { getPageReducerPage, usePageStateReducer } from '../../../components/PageState/pageStateHooks'
import AssignmentIcon from '@material-ui/icons/Assignment'
import queryString from 'query-string'
import { MarketGroupsContext } from '../../../contexts/MarketGroupsContext/MarketGroupsContext'
import { getGroup } from '../../../contexts/MarketGroupsContext/marketGroupsContextHelper'
import { GmailTabItem, GmailTabs } from '../../../containers/Tab/Inbox'
import { AssignmentInd, BugReport } from '@material-ui/icons'
import Backlog from './Backlog'
import InvestiblesByPerson from './InvestiblesByPerson'
import { SECTION_TYPE_SECONDARY_WARNING } from '../../../constants/global'
import SubSection from '../../../containers/SubSection/SubSection'
import { filterToRoot } from '../../../contexts/CommentsContext/commentsContextHelper'
import { baseNavListItem, formMarketAddCommentLink, formMarketLink, navigate } from '../../../utils/marketIdPathFunctions';
import { isInStages } from './userUtils'
import { WARNING_COLOR } from '../../../components/Buttons/ButtonConstants'
import { isEveryoneGroup } from '../../../contexts/GroupMembersContext/groupMembersHelper';
import AddIcon from '@material-ui/icons/Add';
import SpinningIconLabelButton from '../../../components/Buttons/SpinningIconLabelButton';
import { DISCUSSION_WIZARD_TYPE } from '../../../constants/markets';
import DialogOutset from './DialogOutset';
import ChangeSuggstionIcon from '@material-ui/icons/ChangeHistory';

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
  const history = useHistory();
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
  const [pageState, updatePageState] = getPageReducerPage(pageStateFull, pageDispatch, groupId,
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
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
  const presenceMap = getPresenceMap(marketPresences);
  function isSectionOpen(section) {
    return sectionOpen === section || (!sectionOpen && section === 'storiesSection');
  }

  useEffect(() => {
    if (hash && !hidden) {
      if (hash.includes('workspaceMain')) {
        updatePageState({ sectionOpen: 'workspaceMain', tabIndex: 3 })
      } else {
        const element = document.getElementById(hash.substring(1, hash.length));
        if (!element) {
          const found = comments.find((comment) => hash.includes(comment.id));
          if (!_.isEmpty(found)) {
            const rootComment = filterToRoot(comments, found.id);
            if (_.isEmpty(rootComment.investible_id)) {
              if (!rootComment.resolved) {
                if (rootComment.comment_type === TODO_TYPE) {
                  updatePageState({ sectionOpen: 'marketTodos', tabIndex: 1 });
                } else {
                  updatePageState({ sectionOpen: 'workspaceMain', tabIndex: 3 });
                }
              } else {
                // TODO send over to the archives
              }
            }
          }
        }
      }
    }
  }, [comments, hash, hidden, sectionOpen, updatePageState]);

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
      createNavListItem(BugReport, 'todoSection', 2, _.size(todoComments)),
      createNavListItem(QuestionIcon, 'questions', 3, _.size(questions)),
      createNavListItem(ChangeSuggstionIcon, 'suggestions', 4, _.size(suggestions)),
    ];
  }

  return (
    <Screen
      title={groupName}
      hidden={hidden}
      tabTitle={groupName}
      banner={banner}
      openMenuItems={navListItemTextArray}
      navigationOptions={{useHoverFunctions: true}}
    >
      <GmailTabs
        value={singleTabLayout ? 0 : tabIndex}
        id='dialog-header'
        onChange={(event, value) => {
          updatePageState({tabIndex: value});
          const anchorId = getAnchorId(value);
          openSubSection(anchorId);
          // Previous scroll position no longer relevant
          window.scrollTo(0, 0);
        }}
        indicatorColors={['#00008B', '#00008B', '#00008B', '#00008B', '#00008B', '#00008B']}
        style={{ paddingBottom: '0.25rem', zIndex: 8, position: 'fixed', paddingTop: '0.5rem',
          marginTop: '-15px', paddingLeft: 0, marginLeft: '-0.5rem' }}>
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
          <GmailTabItem icon={<BugReport />} label={intl.formatMessage({id: 'todoSection'})}
                        tag={_.isEmpty(search) || _.isEmpty(todoComments) ? undefined : `${_.size(todoComments)}` } />
        )}
        {(!singleTabLayout || sectionOpen === 'questions') && (
          <GmailTabItem icon={<QuestionIcon />}
                        label={intl.formatMessage({id: 'questions'})}
                        tag={_.isEmpty(search) || _.isEmpty(questions) ? undefined : `${_.size(questions)}`} />
        )}
        {(!singleTabLayout || sectionOpen === 'suggestions') && (
          <GmailTabItem icon={<ChangeSuggstionIcon />}
                        label={intl.formatMessage({id: 'suggestions'})}
                        tag={_.isEmpty(search) || _.isEmpty(suggestions) ? undefined : `${_.size(suggestions)}`} />
        )}
      </GmailTabs>
      <div style={{display: 'flex'}}>
        <DialogOutset marketPresences={marketPresences} marketId={marketId} groupId={groupId} />
      <div style={{paddingTop: '4rem', width: '100%'}}>
        {isSectionOpen('questions') && (
          <div id="questions">
            <Grid item id="questionAddArea" xs={12}>
              {_.isEmpty(search) && marketId && !hidden && (
                <>
                  <DismissableText textId="workspaceCommentHelp" display={_.isEmpty(questions)} text={
                    <div>
                      <Link href="https://documentation.uclusion.com/structured-comments" target="_blank">Questions</Link> can
                      be used at the workspace level and later moved to a job.
                    </div>
                  }/>
                  <SpinningIconLabelButton icon={AddIcon} doSpin={false} whiteBackground style={{display: "flex",
                    alignItems: 'center', marginRight: 'auto', marginLeft: 'auto', marginTop: '1rem'}}
                                           onClick={() => navigate(history,
                                             formMarketAddCommentLink(DISCUSSION_WIZARD_TYPE, marketId, groupId))}>
                    <FormattedMessage id='createDiscussion'/>
                  </SpinningIconLabelButton>
                </>
              )}
              <CommentBox comments={questions} marketId={marketId} allowedTypes={allowedCommentTypes}/>
            </Grid>
          </div>
        )}
        {isSectionOpen('suggestions') && (
          <div id="suggestions">
            <Grid item id="suggestionAddArea" xs={12}>
              {_.isEmpty(search) && marketId && !hidden && (
                <>
                  <DismissableText textId="workspaceCommentHelp" display={_.isEmpty(suggestions)} text={
                    <div>
                      <Link href="https://documentation.uclusion.com/structured-comments" target="_blank">Suggestions</Link> can
                      be used at the workspace level and later moved to a job.
                    </div>
                  }/>
                  <SpinningIconLabelButton icon={AddIcon} doSpin={false} whiteBackground style={{display: "flex",
                    alignItems: 'center', marginRight: 'auto', marginLeft: 'auto', marginTop: '1rem'}}
                                           onClick={() => navigate(history,
                                             formMarketAddCommentLink(DISCUSSION_WIZARD_TYPE, marketId, groupId))}>
                    <FormattedMessage id='createDiscussion'/>
                  </SpinningIconLabelButton>
                </>
              )}
              <CommentBox comments={questions} marketId={marketId} allowedTypes={allowedCommentTypes}/>
            </Grid>
          </div>
        )}
        <LocalPlanningDragContext.Provider value={[beingDraggedHack, setBeingDraggedHack]}>
          {isSectionOpen('storiesSection') && (
            <div id="storiesSection">
              {!_.isEmpty(blockedOrRequiresInputInvestibles) && (
                <>
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
                                 isEveryoneGroup(groupId, marketId) ?
                                   <div>
                                     Use the "Add job" button above
                                     and <Link href="https://documentation.uclusion.com/everyone" target="_blank">everyone</Link> will
                                     be notified.
                                   </div> :
                <div>
                  Use the "Add job" button above
                  and <Link href="https://documentation.uclusion.com/notifications" target="_blank">notifications</Link> are
                  sent to this group backed by instructional wizards.
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
                       hidden={hidden}
                       setSectionOpen={() => {
                         updatePageState({sectionOpen: 'marketTodos', tabIndex: 1});
                       }} group={group} userId={myPresence.id}/>
        </LocalPlanningDragContext.Provider>
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
