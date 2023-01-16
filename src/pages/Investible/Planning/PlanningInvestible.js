import React, { useContext, useEffect } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { Grid, IconButton, makeStyles, Tooltip, Typography, useMediaQuery, useTheme } from '@material-ui/core';
import { useHistory } from 'react-router';
import { FormattedMessage, useIntl } from 'react-intl';
import YourVoting from '../Voting/YourVoting';
import Voting from '../Decision/Voting';
import CommentBox from '../../../containers/CommentBox/CommentBox';
import {
  ISSUE_TYPE,
  JUSTIFY_TYPE,
  QUESTION_TYPE,
  REPLY_TYPE,
  REPORT_TYPE,
  SUGGEST_CHANGE_TYPE,
  TODO_TYPE
} from '../../../constants/comments';
import Screen from '../../../containers/Screen/Screen';
import CommentAddBox, { getIcon } from '../../../containers/CommentBox/CommentAddBox';
import { getMarketInfo, getVotesForInvestible } from '../../../utils/userFunctions';
import {
  getFullStage,
  getFurtherWorkStage,
  getInCurrentVotingStage
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import EditMarketButton from '../../Dialog/EditMarketButton';
import CardType from '../../../components/CardType';
import PersonAddIcon from '@material-ui/icons/PersonAdd';
import { PLACEHOLDER } from '../../../constants/global';
import { refreshInvestibles } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { ACTION_BUTTON_COLOR } from '../../../components/Buttons/ButtonConstants';
import { stageChangeInvestible, updateInvestible } from '../../../api/investibles';
import { DiffContext } from '../../../contexts/DiffContext/DiffContext';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { doSetEditWhenValid, invalidEditEvent } from '../../../utils/windowUtils';
import Gravatar from '../../../components/Avatars/Gravatar';
import { getInvestibleVoters } from '../../../utils/votingUtils';
import { getCommenterPresences } from '../../Dialog/Planning/userUtils';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { findMessageOfType, findMessagesForInvestibleId } from '../../../utils/messageUtils';
import InvestibleBodyEdit from '../InvestibleBodyEdit';
import { getPageReducerPage, usePageStateReducer } from '../../../components/PageState/pageStateHooks';
import { pushMessage } from '../../../utils/MessageBusUtils';
import {
  LOCK_INVESTIBLE,
  LOCK_INVESTIBLE_CHANNEL
} from '../../../contexts/InvestibesContext/investiblesContextMessages';
import { onInvestibleStageChange } from '../../../utils/investibleFunctions';
import { SearchResultsContext } from '../../../contexts/SearchResultsContext/SearchResultsContext';
import PlanningInvestibleEdit from './PlanningInvestibleEdit';
import { removeInvestibleInvestments } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { setUclusionLocalStorageItem } from '../../../components/localStorageUtils';
import { BLOCKED_STORY_TOUR, REQUIRES_INPUT_STORY_TOUR } from '../../../contexts/TourContext/tourContextHelper';
import UclusionTour from '../../../components/Tours/UclusionTour';
import { blockedStorySteps } from '../../../components/Tours/blockedStory';
import { requiresInputStorySteps } from '../../../components/Tours/requiresInputStory';
import { ACTIVE_STAGE } from '../../../constants/markets';
import {
  OPERATION_HUB_CHANNEL,
  STOP_OPERATION
} from '../../../contexts/OperationInProgressContext/operationInProgressMessages';
import { addEditVotingHasContents } from '../Voting/AddEditVote';
import InvesibleCommentLinker from '../../Dialog/InvesibleCommentLinker';
import { GmailTabItem, GmailTabs, tabTheme } from '../../../containers/Tab/Inbox';
import ThumbsUpDownIcon from '@material-ui/icons/ThumbsUpDown';
import { baseNavListItem, formInvestibleLink } from '../../../utils/marketIdPathFunctions';
import AssignmentIcon from '@material-ui/icons/Assignment';
import HelpIcon from '@material-ui/icons/Help';
import EmojiObjectsIcon from '@material-ui/icons/EmojiObjects';
import DescriptionIcon from '@material-ui/icons/Description';
import BlockIcon from '@material-ui/icons/Block';
import { filterToRoot } from '../../../contexts/CommentsContext/commentsContextHelper';
import { getStagesInfo } from '../../../utils/stageUtils';
import { removeMessages } from '../../../contexts/NotificationsContext/notificationsContextReducer';
import PlanningInvestibleNav, { useMetaDataStyles } from './PlanningInvestibleNav';
import MenuIcon from '@material-ui/icons/Menu';

export const usePlanningInvestibleStyles = makeStyles(
  theme => ({
    root: {
      alignItems: "flex-start",
      display: "flex"
    },
    container: {
      padding: "3px 89px 21px 21px",
      marginTop: "-6px",
      boxShadow: "none",
      [theme.breakpoints.down("sm")]: {
        padding: "3px 21px 42px 21px"
      }
    },
    explain: {
      fontSize: 12,
    },
    content: {
      fontSize: "15 !important",
      lineHeight: "175%",
      color: "#414141",
      [theme.breakpoints.down("sm")]: {
        fontSize: 13
      },
      "& > .ql-container": {
        fontSize: "15 !important"
      }
    },
    cardType: {
      display: "inline-flex"
    },
    mobileColumn: {
      overflowWrap: "break-word",
      [theme.breakpoints.down("sm")]: {
        flexDirection: 'column'
      }
    },
    editCardContent: {
      margin: theme.spacing(2, 1, 2, 2),
      padding: 0,
      '& img': {
        margin: '.75rem 0',
      },
      [theme.breakpoints.down("sm")]: {
        margin: 0,
        padding: '15px'
      }
    },
    votingCardContent: {
      margin: theme.spacing(0, 2, 2, 2),
      padding: 0,
      '& img': {
        margin: '.75rem 0',
      },
      [theme.breakpoints.down("sm")]: {
        margin: 0,
        padding: '15px'
      }
    },
    actions: {},
    blue: {
      backgroundColor: '#2d9cdb',
    },
    upperRightCard: {
      display: "inline-flex",
      float: "right",
      padding: 0,
      margin: 0,
    },
    borderRight: {
      [theme.breakpoints.down("sm")]: {
        padding: '1rem 0',
        marginTop: '1rem',
        borderRight: 'none',
        borderBottom: '1px solid #e0e0e0',
        flexGrow: 'unset',
        maxWidth: 'unset',
        flexBasis: 'auto'
      }
    },
    borderLeft: {
      paddingLeft: '1rem',
      marginTop: '-1.5rem',
      [theme.breakpoints.down("sm")]: {
        paddingLeft: 'unset',
        paddingRight: 0,
        marginTop: '1rem',
        borderLeft: 'none',
        flexGrow: 'unset',
        maxWidth: 'unset',
        marginRight: 'unset',
        flexBasis: 'auto'
      }
    },
    editRow: {
      height: '3rem',
      display: "flex",
      marginTop: '0.3rem'
    },
    fullWidthCentered: {
      justifyContent: 'center',
      display: "flex",
      [theme.breakpoints.down("sm")]: {
        maxWidth: '100%',
        flexBasis: '100%',
        flexDirection: 'column'
      }
    },
    autocompleteContainer: {
      display: 'flex',
      paddingBottom: '1.5rem',
      flexDirection: 'column',
    },
    labelChip: {
      paddingRight: 0,
      paddingTop: 'unset',
      maxHeight: 'unset',
      paddingBottom: '5px'
    },
    labelExplain: {
      marginLeft: '10px',
      width: 90,
      [theme.breakpoints.down("sm")]: {
        width: 'auto',
      }
    },
    fullWidthEditable: {
      paddingTop: '1rem',
      paddingRight: '1rem',
      cursor: "url('/images/edit_cursor.svg') 0 24, pointer",
        maxWidth: '100%',
        flexBasis: '100%',
        paddingLeft: 'unset',
        borderLeft: 'none',
        marginLeft: 'unset'
      },
    fullWidth: {
      paddingTop: '1rem',
      paddingRight: '1rem',
        maxWidth: '100%',
        flexBasis: '100%',
        paddingLeft: 'unset',
        borderLeft: 'none',
        marginLeft: 'unset'
    },
    datePicker: {
      position: 'absolute',
      zIndex: 1000
    },
    assignments: {
      padding: 0,
      "& ul": {
        flex: 4,
        margin: 0,
        padding: 0
      },
      "& li": {
        display: "inline-flex",
        marginLeft: theme.spacing(1)
      }
    },
    assignmentContainer: {
      width: '100%',
    },
    assignIconContainer: {
      display: 'flex',
      justifyContent: 'center'
    },
    assignmentFlexRow: {
      width: '100%',
      maxWidth: '20rem',
      paddingTop: '0.5rem'
    },
    paper: {
      // See https://github.com/mui-org/material-ui/blob/master/packages/material-ui/src/Drawer/Drawer.js
      overflowY: 'none',
      display: 'flex',
      flexDirection: 'column',
      alignItems: "flex-start",
      '& > div': {
        borderRadius: '6px',
        marginBottom: '1rem'
      },
      flex: '1 0 auto',
      backgroundColor: '#4ce6a5',
      height: '100%',
      zIndex: 9,
      position: 'fixed',
      top: '3.8rem',
      paddingLeft: '1rem',
      minWidth: '15rem',
      textOverflow: 'ellipsis',
    },
    group: {
      borderRadius: 6,
      display: "flex",
      flexDirection: "row",
      "&:first-child": {
        marginLeft: 0
      },
    },
    smallGravatar: {
      width: '30px',
      height: '30px',
    }
  }),
  { name: "PlanningInvestible" }
);

export function getCollaborators(marketPresences, investibleComments, marketPresencesState, investibleId) {
  const investibleCommentorPresences = getCommenterPresences(marketPresences, investibleComments, marketPresencesState);
  const voters = getInvestibleVoters(marketPresences, investibleId);
  const concated = [...voters, ...investibleCommentorPresences];
  return _.uniq((concated || []).map((presence) => presence.id));
}

export function countUnresolved(comments, search) {
  if (_.isEmpty(comments)) {
    return undefined;
  }
  let unresolvedComments;
  if (!_.isEmpty(search)) {
    unresolvedComments =  comments;
  } else {
    unresolvedComments = comments.filter((comment) => !comment.resolved);
  }
  return _.isEmpty(unresolvedComments) ? undefined : `${_.size(unresolvedComments)}`;
}

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
    hash,
    hidden
  } = props;
  const theme = useTheme();
  const leftNavBreak = useMediaQuery(theme.breakpoints.down('md'));
  const mobileLayout = useMediaQuery(theme.breakpoints.down('xs'));
  const intermediateLayout = useMediaQuery(tabTheme.breakpoints.down('lg'));
  const singleTabLayout = leftNavBreak;
  const classes = usePlanningInvestibleStyles();
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const [marketPresencesState, marketPresencesDispatch] = useContext(MarketPresencesContext);
  const [, diffDispatch] = useContext(DiffContext);
  const [searchResults] = useContext(SearchResultsContext);
  const { results, parentResults, search } = searchResults;
  const { id: marketId, market_stage: marketStage } = market;
  const inArchives = marketStage !== ACTIVE_STAGE;
  const investibleCommentsSearched = investibleComments.filter((comment) => {
    if (_.isEmpty(search)) {
      return true;
    }
    return results.find((item) => item.id === comment.id) || parentResults.find((id) => id === comment.id);
  });
  const investmentReasonsSearched = investibleCommentsSearched.filter((comment) => {
      return comment.comment_type === JUSTIFY_TYPE;
  });
  const marketInfo = getMarketInfo(marketInvestible, marketId) || {};
  const { stage, assigned: invAssigned, completion_estimate: marketDaysEstimate, ticket_code: ticketCode,
    former_stage_id: formerStageId, group_id: groupId } = marketInfo;
  const assigned = invAssigned || [];
  const { investible } = marketInvestible;
  const { name, locked_by: lockedBy, created_at: createdAt } = investible;
  const [marketStagesState] = useContext(MarketStagesContext);
  const [pageStateFull, pageDispatch] = usePageStateReducer('investible');
  const [pageState, updatePageState, pageStateReset] = getPageReducerPage(pageStateFull, pageDispatch, investibleId,
    {sectionOpen: 'descriptionVotingSection'});
  const {
    beingEdited,
    editCollaborators,
    sectionOpen,
    isOpenMobile
  } = pageState;

  const [votingPageStateFull, votingPageDispatch] = usePageStateReducer('voting')
  const [votingPageState, updateVotingPageState, votingPageStateReset] =
    getPageReducerPage(votingPageStateFull, votingPageDispatch, investibleId)
  const inCurrentVotingStage = getInCurrentVotingStage(
    marketStagesState,
    marketId
  ) || {}
  const isInVoting = inCurrentVotingStage && stage === inCurrentVotingStage.id;
  const isAssigned = assigned.includes(userId);
  const canVote = isInVoting && !inArchives;
  const yourPresence = marketPresences.find((presence) => presence.current_user);
  const yourVote = yourPresence && yourPresence.investments &&
    yourPresence.investments.find((investment) => investment.investible_id === investibleId && !investment.deleted);
  // If you have a vote already then do not display voting input
  const displayVotingInput = canVote && !yourVote && _.isEmpty(search);
  const [operationRunning, setOperationRunning] = useContext(OperationInProgressContext);
  const hasUsableVotingInput = !inArchives && addEditVotingHasContents(investibleId, false, operationRunning);


  useEffect(() => {
    if (hash && hash.length > 1 && !hidden) {
      const element = document.getElementById(hash.substring(1, hash.length));
      // Check if already on the right tab and only change tab if not
      if (!element) {
        if (hash.startsWith('#cv') || hash.startsWith('#approve')) {
          updatePageState({ sectionOpen: 'descriptionVotingSection' })
        } else {
          const found = investibleComments.find((comment) => hash.includes(comment.id));
          if (!_.isEmpty(found)) {
            const rootComment = filterToRoot(investibleComments, found.id);
            if (!_.isEmpty(rootComment.investible_id)) {
              switch (rootComment.comment_type) {
                case TODO_TYPE:
                  updatePageState({ sectionOpen: 'tasksSection' });
                  break;
                case QUESTION_TYPE:
                  updatePageState({ sectionOpen: 'questionsSection' });
                  break;
                case SUGGEST_CHANGE_TYPE:
                  updatePageState({ sectionOpen: 'suggestionsSection' });
                  break;
                case REPORT_TYPE:
                  updatePageState({ sectionOpen: 'reportsSection' });
                  break;
                case ISSUE_TYPE:
                  updatePageState({ sectionOpen: 'blockersSection' });
                  break;
                default:
              }
            }
          }
        }
      }
    }
  }, [investibleComments, hash, sectionOpen, updatePageState, hidden]);

  let lockedByName
  if (lockedBy) {
    const lockedByPresence = marketPresences.find(
      presence => presence.id === lockedBy
    );
    if (lockedByPresence) {
      const { name } = lockedByPresence;
      lockedByName = name;
    }
  }
  const stagesInfo = getStagesInfo(market.id, marketStagesState, stage);
  const {
    isInReview,
    isInAccepted,
    isInBlocked,
    isInVerified,
    isFurtherWork,
    isRequiresInput,
    isInNotDoing,
  } = stagesInfo;

  const displayEdit = !inArchives && (isAssigned || isInNotDoing || isInVoting || isFurtherWork || isRequiresInput);
  const myPresence = marketPresences.find((presence) => presence.current_user) || {};
  const fullStage = getFullStage(marketStagesState, marketId, stage) || {};
  const inMarketArchives = isInNotDoing || isInVerified;
  const reportMessage = findMessageOfType('REPORT_REQUIRED', investibleId, messagesState);
  const blockingCommentsUnresolved = investibleComments.filter(
    comment => comment.comment_type === ISSUE_TYPE && !comment.resolved
  );
  function canGetInput() {
    return _.isEmpty(blockingCommentsUnresolved) && !isInVerified && !isInNotDoing;
  }
  const suggestionComments = investibleComments.filter(
    comment => comment.comment_type === SUGGEST_CHANGE_TYPE
  );
  const reportsCommentsSearched = investibleCommentsSearched.filter(
    comment => comment.comment_type === REPORT_TYPE
  );
  const reportComments = investibleComments.filter(comment => comment.comment_type === REPORT_TYPE);
  const questionComments = investibleComments.filter(
    comment => comment.comment_type === QUESTION_TYPE
  );
  const questionsOrSuggestionsComments = questionComments.concat(suggestionComments);
  const questionSuggestionsByAssignedComments = questionsOrSuggestionsComments.filter(
    comment => !comment.resolved && assigned.includes(comment.created_by)
  );
  function canOpenBlocking() {
    return _.isEmpty(questionSuggestionsByAssignedComments) && !isInVerified && !isInNotDoing;
  }
  const todoCommentsSearched = investibleCommentsSearched.filter(
    comment => comment.comment_type === TODO_TYPE
  );
  const questionCommentsSearched = investibleCommentsSearched.filter(
    comment => comment.comment_type === QUESTION_TYPE
  );
  const suggestionCommentsSearched = investibleCommentsSearched.filter(
    comment => comment.comment_type === SUGGEST_CHANGE_TYPE
  );
  const blockingCommentsSearched = investibleCommentsSearched.filter(
    comment => comment.comment_type === ISSUE_TYPE
  );
  const replies = investibleComments.filter((comment => comment.comment_type === REPLY_TYPE));
  let allowedCommentTypes = [];
  let sectionComments = [];
  if (sectionOpen === 'tasksSection') {
    allowedCommentTypes = [TODO_TYPE];
    sectionComments = todoCommentsSearched;
  } else if (sectionOpen === 'questionsSection') {
    if (canGetInput()) {
      allowedCommentTypes = [QUESTION_TYPE];
    }
    sectionComments = questionCommentsSearched;
  } else if (sectionOpen === 'suggestionsSection') {
    if (canGetInput()) {
      allowedCommentTypes = [SUGGEST_CHANGE_TYPE];
    }
    sectionComments = suggestionCommentsSearched;
  } else if (sectionOpen === 'reportsSection') {
    if (isInAccepted || isInReview) {
      allowedCommentTypes = [REPORT_TYPE];
    }
    sectionComments = reportsCommentsSearched;
  } else if (sectionOpen === 'blockersSection') {
    if (canOpenBlocking()) {
      allowedCommentTypes = [ISSUE_TYPE];
    }
    sectionComments = blockingCommentsSearched;
  }

  const invested = getVotesForInvestible(marketPresences, investibleId);

  function handleDateChange(date) {
    const daysEstimate = marketDaysEstimate ? new Date(marketDaysEstimate) : undefined;
    if (!_.isEqual(date, daysEstimate)) {
      const updateInfo = {
        marketId,
        investibleId,
        daysEstimate: date,
      };
      setOperationRunning(true);
      return updateInvestible(updateInfo).then((fullInvestible) => {
        refreshInvestibles(investiblesDispatch, diffDispatch, [fullInvestible]);
        if (reportMessage) {
          messagesDispatch(removeMessages([reportMessage.type_object_id]));
        }
        setOperationRunning(false);
      });
    }
  }

  function isEditableByUser() {
    return displayEdit;
  }

  function mySetBeingEdited(isEdit, event) {
    if (!isEdit || lockedBy === userId || !_.isEmpty(lockedBy)) {
      // Either don't lock or throw the modal up - both of which InvestibleBodyEdit can handle
      return doSetEditWhenValid(isEdit, isEditableByUser,
        (value) => {
          updatePageState({beingEdited: value});
          setUclusionLocalStorageItem(`name-editor-${investibleId}`, name);
        }, event, history);
    }
    if (!isEditableByUser() || invalidEditEvent(event, history)) {
      return;
    }
    updatePageState({beingEdited: true});
    setUclusionLocalStorageItem(`name-editor-${investibleId}`, name);
    window.scrollTo(0, 0);
    if ((isInReview || isInAccepted) && _.size(assigned) === 1) {
      // Only one person can edit so no need to get a lock
      return;
    }
    pushMessage(LOCK_INVESTIBLE_CHANNEL, { event: LOCK_INVESTIBLE, marketId, investibleId });
  }

  const displayApprovalsBySearch = _.isEmpty(search) ? _.size(invested) : _.size(investmentReasonsSearched);

  function onSaveAssignments (result) {
    // the edit ony contains the investible data and assignments, not the full market infos
    if (result) {
      const { fullInvestible, assignmentChanged } = result;
      refreshInvestibles(investiblesDispatch, diffDispatch, [fullInvestible]);
      if (assignmentChanged) {
        const messages = findMessagesForInvestibleId(investibleId, messagesState) || [];
        const messageIds = messages.map((message) => message.type_object_id);
        messagesDispatch(removeMessages(messageIds));
        removeInvestibleInvestments(marketPresencesState, marketPresencesDispatch, marketId, investibleId);
      }
    }
    updatePageState({editCollaborators: false});
  }

  function openSubSection(subSection) {
    updatePageState({sectionOpen: subSection});
  }

  const title = ticketCode ? `${ticketCode} ${name}` : name;
  const descriptionSectionResults = (_.isEmpty(search) ? 0 :
      ((results || []).find((item) => item.id === investibleId) ? 1 : 0)) + _.size(investmentReasonsSearched);
  const displayReportsSection =  (!isInVoting && !isFurtherWork) || _.size(reportsCommentsSearched) > 0;
  const displayQuestionSection = canGetInput() || _.size(questionCommentsSearched) > 0;
  const displaySuggestionsSection = canGetInput() || _.size(suggestionCommentsSearched) > 0;
  const displayBockingSection = canOpenBlocking() || _.size(blockingCommentsSearched) > 0;
  const sections = ['descriptionVotingSection'];
  if (displayReportsSection) {
    sections.push('reportsSection');
  }
  sections.push('tasksSection');
  if (displayQuestionSection) {
    sections.push('questionsSection');
  }
  if (displaySuggestionsSection) {
    sections.push('suggestionsSection')
  }
  if (displayBockingSection) {
    sections.push('blockersSection');
  }
  let navListItemTextArray = undefined;
  if (singleTabLayout) {
    function createNavListItem(icon, textId, anchorId, howManyNum) {
      const nav = baseNavListItem(formInvestibleLink(marketId, investibleId), icon, textId, anchorId,
        howManyNum > 0 ? howManyNum : undefined, true);
      nav['onClickFunc'] = () => {
        openSubSection(anchorId);
      };
      nav['isBold'] = sectionOpen === anchorId;
      return nav;
    }
    navListItemTextArray = [
      createNavListItem(ThumbsUpDownIcon, 'descriptionVotingLabel', 'descriptionVotingSection',
        descriptionSectionResults),
    ];
    if (mobileLayout) {
      const text = intl.formatMessage({id: 'planningInvestibleOpenLabel'});
      navListItemTextArray.unshift({icon: MenuIcon, text,
        onClickFunc: () => updatePageState({isOpenMobile: true})});
    }
    if (displayBockingSection) {
      navListItemTextArray.push(createNavListItem(DescriptionIcon, 'reportsSectionLabel',
        'blockersSection', countUnresolved(reportsCommentsSearched, search)));
    }
    navListItemTextArray.push(createNavListItem(AssignmentIcon, 'tasksSection', 'tasksSection',
      countUnresolved(todoCommentsSearched, search)));
    if (displayQuestionSection) {
      navListItemTextArray.push(createNavListItem(HelpIcon, 'questions', 'questionsSection',
        countUnresolved(questionCommentsSearched, search)));
    }
    if (displaySuggestionsSection) {
      navListItemTextArray.push(createNavListItem(EmojiObjectsIcon, 'suggestions', 'suggestionsSection',
        countUnresolved(suggestionCommentsSearched, search)));
    }
    if (displayReportsSection) {
      navListItemTextArray.push(createNavListItem(BlockIcon, 'blocking', 'reportsSection',
        countUnresolved(blockingCommentsSearched, search)));
    }
  }
  function getTagLabel(tagLabelId) {
    if (!_.isEmpty(search)) {
      return intl.formatMessage({ id: 'match' });
    }
    return intl.formatMessage({ id: tagLabelId });
  }
  const showCommentAddBox = !inArchives && !isInNotDoing && !isInVerified && _.isEmpty(search) && marketId &&
    !_.isEmpty(investible) && !hidden && !_.isEmpty(allowedCommentTypes);
  const intermediateNotSingle = intermediateLayout && !singleTabLayout;
  return (
    <Screen
      title={title}
      tabTitle={name}
      hidden={hidden}
      openMenuItems={navListItemTextArray}
    >
      <UclusionTour
        name={BLOCKED_STORY_TOUR}
        hidden={hidden || !isInBlocked}
        autoStart={true}
        steps={blockedStorySteps({isAssigned})}
      />
      <UclusionTour
        name={REQUIRES_INPUT_STORY_TOUR}
        hidden={hidden || !isRequiresInput}
        autoStart={true}
        steps={requiresInputStorySteps({isAssigned})}
      />
      {(!mobileLayout || isOpenMobile) && (
        <div className={classes.paper} onClick={() => {
          if (mobileLayout) {
            updatePageState({ isOpenMobile: false })
          }
        }} style={{ paddingTop: mobileLayout ? undefined : '2rem',
          paddingBottom: intermediateNotSingle ? '1rem' : undefined,
          transform: mobileLayout ? undefined :
                 (leftNavBreak ? 'translateX(calc(100vw - 270px))' : 'translateX(calc(100vw - 490px))')}}>
          <PlanningInvestibleNav investibles={investibles} name={name} intermediateNotSingle={intermediateNotSingle}
                                 market={market} marketInvestible={marketInvestible} classes={classes}
                                 investibleId={investibleId} blockingCommentsUnresolved={blockingCommentsUnresolved}
                                 userId={userId} inArchives={inArchives} myPresence={myPresence} isAssigned={isAssigned}
                                 questionSuggestionsByAssignedComments={questionSuggestionsByAssignedComments}
                                 pageState={pageState} invested={invested} marketPresences={marketPresences}
                                 assigned={assigned} isInVoting={isInVoting} investibleComments={investibleComments}
                                 marketInfo={marketInfo} marketId={marketId} updatePageState={updatePageState} />
        </div>
      )}
      <div style={{paddingRight: mobileLayout ? undefined : '15rem'}}>
        <GmailTabs
          value={singleTabLayout ? 0 : sections.findIndex((section) => section === sectionOpen)}
          onChange={(event, value) => {
            openSubSection(sections[value]);
            // Previous scroll position no longer relevant
            window.scrollTo(0, 0);
          }}
          id='investible-header'
          indicatorColors={['#00008B', '#00008B', '#00008B', '#00008B', '#00008B', '#00008B']}
          style={{ paddingBottom: '0.25rem', zIndex: 8, position: mobileLayout ? undefined : 'fixed',
            paddingTop: '0.5rem',
            width: intermediateNotSingle ? 'unset': undefined,
            marginTop: singleTabLayout? '-29px': '-15px', paddingLeft: 0, marginLeft: '-0.5rem',
            paddingRight: mobileLayout ? undefined : '25rem' }}>
          {(!singleTabLayout || sectionOpen === 'descriptionVotingSection') && (
            <GmailTabItem icon={<ThumbsUpDownIcon />} tagLabel={getTagLabel('votes')}
                          label={intl.formatMessage({id: 'descriptionVotingLabel'})}
                          tag={descriptionSectionResults === 0 ? undefined : `${descriptionSectionResults}`} />
          )}
          {(!singleTabLayout || sectionOpen === 'reportsSection') && displayReportsSection && (
            <GmailTabItem icon={getIcon(REPORT_TYPE)}
                          label={intl.formatMessage({id: 'reportsSectionLabel'})}
                          tag={countUnresolved(reportsCommentsSearched, search)}
                          tagLabel={getTagLabel('total')} />
          )}
          {(!singleTabLayout || sectionOpen === 'tasksSection') && (
            <GmailTabItem icon={getIcon(TODO_TYPE)} label={intl.formatMessage({id: 'taskSection'})}
                          tag={countUnresolved(todoCommentsSearched, search)} tagLabel={getTagLabel('open')} />
          )}
          {(!singleTabLayout || sectionOpen === 'questionsSection') && displayQuestionSection && (
            <GmailTabItem icon={getIcon(QUESTION_TYPE)} label={intl.formatMessage({id: 'questions'})}
                          tag={countUnresolved(questionCommentsSearched, search)}
                          tagLabel={getTagLabel('open')} />
          )}
          {(!singleTabLayout || sectionOpen === 'suggestionsSection') && displaySuggestionsSection && (
            <GmailTabItem icon={getIcon(SUGGEST_CHANGE_TYPE)}
                          label={intl.formatMessage({id: 'suggestions'})}
                          tag={countUnresolved(suggestionCommentsSearched, search)}
                          tagLabel={getTagLabel('open')} />
          )}
          {(!singleTabLayout || sectionOpen === 'blockersSection') && displayBockingSection && (
            <GmailTabItem icon={getIcon(ISSUE_TYPE)} tagLabel={getTagLabel('open')}
                          label={intl.formatMessage({id: 'blocking'})}
                          tag={countUnresolved(blockingCommentsSearched, search)}
            />
          )}
        </GmailTabs>
        <div style={{paddingTop: mobileLayout ? undefined : '4rem'}} />
        {!hidden && editCollaborators && (
          <>
            <PlanningInvestibleEdit
              fullInvestible={marketInvestible}
              marketId={marketId}
              marketPresences={marketPresences}
              onSave={onSaveAssignments}
              onCancel={() => updatePageState({editCollaborators: false})}
              isAssign={editCollaborators === 'assign'}
              isReview={editCollaborators === 'review'}
              isApprove={editCollaborators === 'approve'}
              isFollow={editCollaborators === 'addressed'}
            />
            <div style={{marginTop: '1rem'}} />
          </>
        )}
        {sectionOpen === 'descriptionVotingSection' && (
          <>
            <div style={{display: 'flex'}}>
              <InvesibleCommentLinker investibleId={investibleId} marketId={marketId} />
              <div style={{width: '80%'}}>
                <CardType
                  marketDaysEstimate={marketDaysEstimate}
                  onEstimateChange={handleDateChange}
                  isInAccepted={isInAccepted}
                  className={classes.cardType}
                  createdAt={mobileLayout ? undefined : createdAt}
                  myBeingEdited={mobileLayout ? undefined : beingEdited}
                  stageChangedAt={mobileLayout ? undefined : new Date(marketInfo.last_stage_change_date)}
                />
              </div>
              <div className={classes.editRow}>
                {mobileLayout && !inMarketArchives && isEditableByUser() && !beingEdited && (
                  <div>
                    <EditMarketButton
                      labelId="edit"
                      marketId={marketId}
                      onClick={(event) => mySetBeingEdited(true, event)}
                    />
                  </div>
                )}
              </div>
            </div>
            <div className={beingEdited ? classes.editCardContent : classes.votingCardContent}
                 style={{display: 'flex'}}>
              <div className={!beingEdited && isEditableByUser() ? classes.fullWidthEditable :
                classes.fullWidth}
                   onClick={(event) => !beingEdited && mySetBeingEdited(true, event)}>
                {lockedBy && myPresence.id !== lockedBy && isEditableByUser() && (
                  <Typography>
                    {intl.formatMessage({ id: "lockedBy" }, { x: lockedByName })}
                  </Typography>
                )}
                {marketId && investibleId && (
                  <InvestibleBodyEdit
                    hidden={hidden}
                    marketId={marketId}
                    userId={userId}
                    investibleId={investibleId}
                    pageState={pageState}
                    pageStateUpdate={updatePageState}
                    pageStateReset={pageStateReset}
                    fullInvestible={marketInvestible}
                    setBeingEdited={mySetBeingEdited} beingEdited={beingEdited}
                    isEditableByUser={isEditableByUser}/>
                )}
              </div>
            </div>
            <div style={{paddingLeft: mobileLayout ? undefined : '8rem',
              paddingRight: mobileLayout ? undefined : '8rem', paddingTop: '2rem'}}>
              {(_.isEmpty(search) || displayApprovalsBySearch > 0) && (
                <>
                  <h2 id="approvals">
                    <FormattedMessage id="decisionInvestibleOthersVoting" />
                  </h2>
                  <Voting
                    investibleId={investibleId}
                    marketPresences={marketPresences}
                    investmentReasons={investmentReasonsSearched}
                    showExpiration={fullStage.has_expiration}
                    expirationMinutes={market.investment_expiration * 1440}
                    votingPageState={votingPageState}
                    updateVotingPageState={updateVotingPageState}
                    votingPageStateReset={votingPageStateReset}
                    votingAllowed={canVote}
                    yourPresence={yourPresence}
                    market={market}
                    groupId={groupId}
                    isAssigned={isAssigned}
                  />
                </>
              )}
              {(displayVotingInput || hasUsableVotingInput) && investibleId && (
                <>
                  <div style={{ paddingBottom: '1rem' }}/>
                  <YourVoting
                    investibleId={investibleId}
                    marketPresences={marketPresences}
                    comments={investmentReasonsSearched}
                    userId={userId}
                    market={market}
                    groupId={groupId}
                    votingPageState={votingPageState}
                    updateVotingPageState={updateVotingPageState}
                    votingPageStateReset={votingPageStateReset}
                    isAssigned={isAssigned}
                  />
                </>
              )}
              {displayVotingInput && investibleId && !isAssigned && (
                <h3>{intl.formatMessage({ id: 'orStructuredComment' })}</h3>
              )}
            </div>
          </>
        )}
        {sectionOpen !== 'descriptionVotingSection' && (
          <Grid container spacing={2}>
            <Grid item xs={12} style={{ marginTop: mobileLayout ? undefined : '15px' }}>
              {showCommentAddBox && (
                  <CommentAddBox
                    allowedTypes={allowedCommentTypes}
                    investible={investible}
                    marketInfo={marketInfo}
                    marketId={marketId}
                    groupId={groupId}
                    issueWarningId={isFurtherWork ? undefined : 'issueWarningPlanning'}
                    isInReview={isInReview}
                    isAssignee={isAssigned}
                    isStory
                    numProgressReport={reportComments.length}
                    nameDifferentiator={sectionOpen}
                  />
                )}
              <CommentBox
                comments={sectionComments.concat(replies)}
                marketId={marketId}
                allowedTypes={allowedCommentTypes}
                isRequiresInput={isRequiresInput}
                isInBlocking={isInBlocked}
                fullStage={fullStage}
                assigned={assigned}
                formerStageId={formerStageId}
                marketInfo={marketInfo}
                investible={marketInvestible}
              />
            </Grid>
          </Grid>
        )}
      </div>
    </Screen>
  );
}

PlanningInvestible.propTypes = {
  market: PropTypes.object.isRequired,
  marketInvestible: PropTypes.object.isRequired,
  marketPresences: PropTypes.arrayOf(PropTypes.object),
  investibleComments: PropTypes.arrayOf(PropTypes.object),
  investibles: PropTypes.arrayOf(PropTypes.object),
  investibleId: PropTypes.string.isRequired,
  userId: PropTypes.string.isRequired,
  inArchives: PropTypes.bool,
  hidden: PropTypes.bool
};

PlanningInvestible.defaultProps = {
  marketPresences: [],
  investibleComments: [],
  investibles: [],
  inArchives: false,
  hidden: false
};

export function rejectInvestible(marketId, investibleId, marketInvestible, commentsState, commentsDispatch, invDispatch,
  diffDispatch, marketStagesState) {
  const furtherWorkStage = getFurtherWorkStage(marketStagesState, marketId);
  const marketInfo = getMarketInfo(marketInvestible, marketId);
  const moveInfo = {
    marketId,
    investibleId,
    stageInfo: {
      current_stage_id: marketInfo.stage,
      stage_id: furtherWorkStage.id,
      open_for_investment: true
    },
  };
  return stageChangeInvestible(moveInfo)
    .then((newInv) => {
      onInvestibleStageChange(furtherWorkStage.id, newInv, investibleId, marketId, commentsState, commentsDispatch,
        invDispatch, diffDispatch, marketStagesState, undefined, furtherWorkStage);
      pushMessage(OPERATION_HUB_CHANNEL, { event: STOP_OPERATION, id: 'reject' });
    });
}

export function Assignments(props) {
  const { marketPresences, classes, assigned, showMoveMessage, toolTipId, toggleIconButton, assignmentColumnMessageId,
    highlighted } = props;
  const intl = useIntl();
  const metaClasses = useMetaDataStyles();
  const safeAssigned = assigned || [];
  const presences = safeAssigned.map((userId) => {
    const presence = marketPresences.find(presence => presence.id === userId)
    if (!presence) {
      return { name : 'Removed', id: null }
    }
    return presence
  });
  // sort all removed last, then by name
  const sortedAssigned = _.sortBy(presences, [((presence) => presence.id? 0 : 1), (presence) => presence.name]);
  return (
    <>
      {assignmentColumnMessageId && (
        <div style={{display: 'flex', flexDirection: 'row'}}>
          <b><FormattedMessage id={assignmentColumnMessageId} /></b>
          {toggleIconButton && (
            <Tooltip
              title={intl.formatMessage({ id: toolTipId })}
            >
              <IconButton
                style={{paddingTop: 0, marginBottom: 0, paddingBottom: 0, marginTop: '-0.25rem'}}
                onClick={toggleIconButton}
              >
                <PersonAddIcon htmlColor={ACTION_BUTTON_COLOR}/>
              </IconButton>
            </Tooltip>
          )}
        </div>
      )}
      <div className={classes.assignmentFlexRow}>
        {_.isEmpty(sortedAssigned) && showMoveMessage && (
          <Typography key="unassigned" component="li" style={{maxWidth: '8rem'}}>
            {intl.formatMessage({ id: 'reassignToMove' })}
          </Typography>
        )}
        {sortedAssigned.map((presence, index) => {
          const showAsPlaceholder = presence.placeholder_type === PLACEHOLDER;
          const isHighlighted = (highlighted || []).includes(presence.id);
          const myClassName = isHighlighted ? metaClasses.highlighted :
            (showAsPlaceholder ? metaClasses.archived : metaClasses.normal);
          const name = (presence.name || '').replace('@', ' ');
          return (
            <div
              style={{
                display: 'flex', alignItems: 'center', paddingRight: '0.5rem',
                paddingTop: `${index > 0 ? '0.5rem' : 0}`
              }}
              key={`${presence.id}${toolTipId}`}
            >
              {!showAsPlaceholder && (
                <Gravatar email={presence.email} name={presence.name} className={classes.smallGravatar}/>
              )}
              {isHighlighted && (
                <Tooltip
                  title={intl.formatMessage({ id: 'planningAcceptExplanation' })}
                >
                  <Typography component="li" className={myClassName}>
                    {name}
                  </Typography>
                </Tooltip>
              )}
              {!isHighlighted && (
                <Typography component="li" className={myClassName}>
                  {name}
                </Typography>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

export default PlanningInvestible;
