import React, { useContext, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { IconButton, makeStyles, Tooltip, Typography, useMediaQuery, useTheme } from '@material-ui/core';
import { useHistory } from 'react-router';
import { FormattedMessage, useIntl } from 'react-intl';
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
import { fixName, getMarketInfo, getVotesForInvestible } from '../../../utils/userFunctions';
import {
  getFullStage,
  getFurtherWorkStage,
  getInCurrentVotingStage, getInReviewStage, isAcceptedStage
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import EditMarketButton from '../../Dialog/EditMarketButton';
import CardType from '../../../components/CardType';
import PersonAddIcon from '@material-ui/icons/PersonAdd';
import { PLACEHOLDER } from '../../../constants/global';
import { stageChangeInvestible } from '../../../api/investibles';
import { allImagesLoaded, invalidEditEvent } from '../../../utils/windowUtils';
import Gravatar from '../../../components/Avatars/Gravatar';
import { calculateInvestibleVoters, useInvestibleVoters } from '../../../utils/votingUtils';
import { getCommenterPresences } from '../../Dialog/Planning/userUtils';
import { getPageReducerPage, usePageStateReducer } from '../../../components/PageState/pageStateHooks';
import { pushMessage } from '../../../utils/MessageBusUtils';
import {
  LOCK_INVESTIBLE,
  LOCK_INVESTIBLE_CHANNEL
} from '../../../contexts/InvestibesContext/investiblesContextMessages';
import { onInvestibleStageChange } from '../../../utils/investibleFunctions';
import { SearchResultsContext } from '../../../contexts/SearchResultsContext/SearchResultsContext';
import {
  ACTIVE_STAGE,
  APPROVAL_WIZARD_TYPE,
  JOB_COMMENT_WIZARD_TYPE,
  JOB_EDIT_WIZARD_TYPE, JOB_STAGE_WIZARD_TYPE
} from '../../../constants/markets';
import {
  OPERATION_HUB_CHANNEL,
  STOP_OPERATION
} from '../../../contexts/OperationInProgressContext/operationInProgressMessages';
import { GmailTabItem, GmailTabs } from '../../../containers/Tab/Inbox';
import {
  formInvestibleAddCommentLink, formInvestibleLink, formMarketLink,
  formWizardLink,
  navigate,
  preventDefaultAndProp
} from '../../../utils/marketIdPathFunctions';
import { filterToRoot } from '../../../contexts/CommentsContext/commentsContextHelper';
import { getStagesInfo } from '../../../utils/stageUtils';
import PlanningInvestibleNav, { useMetaDataStyles } from './PlanningInvestibleNav';
import { getIcon } from '../../../components/Comments/CommentEdit';
import GravatarAndName from '../../../components/Avatars/GravatarAndName';
import SpinningButton from '../../../components/SpinBlocking/SpinningButton';
import { wizardStyles } from '../../../components/AddNewWizards/WizardStylesContext';
import AddIcon from '@material-ui/icons/Add';
import CondensedTodos from './CondensedTodos';
import { DoneAll, ExpandLess } from '@material-ui/icons';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import DescriptionOrDiff from '../../../components/Descriptions/DescriptionOrDiff';
import { useInvestibleEditStyles } from '../InvestibleBodyEdit';
import { setUclusionLocalStorageItem } from '../../../components/localStorageUtils';
import DismissableText from '../../../components/Notifications/DismissableText';
import SpinningIconLabelButton from '../../../components/Buttons/SpinningIconLabelButton';
import { useGroupPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import EditIcon from '@material-ui/icons/Edit';
import { hasJobComment } from '../../../components/AddNewWizards/JobComment/AddCommentStep';
import Link from '@material-ui/core/Link';
import InfoIcon from '@material-ui/icons/Info';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';

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
      margin: theme.spacing(0, 2, 2, 0),
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
      paddingRight: '1rem',
      cursor: "url('/images/edit_cursor.svg') 0 24, pointer",
        maxWidth: '100%',
        flexBasis: '100%',
        paddingLeft: 'unset',
        borderLeft: 'none',
        marginLeft: 'unset'
      },
    fullWidth: {
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
      maxWidth: '11rem'
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
      display: 'flex',
      flexDirection: 'column',
      alignItems: "flex-start",
      '& > div': {
        borderRadius: '6px',
        marginBottom: '1rem'
      },
      flex: '1 0 auto',
      backgroundColor: '#8ABABF',
      height: '100%',
      zIndex: 9,
      position: 'fixed',
      top: '3.5rem',
      paddingLeft: '1rem',
      minWidth: '15rem',
      textOverflow: 'ellipsis',
    },
    mobileDetails: {
      overflowY: 'none',
      display: 'flex',
      flexDirection: 'column',
      alignItems: "flex-start",
      '& > div': {
        borderRadius: '6px',
        marginBottom: '1rem'
      },
      flex: '1 0 auto',
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
    sectionTitle: {
      fontWeight: 700
    },
    largeGravatar: {
      width: '45px',
      height: '45px',
    },
    smallGravatar: {
      width: '30px',
      height: '30px',
    }
  }),
  { name: "PlanningInvestible" }
);

export function useCollaborators(marketPresences, investibleComments, marketPresencesState, investibleId, marketId,
  returnPresences=false) {
  const investibleCommentorPresences = getCommenterPresences(marketPresences, investibleComments,
    marketPresencesState);
  const voters = useInvestibleVoters(marketPresences, investibleId, marketId, true);
  const concated = [...voters, ...investibleCommentorPresences];
  const presences = _.uniqBy(concated || [], 'id');
  if (returnPresences) {
    return presences;
  }
  return presences.map((presence) => presence.id);
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
  const editorBox = useRef(null);
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const leftNavBreak = useMediaQuery(theme.breakpoints.down('md'));
  const refToTop = useRef();
  const classes = usePlanningInvestibleStyles();
  const editClasses = useInvestibleEditStyles();
  const wizardClasses = wizardStyles();
  const [searchResults] = useContext(SearchResultsContext);
  const [investiblesState, investiblesDispatch] = useContext(InvestiblesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [marketsState] = useContext(MarketsContext);
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
  const { stage, assigned: invAssigned, ticket_code: ticketCode, former_stage_id: formerStageId, group_id: groupId,
    created_by: createdById } = marketInfo;
  const assigned = invAssigned || [];
  const { investible } = marketInvestible;
  const { name, description, locked_by: lockedBy, created_at: createdAt } = investible;
  const [marketStagesState] = useContext(MarketStagesContext);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [approvalsOpen, setApprovalsOpen] = useState(!_.isEmpty(calculateInvestibleVoters(investibleId, marketId, marketsState, 
    investiblesState, marketPresences, false)));
  const reportsCommentsSearched = investibleCommentsSearched.filter(
    comment => comment.comment_type === REPORT_TYPE
  );
  const [reportsOpen, setReportsOpen] = useState(!_.isEmpty(reportsCommentsSearched));
  const fullStage = getFullStage(marketStagesState, marketId, stage) || {};
  const [pageStateFull, pageDispatch] = usePageStateReducer('investible');
  const isAssigned = assigned.includes(userId);
  const [pageState, updatePageState] = getPageReducerPage(pageStateFull, pageDispatch, investibleId,
    {sectionOpen: fullStage.move_on_comment ? 'assistanceSection' :
        (isAcceptedStage(fullStage) && isAssigned ? 'tasksSection' : 'descriptionVotingSection')});
  const {
    sectionOpen,
    compressionHash,
    showDiff
  } = pageState;
  const inCurrentVotingStage = getInCurrentVotingStage(
    marketStagesState,
    marketId
  ) || {}
  const isInVoting = inCurrentVotingStage && stage === inCurrentVotingStage.id;
  const canVote = isInVoting && !inArchives;
  const yourPresence = marketPresences.find((presence) => presence.current_user);
  const createdBy = marketPresences.find((presence) => presence.id === createdById) || {};
  const yourVote = yourPresence?.investments?.find((investment) =>
    investment.investible_id === investibleId && !investment.deleted);
  const displayVotingInput = canVote && _.isEmpty(search) && !yourVote;
  const isSingleUser = useGroupPresences(groupId, marketId, marketPresences);

  useEffect(() => {
    if (hash && hash.length > 1 && !hidden && !hash.includes('header')) {
      const element = document.getElementById(hash.substring(1, hash.length));
      // Check if already on the right tab and only change tab if not
      if (!element) {
        if (hash.startsWith('#cv') || hash.startsWith('#approve')) {
          setApprovalsOpen(true);
          updatePageState({ sectionOpen: 'descriptionVotingSection' });
          history.replace(window.location.pathname + window.location.search);
        } else if (hash.startsWith('#start')) {
          updatePageState({ sectionOpen: 'tasksSection' });
          history.replace(window.location.pathname + window.location.search);
        } else if (hash.startsWith('#option')) {
          if (sectionOpen !== 'assistanceSection') {
            updatePageState({ sectionOpen: 'assistanceSection' });
            // Scroll context should send to the option now
          }
        } else if (hash.startsWith('#investibleCondensedTodos')) {
          updatePageState({ sectionOpen: 'descriptionVotingSection' });
        } else {
          const found = investibleComments.find((comment) => hash.includes(comment.id));
          if (!_.isEmpty(found)) {
            const rootComment = filterToRoot(investibleComments, found.id);
            if (!_.isEmpty(rootComment.investible_id)) {
              switch (rootComment.comment_type) {
                case TODO_TYPE:
                  if (sectionOpen !== 'tasksSection') {
                    updatePageState({ sectionOpen: 'tasksSection' });
                  }
                  break;
                case ISSUE_TYPE:
                case SUGGEST_CHANGE_TYPE:
                case QUESTION_TYPE:
                  if (found.comment_type === REPLY_TYPE) {
                    let newCompressionHash = undefined;
                    if (!_.isEmpty(compressionHash)) {
                      if (compressionHash[rootComment.id] !== false) {
                        newCompressionHash = { ...compressionHash, [rootComment.id]: false };
                      }
                    } else {
                      newCompressionHash = { [rootComment.id]: false };
                    }
                    if (newCompressionHash) {
                      updatePageState({ sectionOpen: 'assistanceSection', compressionHash: newCompressionHash });
                    } else {
                      if (sectionOpen !== 'assistanceSection') {
                        updatePageState({ sectionOpen: 'assistanceSection' });
                      }
                    }
                  } else {
                    if (sectionOpen !== 'assistanceSection') {
                      updatePageState({ sectionOpen: 'assistanceSection' });
                    }
                  }
                  break;
                case REPORT_TYPE:
                  if (sectionOpen !== 'descriptionVotingSection') {
                    updatePageState({ sectionOpen: 'descriptionVotingSection' });
                  }
                  break;
                default:
              }
            }
          }
        }
      }
    }
  }, [investibleComments, hash, sectionOpen, updatePageState, hidden, history, compressionHash]);

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
    isRequiresInput,
    isInNotDoing,
  } = stagesInfo;

  const myPresence = marketPresences.find((presence) => presence.current_user) || {};
  const inMarketArchives = isInNotDoing || isInVerified;
  const blockingCommentsUnresolved = investibleComments.filter(
    comment => comment.comment_type === ISSUE_TYPE && !comment.resolved
  );
  function canGetInput() {
    return _.isEmpty(blockingCommentsUnresolved) && !isInVerified && !isInNotDoing;
  }
  const suggestionComments = investibleComments.filter(
    comment => comment.comment_type === SUGGEST_CHANGE_TYPE
  );
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
  const unresolvedComments = investibleComments.filter(comment => !comment.resolved);
  const mustResolveComments = unresolvedComments.filter((comment) =>
    [ISSUE_TYPE, TODO_TYPE].includes(comment.comment_type)||
    ([QUESTION_TYPE, SUGGEST_CHANGE_TYPE].includes(comment.comment_type) &&
      (assigned || []).includes(comment.created_by)));
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
  const assistanceCommentsSearched = questionCommentsSearched.concat(suggestionCommentsSearched)
    .concat(blockingCommentsSearched);
  const replies = investibleComments.filter((comment => comment.comment_type === REPLY_TYPE));
  let allowedCommentTypes = [];
  let sectionComments = [];
  if (sectionOpen === 'tasksSection') {
    allowedCommentTypes = [TODO_TYPE];
    sectionComments = todoCommentsSearched;
  } else if (sectionOpen === 'assistanceSection') {
    if (canGetInput()) {
      allowedCommentTypes = [QUESTION_TYPE, SUGGEST_CHANGE_TYPE];
    }
    if (canOpenBlocking()) {
      allowedCommentTypes.push(ISSUE_TYPE);
    }
    sectionComments = assistanceCommentsSearched;
  }

  const invested = getVotesForInvestible(marketPresences, investibleId);

  function isEditableByUser() {
    const imagesLoaded = allImagesLoaded(editorBox?.current)
    return imagesLoaded && !inArchives;
  }

  function mySetBeingEdited(event) {
    if (!isEditableByUser() || invalidEditEvent(event, history)) {
      return;
    }
    const needsLock = !((isInReview || isInAccepted) && _.size(assigned) === 1) && lockedBy !== myPresence?.id;
    // Do not attempt to grab the lock from someone else here - have wizard for that
    if (needsLock && _.isEmpty(lockedBy)) {
      pushMessage(LOCK_INVESTIBLE_CHANNEL, { event: LOCK_INVESTIBLE, marketId, investibleId });
    }
    setUclusionLocalStorageItem(`name-editor-${investibleId}`, name);
    navigate(history, formWizardLink(JOB_EDIT_WIZARD_TYPE, marketId, investibleId));
  }

  const displayApprovalsBySearch = _.isEmpty(search) ? _.size(invested) : _.size(investmentReasonsSearched);

  function openSubSection(subSection) {
    updatePageState({sectionOpen: subSection});
  }

  const countReports =  _.size(reportsCommentsSearched);
  const title = ticketCode ? `${ticketCode} ${name}` : name;
  const descriptionSectionResults = _.isEmpty(search) ? 0 :
      ((results || []).find((item) => item.id === investibleId) ? 1 : 0) + _.size(investmentReasonsSearched)
    + countReports;
  const displayQuestionSection = canGetInput() || _.size(questionCommentsSearched) > 0;
  const displaySuggestionsSection = canGetInput() || _.size(suggestionCommentsSearched) > 0;
  const displayBockingSection = canOpenBlocking() || _.size(blockingCommentsSearched) > 0;
  const sections = ['descriptionVotingSection'];
  sections.push('tasksSection');
  const displayAssistanceSection = displayQuestionSection || displaySuggestionsSection || displayBockingSection;
  if (displayAssistanceSection) {
    sections.push('assistanceSection');
  }
  function getTagLabel(tagLabelId) {
    if (!_.isEmpty(search)) {
      return intl.formatMessage({ id: 'match' });
    }
    return intl.formatMessage({ id: tagLabelId });
  }
  const showCommentAdd = !inArchives && !isInNotDoing && !isInVerified && _.isEmpty(search) && marketId &&
    !_.isEmpty(investible) && !hidden;
  const investibleNav = <PlanningInvestibleNav investibles={investibles} name={name} market={market}
                                               marketInvestible={marketInvestible} classes={classes}
                                               investibleId={investibleId} yourVote={yourVote}
                                               userId={userId} myPresence={myPresence} isAssigned={isAssigned}
                                               pageState={pageState} marketPresences={marketPresences}
                                               assigned={assigned} isInVoting={isInVoting}
                                               investibleComments={investibleComments}
                                               marketInfo={marketInfo} marketId={marketId}
                                               updatePageState={updatePageState} />;
  function getUseCompression(commentId) {
    if (compressionHash) {
      const useCompression = compressionHash[commentId];
      if (useCompression !== undefined) {
        return useCompression;
      }
    }
    // Default compression to off as tasks are not compressed except on overview and that page is fine
    // Use find so button not there when no replies
    return investibleComments.find(comment => comment.reply_id === commentId) ? false : undefined;
  }

  function toggleUseCompression(commentId) {
    if (compressionHash) {
      const useCompression = !compressionHash[commentId];
      const newCompressionHash = {...compressionHash, [commentId]: useCompression};
      updatePageState({compressionHash: newCompressionHash});
    } else {
      updatePageState({compressionHash: {[commentId]: false}});
    }
  }

  function toggleDetails() {
    setDetailsOpen(!detailsOpen);
  }

  function toggleApprovals() {
    setApprovalsOpen(!approvalsOpen);
  }

  function toggleReports() {
    setReportsOpen(!reportsOpen);
  }

  return (
    <Screen
      title={title}
      tabTitle={name}
      hidden={hidden}
      noPadDesktop
      leftNavAdjust={mobileLayout ? undefined : (leftNavBreak ? 245 : 465)}
    >
      {!mobileLayout && (
        <div className={classes.paper} style={{ paddingTop: mobileLayout ? undefined : '2rem', paddingBottom: '1rem',
          transform: mobileLayout ? undefined :
          (leftNavBreak ? 'translateX(calc(100vw - 267px))' : 'translateX(calc(100vw - 480px))')}}>
          {investibleNav}
        </div>
      )}
      <GmailTabs
        value={sections.findIndex((section) => section === sectionOpen)}
        addPaddingLeft='2rem' addMarginLeft={leftNavBreak ? '-0.25rem' : undefined}
        onChange={(event, value) => {
          openSubSection(sections[value]);
          // Previous scroll position no longer relevant
          refToTop.current?.scrollIntoView({ block: "end" });
        }}
        useColor
        id='investible-header'
        indicatorColors={['#2F80ED', '#2F80ED', '#2F80ED']}
        style={{ paddingBottom: '0.25rem', zIndex: 8, position: mobileLayout ? undefined : 'fixed',
          paddingTop: mobileLayout ? undefined : '0.5rem', width: '100%', marginTop: '-15px', paddingLeft: 0,
          marginLeft: '-0.5rem' }}>
        <GmailTabItem icon={<InfoIcon />} tagLabel={getTagLabel('total')}
                      label={intl.formatMessage({id: 'descriptionVotingLabel'})}
                      toolTipId='jobOverviewToolTip'
                      tag={descriptionSectionResults === 0 ? undefined : `${descriptionSectionResults}`} />
        <GmailTabItem icon={getIcon(TODO_TYPE)} label={intl.formatMessage({id: 'taskSection'})}
                      toolTipId='jobTasksToolTip'
                      tag={countUnresolved(todoCommentsSearched, search)} tagLabel={getTagLabel('open')} />
        {displayAssistanceSection && (
          <GmailTabItem icon={getIcon(QUESTION_TYPE)} toolTipId='jobAssistanceToolTip'
                        label={intl.formatMessage({id: 'requiresInputStageLabel'})}
                        tag={countUnresolved(assistanceCommentsSearched, search)}
                        tagLabel={getTagLabel('open')} />
        )}
      </GmailTabs>
      <div style={{paddingLeft: mobileLayout ? undefined : '2rem', paddingRight: mobileLayout ? undefined : '1rem'}}>
        <div style={{paddingBottom: '0.5rem'}} ref={refToTop}></div>
        {sectionOpen === 'descriptionVotingSection' && (
          <>
            <div style={{display: 'flex', marginRight: mobileLayout ? undefined : '2rem'}}>
              <CardType
                isInAccepted={isInAccepted}
                isAssigned={isAssigned}
                className={classes.cardType}
                createdAt={mobileLayout ? undefined : createdAt}
                stageChangedAt={mobileLayout ? undefined : new Date(marketInfo.last_stage_change_date)}
                gravatar={<div style={{paddingLeft: '1rem'}}>
                  <GravatarAndName key={createdBy.id} email={createdBy.email}
                                   label={intl.formatMessage({ id: 'created_by' })}
                                   name={createdBy.name} typographyVariant="caption"
                                   avatarClassName={classes.smallGravatar}
                /></div>}
              />
              <div className={classes.editRow}>
                {mobileLayout && !inMarketArchives && isEditableByUser() && (
                  <div>
                    <EditMarketButton
                      labelId="edit"
                      marketId={marketId}
                      onClick={(event) => mySetBeingEdited(event)}
                    />
                  </div>
                )}
              </div>
            </div>
            <div className={mobileLayout? undefined : classes.votingCardContent}
                 style={{display: 'flex', paddingLeft: mobileLayout ? '10px' : undefined, backgroundColor: 'white',
                   paddingBottom: mobileLayout ? '20px' : undefined, marginBottom: '2rem'}}>
              <div className={isEditableByUser() ? classes.fullWidthEditable :
                classes.fullWidth} onClick={(event) =>
                mySetBeingEdited(event)}>
                {lockedBy && myPresence.id !== lockedBy && isEditableByUser() && (
                  <Typography>
                    {intl.formatMessage({ id: "lockedBy" }, { x: lockedByName })}
                  </Typography>
                )}
                {marketId && investibleId && (
                  <div className={isEditableByUser() ? editClasses.containerEditable : editClasses.container} 
                    style={{padding: '1rem'}}>
                    <Typography className={editClasses.title} variant="h3" component="h1">
                      {name}
                    </Typography>
                    <DescriptionOrDiff id={investibleId} description={description} showDiff={showDiff} backgroundColor='white' />
                  </div>
                )}
              </div>
            </div>
            {mobileLayout && (
              <div style={{marginBottom: '1rem'}}>
                <div style={{display: 'flex', alignItems: 'center'}}>
                  <h2 id="details" style={{marginBottom: 0, paddingBottom: 0, marginTop: 0, paddingTop: 0}}>
                    <FormattedMessage id="planningInvestibleOpenLabel" />
                  </h2>
                  <IconButton onClick={() => toggleDetails()} style={{marginBottom: 0,
                    paddingBottom: 0, marginTop: 0, paddingTop: 0}}>
                    <Tooltip key='toggleDetails'
                             title={<FormattedMessage id={`${detailsOpen ? 'closeDetails' : 'openDetails'}Tip`} />}>
                      {detailsOpen ? <ExpandLess fontSize='large' htmlColor='black' /> :
                        <ExpandMoreIcon fontSize='large' htmlColor='black' />}
                    </Tooltip>
                  </IconButton>
                </div>
                {detailsOpen && (
                  <div className={classes.mobileDetails}>
                    {investibleNav}
                  </div>
                )}
              </div>
            )}
            <CondensedTodos comments={todoCommentsSearched} investibleComments={investibleComments}
                            usePadding={!mobileLayout} useColor
                            marketId={marketId} marketInfo={marketInfo} groupId={groupId} isDefaultOpen={!_.isEmpty(todoCommentsSearched)}/>
              <div style={{
                marginTop: '3rem',
                paddingBottom: mobileLayout ? undefined : '15vh',
                paddingLeft: mobileLayout ? undefined : '1rem',
                paddingRight: mobileLayout ? undefined : '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <h2 id="approvals" style={{ marginBottom: 0, paddingBottom: 0, marginTop: 0, paddingTop: 0 }}>
                    <FormattedMessage id="decisionInvestibleOthersVoting"/>
                  </h2>
                  <IconButton id='approvalsToggleId' onClick={() => toggleApprovals()} style={{
                    marginBottom: 0,
                    paddingBottom: 0, marginTop: 0, paddingTop: 0
                  }}>
                    <Tooltip key="toggleApprovals"
                             title={<FormattedMessage
                               id={`${approvalsOpen ? 'closeApprovals' : 'openApprovals'}Tip`}/>}>
                      {approvalsOpen ? <ExpandLess fontSize="large" htmlColor="black"/> :
                        <ExpandMoreIcon fontSize="large" htmlColor="black"/>}
                    </Tooltip>
                  </IconButton>
                </div>
                {displayVotingInput && investibleId && approvalsOpen && (
                  <SpinningButton id="newApproval" className={wizardClasses.actionNext}
                                  icon={AddIcon} iconColor="black"
                                  style={{ display: 'flex', marginBottom: '1.5rem', marginTop: '0.5rem' }}
                                  variant="text" doSpin={false}
                                  onClick={() => navigate(history,
                                    formWizardLink(APPROVAL_WIZARD_TYPE, marketId, investibleId, groupId))}>
                    {intl.formatMessage({ id: 'createNewApproval'})}
                  </SpinningButton>
                )}
                {(_.isEmpty(search) || displayApprovalsBySearch > 0) && approvalsOpen && (
                  <Voting
                    investibleId={investibleId}
                    marketPresences={marketPresences}
                    investmentReasons={investmentReasonsSearched}
                    showExpiration={fullStage.has_expiration}
                    expirationMinutes={market.investment_expiration * 1440}
                    yourPresence={yourPresence}
                    showEmptyText={!displayVotingInput}
                    market={market}
                    groupId={groupId}
                    isAssigned={isAssigned}
                  />
                )}
                <div style={{ display: 'flex', alignItems: 'center', marginTop: '3rem' }}>
                  <h2 id="progress" style={{ marginBottom: 0, paddingBottom: 0, marginTop: 0, paddingTop: 0 }}>
                    <FormattedMessage id="reportsSectionLabel"/>
                  </h2>
                  <IconButton id='reportsToggleId' onClick={() => toggleReports()} style={{
                      marginBottom: 0,
                      paddingBottom: 0, marginTop: 0, paddingTop: 0
                    }}>
                    <Tooltip key="toggleReports"
                             title={<FormattedMessage
                               id={`${reportsOpen ? 'closeReports' : 'openReports'}Tip`}/>}>
                      {reportsOpen ? <ExpandLess fontSize="large" htmlColor="black"/> :
                        <ExpandMoreIcon fontSize="large" htmlColor="black"/>}
                    </Tooltip>
                  </IconButton>
                </div>
                {showCommentAdd && isAssigned && reportsOpen && (
                  <SpinningButton id="newReport" className={wizardClasses.actionNext}
                                  icon={hasJobComment(groupId, investibleId, REPORT_TYPE) ? EditIcon : AddIcon}
                                  iconColor="black"
                                  variant="text" doSpin={false}
                                  style={{ display: 'flex', marginTop: '0.75rem', marginBottom:
                                      _.isEmpty(reportsCommentsSearched) ? '1.75rem' : '0.75rem' }}
                                  onClick={() => navigate(history,
                                    formInvestibleAddCommentLink(JOB_COMMENT_WIZARD_TYPE, investibleId, marketId,
                                      REPORT_TYPE))}>
                    {intl.formatMessage({ id: 'createNewStatus'})}
                  </SpinningButton>
                )}
                {!isSingleUser && reportsOpen && (
                  <DismissableText textId="progressReportCommentHelp"
                                   display={isAssigned && _.isEmpty(reportsCommentsSearched)} isLeft
                                   text={<div>
                                     Your report asks the view members to review progress on this job.
                                   </div>
                                   }/>
                )}
                {(!showCommentAdd || !isAssigned) && _.isEmpty(reportsCommentsSearched) && reportsOpen && (
                  <Typography style={{ marginLeft: 'auto', marginRight: 'auto', marginTop: '0.75rem' }}
                              variant="body1">
                    No progress reports.
                  </Typography>
                )}
                {reportsOpen && (
                  <CommentBox
                    comments={reportsCommentsSearched.concat(replies)}
                    marketId={marketId}
                    isRequiresInput={isRequiresInput}
                    isInBlocking={isInBlocked}
                    fullStage={fullStage}
                    assigned={assigned}
                    formerStageId={formerStageId}
                    marketInfo={marketInfo}
                    investible={marketInvestible}
                    usePadding={false}
                  />
                )}
              </div>
          </>
        )}
        {sectionOpen !== 'descriptionVotingSection' && (
          <>
            {showCommentAdd && !_.isEmpty(allowedCommentTypes) && (
              <div style={{ display: mobileLayout ? undefined : 'flex', marginLeft: '0.5rem' }}>
                {allowedCommentTypes.map((allowedCommentType) => {
                  return (
                    <SpinningButton id={`new${allowedCommentType}`} className={wizardClasses.actionNext}
                                    icon={hasJobComment(groupId, investibleId, allowedCommentType) ? EditIcon :
                                      AddIcon}
                                    iconColor="black"
                                    style={{
                                      display: 'flex', marginTop: '1.75rem',
                                      marginRight: mobileLayout ? undefined : '2rem', marginBottom: '0.75rem'
                                    }}
                                    toolTipId={
                      [TODO_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE, ISSUE_TYPE].includes(allowedCommentType) ?
                                      `hotKey${allowedCommentType}`: undefined}
                                    variant="text" doSpin={false}
                                    onClick={() => navigate(history,
                                      formInvestibleAddCommentLink(JOB_COMMENT_WIZARD_TYPE, investibleId, marketId,
                                        allowedCommentType))}>
                      {intl.formatMessage({ id: `createNew${allowedCommentType}${mobileLayout ? 'Mobile' : ''}`})}
                    </SpinningButton>
                  );
                })}
                {sectionOpen === 'tasksSection' && !_.isEmpty(assigned) && showCommentAdd && !isInReview && (
                  <SpinningButton id='allDone' className={wizardClasses.actionNext} iconColor="black"
                                  toolTipId='allDone' icon={DoneAll}
                                  doSpin={_.isEmpty(mustResolveComments)&&isSingleUser}
                                  onClick={() => {
                                    const inReviewStageId = getInReviewStage(marketStagesState, marketId).id;
                                    // If not single user then need wizard anyway for starting a review
                                    if (_.isEmpty(mustResolveComments)&&isSingleUser) {
                                      const moveInfo = {
                                        marketId,
                                        investibleId,
                                        stageInfo: {
                                          current_stage_id: stage,
                                          stage_id: inReviewStageId
                                        },
                                      };
                                      return stageChangeInvestible(moveInfo)
                                        .then((newInv) => {
                                          onInvestibleStageChange(inReviewStageId, newInv, investibleId, marketId,
                                            undefined, undefined, investiblesDispatch,
                                            () => {}, marketStagesState, undefined, fullStage);
                                          setOperationRunning(false);
                                          navigate(history, formMarketLink(marketId, groupId));
                                        });
                                    }
                                    if (_.isEmpty(mustResolveComments)) {
                                      navigate(history, `${formWizardLink(JOB_STAGE_WIZARD_TYPE, marketId,
                                        investibleId)}&stageId=${inReviewStageId}&isAssign=false`);
                                    } else {
                                      navigate(history, `${formWizardLink(JOB_STAGE_WIZARD_TYPE, marketId,
                                        investibleId)}&stageId=${inReviewStageId}`);
                                    }
                                  }}
                                  style={{
                                    display: 'flex', marginTop: '1.75rem',
                                    marginRight: mobileLayout ? undefined : '2rem', marginBottom: '0.75rem'
                                  }}>
                    {intl.formatMessage({ id: 'allDoneButton'})}
                  </SpinningButton>
                )}
                {sectionOpen === 'tasksSection' && (
                  <div style={{marginTop: '2.25rem', fontWeight: 'bold'}}><Link
                    href={`${formInvestibleLink(marketId, investibleId)}#investibleCondensedTodos`}
                    color="primary"
                    onClick={(event) => {
                    preventDefaultAndProp(event);
                    navigate(history, `${formInvestibleLink(marketId, investibleId)}#investibleCondensedTodos`);
                  }}>Overview of tasks</Link></div>
                )}
              </div>
            )}
            <DismissableText textId="investibleCommentHelp" display={_.isEmpty(sectionComments)} noPad isLeft
                             text={
                               sectionOpen === 'assistanceSection' ? (
                                 <ul style={{ paddingLeft: 0, marginLeft: '1rem' }}>
                                   <li>Question - invites others to add voteable options for brainstorming</li>
                                   <li>Suggestion - others vote on this idea and then can be converted to a task</li>
                                   <li>Blocking issue - asks for help clearing the blocker</li>
                                 </ul>) : (<div>Tasks can be moved between jobs or converted to or from bugs.</div>)
                             }/>
            <CommentBox
              comments={sectionComments.concat(replies)}
              marketId={marketId}
              isRequiresInput={isRequiresInput}
              isInBlocking={isInBlocked}
              fullStage={fullStage}
              assigned={assigned}
              formerStageId={formerStageId}
              marketInfo={marketInfo}
              investible={marketInvestible}
              toggleCompression={sectionOpen === 'assistanceSection' ? toggleUseCompression : undefined}
              useCompression={sectionOpen === 'assistanceSection' ? getUseCompression : undefined}
              useInProgressSorting={sectionOpen === 'tasksSection'}
            />
          </>
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

export function rejectInvestible (marketId, investibleId, marketInvestible, commentsState, commentsDispatch, invDispatch,
  diffDispatch, marketStagesState, marketPresencesDispatch) {
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
        invDispatch, diffDispatch, marketStagesState, undefined, furtherWorkStage, marketPresencesDispatch);
      pushMessage(OPERATION_HUB_CHANNEL, { event: STOP_OPERATION, id: 'reject' });
    });
}

export function Assignments(props) {
  const { marketPresences, classes, assigned, toolTipId, toggleIconButton, assignmentColumnMessageId,
    unaccceptedList, isLarge } = props;
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
          {isLarge && (
            <Typography>
              {intl.formatMessage({ id: assignmentColumnMessageId })}
            </Typography>
          )}
          {!isLarge && (
            <b><FormattedMessage id={assignmentColumnMessageId} /></b>
          )}
          {toggleIconButton && (
              <SpinningIconLabelButton
                icon={PersonAddIcon}
                iconOnly
                doSpin={false}
                id={toolTipId}
                whiteBackground
                style={{marginLeft: '1rem', paddingTop: 0, marginBottom: 0, paddingBottom: 0, marginTop: '-0.25rem'}}
                onClick={toggleIconButton}
              />
          )}
        </div>
      )}
      <div className={classes.assignmentFlexRow}>
        {sortedAssigned.map((presence, index) => {
          const showAsPlaceholder = presence.placeholder_type === PLACEHOLDER;
          const unacccepted = unaccceptedList?.includes(presence.id);
          const myClassName = showAsPlaceholder ? metaClasses.archived : metaClasses.normal;
          const name = fixName(presence.name);
          return (
            <div
              style={{
                display: 'flex', alignItems: 'center', paddingRight: '0.5rem',
                paddingTop: `${index > 0 ? '0.5rem' : 0}`
              }}
              key={`${presence.id}${toolTipId}`}
            >
              {!showAsPlaceholder && (
                <Gravatar email={presence.email} name={presence.name}
                          className={isLarge ? classes.largeGravatar : classes.smallGravatar}/>
              )}
              <div>
                <Typography component="li" className={myClassName}>
                  {name}
                </Typography>
                {unacccepted && (
                  <Tooltip
                    title={intl.formatMessage({ id: 'planningAcceptExplanation' })}
                  >
                    <Typography component="li" style={{fontSize: 12, background: '#ffdcdf',
                      paddingRight: '5px', paddingLeft: '5px'}}>
                      {intl.formatMessage({ id: 'planningUnacceptedLabel' })}
                    </Typography>
                  </Tooltip>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export default PlanningInvestible;
