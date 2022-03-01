import React, { useContext, useState } from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'
import {
  Card,
  CardContent, Checkbox, FormControl, FormControlLabel,
  Grid,
  IconButton, Link,
  makeStyles,
  MenuItem, Select,
  Tooltip,
  Typography, useMediaQuery, useTheme
} from '@material-ui/core'
import { useHistory } from 'react-router'
import { FormattedMessage, useIntl } from 'react-intl'
import YourVoting from '../Voting/YourVoting'
import Voting from '../Decision/Voting'
import CommentBox, { getSortedRoots } from '../../../containers/CommentBox/CommentBox'
import {
  ISSUE_TYPE,
  JUSTIFY_TYPE,
  QUESTION_TYPE,
  REPORT_TYPE,
  SUGGEST_CHANGE_TYPE,
  TODO_TYPE
} from '../../../constants/comments'
import {
  baseNavListItem,
  formInvestibleLink,
  formMarketArchivesLink,
  formMarketLink,
  makeBreadCrumbs,
} from '../../../utils/marketIdPathFunctions'
import Screen from '../../../containers/Screen/Screen'
import CommentAddBox from '../../../containers/CommentBox/CommentAddBox'
import MoveToNextVisibleStageActionButton from './MoveToNextVisibleStageActionButton'
import { assignedInStage, getMarketInfo, getVotesForInvestible } from '../../../utils/userFunctions'
import {
  getAcceptedStage,
  getBlockedStage,
  getFullStage,
  getFurtherWorkStage,
  getInCurrentVotingStage,
  getInReviewStage,
  getNotDoingStage,
  getRequiredInputStage,
  getVerifiedStage
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper'
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext'
import MoveToVerifiedActionButton from './MoveToVerifiedActionButton'
import MoveToVotingActionButton from './MoveToVotingActionButton'
import MoveToNotDoingActionButton from './MoveToNotDoingActionButton'
import MoveToAcceptedActionButton from './MoveToAcceptedActionButton'
import MoveToInReviewActionButton from './MoveToInReviewActionButton'
import EditMarketButton from '../../Dialog/EditMarketButton'
import CardType from '../../../components/CardType'
import clsx from 'clsx'
import DismissableText from '../../../components/Notifications/DismissableText'
import PersonAddIcon from '@material-ui/icons/PersonAdd'
import { EMPTY_SPIN_RESULT, PLACEHOLDER } from '../../../constants/global'
import {
  addInvestible,
  getMarketLabels,
  refreshInvestibles
} from '../../../contexts/InvestibesContext/investiblesContextHelper'
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'
import AddIcon from '@material-ui/icons/Add'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import MoveToFurtherWorkActionButton from './MoveToFurtherWorkActionButton'
import { DaysEstimate } from '../../../components/AgilePlan'
import { ACTION_BUTTON_COLOR, HIGHLIGHTED_BUTTON_COLOR } from '../../../components/Buttons/ButtonConstants'
import AttachedFilesList from '../../../components/Files/AttachedFilesList'
import {
  acceptInvestible,
  attachFilesToInvestible,
  changeLabels,
  deleteAttachedFilesFromInvestible, stageChangeInvestible,
  updateInvestible
} from '../../../api/investibles'
import { DiffContext } from '../../../contexts/DiffContext/DiffContext'
import ShareStoryButton from './ShareStoryButton'
import Chip from '@material-ui/core/Chip'
import Autocomplete from '@material-ui/lab/Autocomplete'
import TextField from '@material-ui/core/TextField'
import EventIcon from '@material-ui/icons/Event';
import DatePicker from 'react-datepicker'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import { doSetEditWhenValid, invalidEditEvent } from '../../../utils/windowUtils'
import Gravatar from '../../../components/Avatars/Gravatar';
import { getInvestibleVoters } from '../../../utils/votingUtils';
import { getCommenterPresences, inVerifedSwimLane } from '../../Dialog/Planning/userUtils';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext'
import {
  findMessageOfType,
  findMessageOfTypeAndId,
  findMessagesForInvestibleId
} from '../../../utils/messageUtils'
import { removeMessage } from '../../../contexts/NotificationsContext/notificationsContextReducer'
import QuestionIcon from '@material-ui/icons/ContactSupport'
import UpdateIcon from '@material-ui/icons/Update'
import BlockIcon from '@material-ui/icons/Block'
import ChangeSuggstionIcon from '@material-ui/icons/ChangeHistory'
import ListAltIcon from '@material-ui/icons/ListAlt'
import EditIcon from '@material-ui/icons/Edit'
import ThumbsUpDownIcon from '@material-ui/icons/ThumbsUpDown'
import { getFakeCommentsArray } from '../../../utils/stringFunctions'
import { ExpandLess, Inbox, QuestionAnswer, SettingsBackupRestore } from '@material-ui/icons'
import InvestibleBodyEdit from '../InvestibleBodyEdit';
import { getPageReducerPage, usePageStateReducer } from '../../../components/PageState/pageStateHooks'
import { pushMessage } from '../../../utils/MessageBusUtils'
import {
  LOCK_INVESTIBLE,
  LOCK_INVESTIBLE_CHANNEL
} from '../../../contexts/InvestibesContext/investiblesContextMessages'
import SpinningIconLabelButton from '../../../components/Buttons/SpinningIconLabelButton'
import { getDiff, markDiffViewed } from '../../../contexts/DiffContext/diffContextHelper'
import { notify, onInvestibleStageChange } from '../../../utils/investibleFunctions'
import { UNASSIGNED_TYPE, YELLOW_LEVEL } from '../../../constants/notifications'
import { SearchResultsContext } from '../../../contexts/SearchResultsContext/SearchResultsContext'
import WarningDialog from '../../../components/Warnings/WarningDialog'
import { useLockedDialogStyles } from '../../Dialog/DialogBodyEdit'
import InputLabel from '@material-ui/core/InputLabel'
import PlanningInvestibleEdit from './PlanningInvestibleEdit'
import {
  removeInvestibleInvestments
} from '../../../contexts/MarketPresencesContext/marketPresencesHelper'
import { setUclusionLocalStorageItem } from '../../../components/localStorageUtils'
import {
  BLOCKED_STORY_TOUR,
  REQUIRES_INPUT_STORY_TOUR
} from '../../../contexts/TourContext/tourContextHelper'
import UclusionTour from '../../../components/Tours/UclusionTour'
import { blockedStorySteps } from '../../../components/Tours/blockedStory'
import { requiresInputStorySteps } from '../../../components/Tours/requiresInputStory'
import { getTomorrow } from '../../../utils/timerUtils'
import AgilePlanIcon from '@material-ui/icons/PlaylistAdd'
import SpinningButton from '../../../components/SpinBlocking/SpinningButton'
import { removeWorkListItem, workListStyles } from '../../Home/YourWork/WorkListItem'
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext'
import { ACTIVE_STAGE } from '../../../constants/markets'
import {
  OPERATION_HUB_CHANNEL, START_OPERATION,
  STOP_OPERATION
} from '../../../contexts/OperationInProgressContext/operationInProgressMessages'

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
      marginLeft: '30px',
      [theme.breakpoints.down("sm")]: {
        marginLeft: '0',
        flexDirection: 'column',
        paddingBottom: '1rem'
      }
    },
    labelChip: {
      paddingRight: '10px',
      paddingTop: '0.5rem',
      maxHeight: '1rem',
      [theme.breakpoints.down("sm")]: {
        paddingRight: 0,
        paddingTop: 'unset',
        maxHeight: 'unset',
        paddingBottom: '5px'
      }
    },
    labelExplain: {
      marginLeft: '10px',
      width: 90,
      [theme.breakpoints.down("sm")]: {
        width: 'auto',
      }
    },
    fullWidthEditable: {
      paddingLeft: '2rem',
      paddingTop: '1rem',
      cursor: "url('/images/edit_cursor.svg') 0 24, pointer",
      [theme.breakpoints.down("sm")]: {
        maxWidth: '100%',
        flexBasis: '100%',
        paddingLeft: 'unset',
        borderLeft: 'none',
        marginLeft: 'unset'
      }
    },
    fullWidth: {
      paddingLeft: '2rem',
      paddingTop: '1rem',
      [theme.breakpoints.down("sm")]: {
        maxWidth: '100%',
        flexBasis: '100%',
        paddingLeft: 'unset',
        borderLeft: 'none',
        marginLeft: 'unset'
      }
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
      display: 'flex',
      paddingTop: '0.5rem'
    },
    rolesRoot: {
      alignItems: "flex-start",
      display: "flex",
      flexDirection: 'column',
      '& > div': {
        borderRadius: '6px',
        marginBottom: '1rem'
      }
    },
    group: {
      backgroundColor: '#ecf0f1',
      borderRadius: 6,
      display: "flex",
      flexDirection: "row",
      padding: theme.spacing(1, 1),
      "&:first-child": {
        marginLeft: 0
      },
      [theme.breakpoints.down("sm")]: {
        backgroundColor: '#fff',
      }
    },
  }),
  { name: "PlanningInvestible" }
);

export function commonSetBeingEdited(event, isEdit, lockedBy, userId, isEditableByUser, updatePageState, investibleId,
  name, history, marketId) {
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
  return pushMessage(LOCK_INVESTIBLE_CHANNEL, { event: LOCK_INVESTIBLE, marketId, investibleId });
}

export function getCollaborators(marketPresences, investibleComments, marketPresencesState, investibleId) {
  const investibleCommentorPresences = getCommenterPresences(marketPresences, investibleComments, marketPresencesState);
  const voters = getInvestibleVoters(marketPresences, investibleId);
  const concated = [...voters, ...investibleCommentorPresences];
  return _.uniq((concated || []).map((presence) => presence.id));
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
    isAdmin,
    hidden
  } = props;
  const lockedDialogClasses = useLockedDialogStyles();
  const [open, setOpen] = useState(false);
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const classes = usePlanningInvestibleStyles();
  const [investiblesState, investiblesDispatch] = useContext(InvestiblesContext);
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const [marketPresencesState, marketPresencesDispatch] = useContext(MarketPresencesContext);
  const [, diffDispatch] = useContext(DiffContext);
  const [searchResults] = useContext(SearchResultsContext);
  const { results, parentResults, search } = searchResults;
  const [newLabel, setNewLabel] = useState(undefined);
  const [showDatepicker, setShowDatepicker] = useState(false);
  const [clearMeHack, setClearMeHack] = useState('a');
  const [labelFocus, setLabelFocus] = useState(false);
  const { name: marketName, id: marketId, market_stage: marketStage } = market;
  const inArchives = marketStage !== ACTIVE_STAGE;
  const labels = getMarketLabels(investiblesState, marketId);
  const investmentReasonsRemoved = investibleComments.filter(comment => comment.comment_type !== JUSTIFY_TYPE) || [];
  const investmentReasons = investibleComments.filter((comment) => {
    if (_.isEmpty(search)) {
      return comment.comment_type === JUSTIFY_TYPE;
    }
    return comment.comment_type === JUSTIFY_TYPE && (results.find((item) => item.id === comment.id)
      || parentResults.find((id) => id === comment.id));
  });
  const investibleCollaborators = getCollaborators(marketPresences, investibleComments, marketPresencesState,
    investibleId);
  const marketInfo = getMarketInfo(marketInvestible, marketId) || {};
  const { stage, assigned: invAssigned, completion_estimate: marketDaysEstimate,
    required_approvers:  requiredApprovers, required_reviews: requiredReviewers, ticket_code: ticketCode,
    open_for_investment: openForInvestment, former_stage_id: formerStageId, accepted } = marketInfo;
  const assigned = invAssigned || [];
  const { investible } = marketInvestible;
  const { name, locked_by: lockedBy, created_at: createdAt, label_list: originalLabelList } = investible;
  const [marketStagesState] = useContext(MarketStagesContext);
  const [pageStateFull, pageDispatch] = usePageStateReducer('investible');
  const [pageState, updatePageState, pageStateReset] = getPageReducerPage(pageStateFull, pageDispatch, investibleId);
  const {
    beingEdited,
    editCollaborators
  } = pageState;

  const [votingPageStateFull, votingPageDispatch] = usePageStateReducer('voting')
  const [votingPageState, updateVotingPageState, votingPageStateReset] =
    getPageReducerPage(votingPageStateFull, votingPageDispatch, investibleId)
  const inCurrentVotingStage = getInCurrentVotingStage(
    marketStagesState,
    marketId
  ) || {}
  const isInVoting = inCurrentVotingStage && stage === inCurrentVotingStage.id
  const isAssigned = assigned.includes(userId);
  const canVote = isInVoting && !inArchives && (!isAssigned || market.assigned_can_approve)
  const yourPresence = marketPresences.find((presence) => presence.current_user);
  const yourVote = yourPresence && yourPresence.investments &&
    yourPresence.investments.find((investment) => investment.investible_id === investibleId && !investment.deleted)
  // If you have a vote already then do not display voting input
  const displayVotingInput = canVote && !yourVote && _.isEmpty(search)

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

  const [operationRunning, setOperationRunning] = useContext(OperationInProgressContext);
  const inReviewStage = getInReviewStage(marketStagesState, marketId) || {};
  const isInReview = inReviewStage && stage === inReviewStage.id;
  const inAcceptedStage = getAcceptedStage(marketStagesState, marketId) || {};
  const isInAccepted = inAcceptedStage && stage === inAcceptedStage.id;
  const inBlockedStage = getBlockedStage(marketStagesState, marketId) || {};
  const isInBlocked = inBlockedStage && stage === inBlockedStage.id;
  const inVerifiedStage = getVerifiedStage(marketStagesState, marketId) || {};
  const isInVerified = inVerifiedStage && stage === inVerifiedStage.id;
  const furtherWorkStage = getFurtherWorkStage(marketStagesState, marketId) || {};
  const isReadyFurtherWork = furtherWorkStage && stage === furtherWorkStage.id;
  const requiresInputStage = getRequiredInputStage(marketStagesState, marketId) || {};
  const isRequiresInput = requiresInputStage && stage === requiresInputStage.id;
  const notDoingStage = getNotDoingStage(marketStagesState, marketId);
  const isInNotDoing = notDoingStage && stage === notDoingStage.id;
  const displayEdit = isAdmin && !inArchives && (isAssigned || isInNotDoing || isInVoting || isReadyFurtherWork || isRequiresInput);
  const myPresence = marketPresences.find((presence) => presence.current_user) || {};
  const fullStage = getFullStage(marketStagesState, marketId, stage) || {};
  const inMarketArchives = isInNotDoing || isInVerified;
  const reportMessage = findMessageOfType('REPORT_REQUIRED', investibleId, messagesState);
  const breadCrumbTemplates = [
    { name: marketName, link: formMarketLink(marketId) }
  ];
  if (inMarketArchives && !inVerifedSwimLane(marketInvestible, investibles, inVerifiedStage, marketId)) {
    breadCrumbTemplates.push({
      name: intl.formatMessage({ id: "dialogArchivesLabel" }),
      link: formMarketArchivesLink(marketId)
    });
  }
  const breadCrumbs = makeBreadCrumbs(history, breadCrumbTemplates);
  function canGetInput() {
    const blockingComments = investibleComments.filter(
      comment => comment.comment_type === ISSUE_TYPE && !comment.resolved
    );
    return _.isEmpty(blockingComments) && !isInVerified && !isInNotDoing;
  }
  function canOpenBlocking() {
    const assignedInputComments = investibleComments.filter(
      comment => (comment.comment_type === QUESTION_TYPE || comment.comment_type === SUGGEST_CHANGE_TYPE)
        && !comment.resolved && assigned.includes(comment.created_by)
    );
    return _.isEmpty(assignedInputComments) && !isInVerified && !isInNotDoing;
  }
  const allowedCommentTypes =  [TODO_TYPE];
  if (!isInVoting && !isReadyFurtherWork) {
    allowedCommentTypes.push(REPORT_TYPE);
  }
  if (canGetInput()) {
    allowedCommentTypes.push(QUESTION_TYPE);
    allowedCommentTypes.push(SUGGEST_CHANGE_TYPE);
  }
  if (canOpenBlocking()) {
    allowedCommentTypes.push(ISSUE_TYPE);
  }

  const invested = getVotesForInvestible(marketPresences, investibleId);
  const assignedNotAccepted = assigned.filter((assignee) => !(accepted || []).includes(assignee));

  function changeLabelsAndQuickAdd(marketId, investibleId, newLabels) {
    return changeLabels(marketId, investibleId, newLabels).then((fullInvestible) =>{
      refreshInvestibles(investiblesDispatch, diffDispatch, [fullInvestible]);
    });
  }

  function deleteLabel(aLabel) {
    const newLabels = originalLabelList.filter((label) => aLabel !== label) || [];
    changeLabelsAndQuickAdd(marketId, investibleId, newLabels);
  }

  function labelInputOnChange(event, value) {
    setNewLabel(value);
  }

  function labelInputFocus() {
    setLabelFocus(!labelFocus);
  }

  function addLabel() {
    const newLabels = [...originalLabelList, newLabel];
    changeLabelsAndQuickAdd(marketId, investibleId, newLabels);
    setNewLabel(undefined);
    setClearMeHack(clearMeHack+clearMeHack);
  }

  const assignedInAcceptedStage = assigned.reduce((acc, userId) => {
    return acc.concat(assignedInStage(
      investibles,
      userId,
      inAcceptedStage.id,
      marketId
    ));
  }, []);
  const blockingComments = investibleComments.filter(
    comment => comment.comment_type === ISSUE_TYPE && !comment.resolved
  );
  const todoComments = investibleComments.filter(
    comment => comment.comment_type === TODO_TYPE && !comment.resolved
  );
  const numProgressReport = investibleComments.filter(comment => comment.comment_type === REPORT_TYPE)||[];
  const questionByAssignedComments = investibleComments.filter(
    comment => comment.comment_type === QUESTION_TYPE && !comment.resolved && assigned.includes(comment.created_by)
  );
  const acceptedFull = inAcceptedStage.allowed_investibles > 0
    && assignedInAcceptedStage.length >= inAcceptedStage.allowed_investibles;
  function getStageActions() {
    if (inArchives) {
      return []
    }
    const notAssigned = isReadyFurtherWork || isInNotDoing
    const menuItems = [
      <MenuItem
        key={(getInCurrentVotingStage(marketStagesState, marketId) || {}).id}
        value={(getInCurrentVotingStage(marketStagesState, marketId) || {}).id}
      >
        <MoveToVotingActionButton
          investibleId={investibleId}
          marketId={marketId}
          currentStageId={stage}
          disabled={isInVoting || !_.isEmpty(blockingComments) || notAssigned}
          hasAssignedQuestions={!_.isEmpty(questionByAssignedComments)}
        />
      </MenuItem>,
      <MenuItem
        key={(getAcceptedStage(marketStagesState, marketId) || {}).id}
        value={(getAcceptedStage(marketStagesState, marketId) || {}).id}
        >
        <MoveToAcceptedActionButton
          investibleId={investibleId}
          marketId={marketId}
          currentStageId={stage}
          full={isInAccepted ? false : acceptedFull}
          disabled={isInAccepted || !isAssigned || !_.isEmpty(blockingComments) || notAssigned}
          hasAssignedQuestions={!_.isEmpty(questionByAssignedComments)}
        />
      </MenuItem>,
      <MenuItem
        key={(getInReviewStage(marketStagesState, marketId) || {}).id}
        value={(getInReviewStage(marketStagesState, marketId) || {}).id}
        >
        <MoveToInReviewActionButton
          investibleId={investibleId}
          marketId={marketId}
          currentStageId={stage}
          disabled={isInReview || !_.isEmpty(blockingComments) || notAssigned}
          hasAssignedQuestions={!_.isEmpty(questionByAssignedComments)}
        />
      </MenuItem>,
      <MenuItem
        key={(getFurtherWorkStage(marketStagesState, marketId) || {}).id}
        value={(getFurtherWorkStage(marketStagesState, marketId) || {}).id}
        >
        <MoveToFurtherWorkActionButton
          investibleId={investibleId}
          marketId={marketId}
          currentStageId={stage}
          disabled={isReadyFurtherWork}
        />
      </MenuItem>,
      <MenuItem
        key={(getVerifiedStage(marketStagesState, marketId) || {}).id}
        value={(getVerifiedStage(marketStagesState, marketId) || {}).id}
        >
        <MoveToVerifiedActionButton
          investibleId={investibleId}
          marketId={marketId}
          currentStageId={stage}
          disabled={isInVerified || !_.isEmpty(blockingComments) || notAssigned}
          hasTodos={!_.isEmpty(todoComments)}
        />
      </MenuItem>,
      <MenuItem
        key={(getNotDoingStage(marketStagesState, marketId) || {}).id}
        value={(getNotDoingStage(marketStagesState, marketId) || {}).id}
      >
        <MoveToNotDoingActionButton
          investibleId={investibleId}
          marketId={marketId}
          currentStageId={stage}
          disabled={isInNotDoing}
        />
      </MenuItem>
    ];
    if (isInBlocked) {
      menuItems.unshift(
        <MenuItem value={inBlockedStage.id} key={inBlockedStage.id}>
          <FormattedMessage id="planningBlockedStageLabel"/>
        </MenuItem>
      )
    }
    if (isRequiresInput) {
      menuItems.unshift(
        <MenuItem value={requiresInputStage.id} key={requiresInputStage.id}>
          <FormattedMessage id="requiresInputHeader"/>
        </MenuItem>
      )
    }
    return menuItems
  }

  const todoWarning = isInVoting || isReadyFurtherWork || isInBlocked || isRequiresInput ? null : 'todoWarningPlanning';
  function toggleAssign() {
    updatePageState({editCollaborators: 'assign'});
  }
  function toggleEdit() {
    setShowDatepicker(!showDatepicker);
  }

  function getStartDate() {
    if (marketDaysEstimate && createdAt) {
      const nowDate = new Date();
      const daysEstimate = new Date(marketDaysEstimate);
      if (daysEstimate > nowDate) {
        return daysEstimate
      }
    }
    return undefined;
  }
  function handleDateChange(date) {
    const daysEstimate = marketDaysEstimate ? new Date(marketDaysEstimate) : undefined;
    if (!_.isEqual(date, daysEstimate)) {
      toggleEdit();
      const updateInfo = {
        marketId,
        investibleId,
        daysEstimate: date,
      };
      setOperationRunning(true);
      return updateInvestible(updateInfo).then((fullInvestible) => {
        refreshInvestibles(investiblesDispatch, diffDispatch, [fullInvestible]);
        if (reportMessage) {
          messagesDispatch(removeMessage(reportMessage));
        }
        setOperationRunning(false);
      });
    }
  }
  const availableLabels = _.difference(labels, originalLabelList);
  const defaultProps = {
    options: availableLabels,
    getOptionLabel: (option) => option,
  };

  function isEditableByUser() {
    return displayEdit;
  }

  function setReadyToStart(isReadyToStart) {
    const updateInfo = {
      marketId,
      investibleId,
      openForInvestment: isReadyToStart,
    };
    setOperationRunning(true);
    return updateInvestible(updateInfo).then((fullInvestible) => {
      onInvestibleStageChange(stage, fullInvestible, investibleId, marketId, undefined,
        undefined, investiblesDispatch, diffDispatch, marketStagesState, [UNASSIGNED_TYPE]);
      if (isReadyToStart) {
        notify(myPresence.id, investibleId, UNASSIGNED_TYPE, YELLOW_LEVEL, investiblesState, market, messagesDispatch);
      }
      setOperationRunning(false);
    });
  }

  function mySetBeingEdited(isEdit, event) {
    return commonSetBeingEdited(event, isEdit, lockedBy, userId, isEditableByUser, updatePageState, investibleId,
      name, history, marketId);
  }
  function toggleReviewers() {
    updatePageState({editCollaborators: 'review'});
  }

  function toggleApprovers() {
    updatePageState({editCollaborators: 'approve'});
  }
  function createNavListItem(icon, textId, anchorId, howManyNum, alwaysShow) {
    return baseNavListItem(formInvestibleLink(marketId, investibleId), icon, textId, anchorId, howManyNum, alwaysShow);
  }
  const displayDescription = _.isEmpty(search) || results.find((item) => item.id === investibleId);
  const displayApprovalsBySearch = _.isEmpty(search) ? _.size(invested) : _.size(investmentReasons);
  const openComments = investmentReasonsRemoved.filter((comment) => !comment.resolved) || [];
  const openProblemComments = openComments.filter((comment) =>
    [QUESTION_TYPE, ISSUE_TYPE, SUGGEST_CHANGE_TYPE].includes(comment.comment_type));
  const closedComments = investmentReasonsRemoved.filter((comment) => comment.resolved) || [];
  const sortedClosedRoots = getSortedRoots(closedComments, searchResults);
  const { id: closedId } = getFakeCommentsArray(sortedClosedRoots)[0];
  const sortedRoots = getSortedRoots(openComments, searchResults);
  const blocking = sortedRoots.filter((comment) => comment.comment_type === ISSUE_TYPE);
  const { id: blockingId } = getFakeCommentsArray(blocking)[0];
  const questions = sortedRoots.filter((comment) => comment.comment_type === QUESTION_TYPE);
  const { id: questionId } = getFakeCommentsArray(questions)[0];
  const suggestions = sortedRoots.filter((comment) => comment.comment_type === SUGGEST_CHANGE_TYPE);
  const { id: suggestId } = getFakeCommentsArray(suggestions)[0];
  const reports = sortedRoots.filter((comment) => comment.comment_type === REPORT_TYPE);
  const { id: reportId } = getFakeCommentsArray(reports)[0];
  const todoSortedComments = sortedRoots.filter((comment) => comment.comment_type === TODO_TYPE);
  const { id: todoId } = getFakeCommentsArray(todoSortedComments)[0]
  const navigationMenu = {
    navListItemTextArray: [
      {icon: Inbox, text: intl.formatMessage({ id: 'inbox' }), target: '/inbox', newPage: true},
      {icon: AgilePlanIcon, text: marketName, target: formMarketLink(marketId)},
      createNavListItem(EditIcon, 'description_label', 'storyMain',
      displayDescription ? undefined : 0),
      createNavListItem(ThumbsUpDownIcon, 'approvals', 'approvals',
        displayApprovalsBySearch, _.isEmpty(search) ? isInVoting : false),
      inArchives || !_.isEmpty(search) ? {} : createNavListItem(AddIcon, 'commentAddBox'),
      createNavListItem(BlockIcon, 'blocking', `c${blockingId}`, _.size(blocking)),
      createNavListItem(QuestionIcon, 'questions', `c${questionId}`, _.size(questions)),
      createNavListItem(UpdateIcon, 'reports', `c${reportId}`, _.size(reports)),
      createNavListItem(ChangeSuggstionIcon, 'suggestions', `c${suggestId}`, _.size(suggestions)),
      createNavListItem(ListAltIcon,'taskSection', `c${todoId}`, _.size(todoSortedComments)),
      createNavListItem(QuestionAnswer,'closedComments', `c${closedId}`, _.size(sortedClosedRoots))
    ]};


  function onSaveAssignments (result) {
    // the edit ony contains the investible data and assignments, not the full market infos
    if (result) {
      const { fullInvestible, assignmentChanged } = result;
      refreshInvestibles(investiblesDispatch, diffDispatch, [fullInvestible]);
      if (assignmentChanged) {
        const messages = findMessagesForInvestibleId(investibleId, messagesState) || [];
        messages.forEach((message) => {
          messagesDispatch(removeMessage(message));
        });
        removeInvestibleInvestments(marketPresencesState, marketPresencesDispatch, marketId, investibleId);
      }
    }
    updatePageState({editCollaborators: false});
  }
  const voters = getInvestibleVoters(marketPresences, investibleId);
  return (
    <Screen
      title={ticketCode ? `${ticketCode} ${name}` : name}
      tabTitle={name}
      breadCrumbs={breadCrumbs}
      hidden={hidden}
      navigationOptions={navigationMenu}
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
        steps={requiresInputStorySteps({isAssigned, mobileLayout})}
      />
      {!inArchives && isInVoting && isAssigned && acceptedFull && (
        <DismissableText textId='planningInvestibleAcceptedFullHelp' text={
          <div>
            See <Link href="https://documentation.uclusion.com/channels/jobs/stages/#started" target="_blank">Started</Link> stage limit.
          </div>
        }/>
      )}
      {!inArchives && isInAccepted && isAssigned && (
        <DismissableText textId='planningInvestibleAcceptedHelp' text={
          <div>
            For help create
            a <Link href="https://documentation.uclusion.com/structured-comments/#questions" target="_blank">question</Link> and
            add options to it.
          </div>
        } />
      )}
      {!yourVote && !inArchives && canVote && !isAssigned && (
        <DismissableText textId='planningInvestibleVotingHelp' text={
          <div>
            Input how certain you are this story should be done or open
            a <Link href="https://documentation.uclusion.com/structured-comments/#blocking-issues" target="_blank">blocking issue</Link>.
          </div>
        } />
      )}
      {!hidden && editCollaborators && (
        <>
          <PlanningInvestibleEdit
            fullInvestible={marketInvestible}
            marketId={marketId}
            marketPresences={marketPresences}
            onSave={onSaveAssignments}
            onCancel={() => updatePageState({editCollaborators: false})}
            isAdmin={isAdmin}
            isAssign={editCollaborators === 'assign'}
            isReview={editCollaborators === 'review'}
            isApprove={editCollaborators === 'approve'}
          />
          <div style={{marginTop: '1rem'}} />
        </>
      )}
      <Card id="storyMain" elevation={3} style={{display: displayDescription ? 'block' : 'none'}}>
        <CardType
          className={classes.cardType}
          createdAt={createdAt}
          myBeingEdited={beingEdited}
        />
        <CardContent className={beingEdited ? classes.editCardContent : classes.votingCardContent}>
          <Grid container className={classes.mobileColumn}>
            <Grid className={classes.borderRight} item xs={2}>
              <dl className={classes.rolesRoot}>
                {market.id && marketInvestible.investible && (
                  <div className={clsx(classes.group, classes.assignments)}>
                    <div className={classes.assignmentContainer}>
                      <b><FormattedMessage id="planningInvestibleAssignments"/></b>
                      <Assignments
                        classes={classes}
                        marketPresences={marketPresences}
                        assigned={assigned}
                        highlighted={isInVoting ? assignedNotAccepted : undefined}
                        isAdmin={isAdmin}
                        toggleAssign={toggleAssign}
                        toolTipId="storyAddParticipantsLabel"
                        showMoveMessage
                      />
                    </div>
                  </div>
                )}
                {market.id && marketInvestible.investible && isReadyFurtherWork && (
                  <div className={classes.assignmentContainer}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          value={openForInvestment}
                          disabled={operationRunning || !isAdmin}
                          checked={openForInvestment}
                          onClick={() => {
                            if (!openForInvestment && !_.isEmpty(openProblemComments) && !mobileLayout) {
                              setOpen(true);
                            } else {
                              setReadyToStart(!openForInvestment);
                            }
                          }}
                        />
                      }
                      label={intl.formatMessage({ id: 'readyToStartCheckboxExplanation' })}
                    />
                    {!openForInvestment && !mobileLayout && (
                      <WarningDialog
                        classes={lockedDialogClasses}
                        open={open}
                        onClose={() => setOpen(false)}
                        issueWarningId="unresolvedReadyToStartWarning"
                        /* slots */
                        actions={
                          <SpinningIconLabelButton onClick={() => setReadyToStart(true)}
                                                   icon={SettingsBackupRestore}
                                                   id="issueProceedReadyToStartButton">
                            {intl.formatMessage({ id: 'issueProceed' })}
                          </SpinningIconLabelButton>
                        }
                      />
                    )}
                  </div>
                )}
                {!_.isEmpty(investibleCollaborators) && (
                  <div className={clsx(classes.group, classes.assignments)}>
                    <div className={classes.assignmentContainer}>
                      <b><FormattedMessage id="collaborators"/></b>
                      <Assignments
                        classes={classes}
                        marketPresences={marketPresences}
                        assigned={investibleCollaborators}
                        isAdmin={false}
                        toggleAssign={() => {}}
                        toolTipId="collaborators"
                      />
                    </div>
                  </div>
                )}
                {market.id && marketInvestible.investible && (isInVoting || isInReview) && (
                  <div className={clsx(classes.group, classes.assignments)}>
                    <div className={classes.assignmentContainer}>
                      <b><FormattedMessage id={isInVoting ? 'requiredApprovers' : 'requiredReviewers'}/></b>
                      <Assignments
                        classes={classes}
                        marketPresences={marketPresences}
                        assigned={isInVoting ? requiredApprovers : requiredReviewers}
                        isAdmin={isAdmin}
                        toggleAssign={isInVoting ? toggleApprovers : toggleReviewers}
                        toolTipId={isInVoting ? 'storyApproversLabel' : 'storyReviewersLabel'}
                      />
                    </div>
                  </div>
                )}
              </dl>
            </Grid>
            <Grid item xs={8} className={!beingEdited && isEditableByUser() ? classes.fullWidthEditable :
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
            </Grid>
            <Grid className={classes.borderLeft} item xs={2}>
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
                {displayEdit && isInAccepted && (
                  <div>
                    <EditMarketButton
                      labelId="changeCompletionDate"
                      marketId={marketId}
                      onClick={toggleEdit}
                      icon={<EventIcon htmlColor={reportMessage ? HIGHLIGHTED_BUTTON_COLOR : ACTION_BUTTON_COLOR} />}
                    />
                    {showDatepicker && (
                      <div className={classes.datePicker}>
                        <DatePicker
                          placeholderText={intl.formatMessage({ id: "selectDate" })}
                          selected={getStartDate()}
                          onChange={handleDateChange}
                          popperPlacement="top"
                          minDate={getTomorrow()}
                          inline
                          onClickOutside={toggleEdit}
                        />
                      </div>
                    )}
                  </div>
                )}
                <div style={{paddingLeft: "1rem", paddingRight: "1rem"}}>
                  <ShareStoryButton investibleId={investibleId} marketId={marketId} />
                </div>
              </div>
              {marketDaysEstimate && isInAccepted && (
                <DaysEstimate readOnly value={marketDaysEstimate} />
              )}
              <MarketMetaData
                stage={stage}
                stageName={fullStage.name}
                investibleId={investibleId}
                market={market}
                marketInvestible={marketInvestible}
                isAdmin={isAdmin && !inArchives}
                stageActions={getStageActions()}
                inArchives={inArchives}
                isAssigned={isAssigned}
                blockingComments={blockingComments}
                todoComments={todoComments}
                isInVoting={isInVoting}
                acceptedFull={acceptedFull}
                questionByAssignedComments={questionByAssignedComments}
                pageState={pageState}
                updatePageState={updatePageState}
                acceptedEmpty={assignedInAcceptedStage.length === 0}
                invested={invested}
                accepted={accepted || []}
                myUserId={userId}
              />
            </Grid>
          </Grid>
          <Grid item xs={12} className={classes.fullWidthCentered}>
            {originalLabelList && originalLabelList.map((label) =>
              <div key={label} className={classes.labelChip}>
                <Chip label={label} onDelete={()=>deleteLabel(`${label}`)} color="primary" />
              </div>
            )}
            {!inArchives && isAdmin && (
              <div className={classes.autocompleteContainer}>
                <Autocomplete
                  {...defaultProps}
                  id="addLabel"
                  key={clearMeHack}
                  freeSolo
                  renderInput={(params) => <TextField {...params}
                                                      label={intl.formatMessage({ id: 'addLabel' })}
                                                      margin="dense"
                                                      variant="outlined" />}
                  style={{ width: 150, maxHeight: '1rem' }}
                  onFocus={labelInputFocus}
                  onBlur={labelInputFocus}
                  onChange={labelInputOnChange}
                />
                {newLabel && (
                  <IconButton
                    className={classes.noPad}
                    onClick={addLabel}
                  >
                    <AddIcon htmlColor={ACTION_BUTTON_COLOR}/>
                  </IconButton>
                )}
                {!newLabel && labelFocus && !mobileLayout &&  (
                  <div className={classes.labelExplain} >
                    <Typography key="completeExplain" className={classes.explain}>
                      {intl.formatMessage({ id: 'typeOrChoose' })}
                    </Typography>
                  </div>
                )}
              </div>
            )}
          </Grid>
        </CardContent>
      </Card>
      {(_.isEmpty(search) || displayApprovalsBySearch > 0) && !_.isEmpty(voters) && (
        <>
          <h2 id="approvals">
            <FormattedMessage id="decisionInvestibleOthersVoting" />
          </h2>
          <Voting
            investibleId={investibleId}
            marketPresences={marketPresences}
            investmentReasons={investmentReasons}
            showExpiration={fullStage.has_expiration}
            expirationMinutes={market.investment_expiration * 1440}
            votingPageState={votingPageState}
            updateVotingPageState={updateVotingPageState}
            votingPageStateReset={votingPageStateReset}
            votingAllowed={canVote}
            yourPresence={yourPresence}
            market={market}
            isAssigned={isAssigned}
          />
        </>
      )}
      {displayVotingInput && investibleId && (
        <>
          {isAssigned && (
            <DismissableText textId="planningInvestibleCantVote" text={
              <div>
                <Link href="https://documentation.uclusion.com/channels/jobs/stages/#ready-for-approval" target="_blank">Approval</Link> is
                optional if you're assigned.
              </div>
            } />
          )}
          <YourVoting
            investibleId={investibleId}
            marketPresences={marketPresences}
            comments={investmentReasons}
            userId={userId}
            market={market}
            votingPageState={votingPageState}
            updateVotingPageState={updateVotingPageState}
            votingPageStateReset={votingPageStateReset}
            isAssigned={isAssigned}
          />
          {!isAssigned && (
            <h3>{intl.formatMessage({ id: 'orStructuredComment' })}</h3>
          )}
          {isAssigned && (
            <div style={{paddingTop: '2rem'}} />
          )}
          {_.isEmpty(search) && marketId && !_.isEmpty(investible) && !hidden && (
            <CommentAddBox
              allowedTypes={allowedCommentTypes}
              investible={investible}
              marketId={marketId}
              issueWarningId={isReadyFurtherWork ? undefined : 'issueWarningPlanning'}
              todoWarningId={todoWarning}
              isInReview={isInReview}
              isAssignee={isAssigned}
              isStory
              numProgressReport={numProgressReport.length}
            />
          )}
        </>
      )}
      <Grid container spacing={2}>
        <Grid item xs={12} style={{ marginTop: '15px' }}>
          {!inArchives && !isInNotDoing && !isInVerified && (!isInVoting || !canVote || yourVote) && _.isEmpty(search)
          && marketId && !_.isEmpty(investible) && !hidden && (
            <CommentAddBox
              allowedTypes={allowedCommentTypes}
              investible={investible}
              marketId={marketId}
              issueWarningId={isReadyFurtherWork ? undefined : 'issueWarningPlanning'}
              todoWarningId={todoWarning}
              isInReview={isInReview}
              isAssignee={isAssigned}
              isStory
              numProgressReport={numProgressReport.length}
            />
          )}
          <CommentBox
            comments={investmentReasonsRemoved}
            marketId={marketId}
            allowedTypes={allowedCommentTypes}
            isRequiresInput={isRequiresInput}
            isInBlocking={isInBlocked}
            fullStage={fullStage}
            assigned={assigned}
            formerStageId={formerStageId}
          />
        </Grid>
      </Grid>
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
  isAdmin: PropTypes.bool,
  inArchives: PropTypes.bool,
  hidden: PropTypes.bool
};

PlanningInvestible.defaultProps = {
  marketPresences: [],
  investibleComments: [],
  investibles: [],
  isAdmin: false,
  inArchives: false,
  hidden: false
};

export const useMetaDataStyles = makeStyles(
  theme => {
    return {
      root: {
        alignItems: "flex-start",
        display: "flex",
        flexDirection: 'column',
        width: '100%',
        '& > div': {
          borderRadius: '6px',
          marginBottom: '1rem'
        }
      },
      flexRow: {
        flexDirection: 'row'
      },
      archivedColor: {
        color: '#ffC000',
      },
      normalColor: {
      },
      archived: {
        color: '#ffC000',
        fontSize: 12,
      },
      highlighted: {
        color: 'red',
        fontSize: 12,
      },
      normal: {
        fontSize: 14,
      },
      group: {
        backgroundColor: '#ecf0f1',
        borderRadius: 6,
        display: "flex",
        flexDirection: "row",
        padding: theme.spacing(1, 1),
        "&:first-child": {
          marginLeft: 0
        },
        [theme.breakpoints.down("sm")]: {
          backgroundColor: '#fff',
        }
      },
      expiration: {
        "& dd": {
          alignItems: "center",
          display: "flex",
          flex: "1 auto",
          flexDirection: "row",
          fontWeight: "bold",
          [theme.breakpoints.down('sm')]: {
            margin: 0,
          },
          
        }
      },
      blue: {
        backgroundColor: '#2d9cdb',
      },
      expansionControl: {
        backgroundColor: '#ecf0f1',
        width: '100%'
      },
      fontControl: {
        alignItems: "center",
        textTransform: 'capitalize',
        marginRight: 'auto',
        marginLeft: '5px',
        fontWeight: 700
      },
      expirationProgress: {
        marginRight: theme.spacing(1)
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
          fontWeight: "bold",
          marginLeft: theme.spacing(1)
        }
      },
      assignmentContainer: {
        width: '100%',
        textTransform: 'capitalize'
      },
      assignIconContainer: {
        display: 'flex',
        justifyContent: 'center'
      },
      assignmentFlexRow: {
        width: '100%',
        display: 'flex',
        padding: '8px'
      },
      flex1: {
        flex: 1
      },
      noPad: {
        padding: 0
      },
      menuButton: {
        width: '100%',
        padding: '12px'
      },
      linkContainer: {
        width: '100%',
        display: 'flex',
        flexDirection: 'column'
      },
      scrollContainer: {
        maxHeight: '210px',
        overflow: 'auto'
      },
      outerBorder: {
        border: '1px solid black',
        borderRadius: '6px 6px 0 0'
      },
      actionPrimary: {
        backgroundColor: '#2D9CDB',
        color: 'white',
        textTransform: 'unset',
        marginRight: '20px',
        '&:hover': {
          backgroundColor: '#e0e0e0'
        },
        '&:disabled': {
          color: 'white',
          backgroundColor: 'rgba(45, 156, 219, .6)'
        }
      },
      actionSecondary: {
        backgroundColor: '#e0e0e0',
        textTransform: 'unset',
        '&:hover': {
          backgroundColor: "#F1F1F1"
        }
      },
    }
  },
  { name: "MetaData" }
);

export function accept(marketId, investibleId, marketInvestible, invDispatch, diffDispatch, unacceptedAssignment,
  workItemClasses) {
  pushMessage(OPERATION_HUB_CHANNEL, { event: START_OPERATION });
  return acceptInvestible(marketId, investibleId)
    .then((marketInfo) => {
      const newInfos = _.unionBy([marketInfo], marketInvestible.market_infos, 'id');
      const inv = {investible: marketInvestible.investible, market_infos: newInfos};
      refreshInvestibles(invDispatch, diffDispatch, [inv]);
      if (unacceptedAssignment) {
        removeWorkListItem(unacceptedAssignment, workItemClasses.removed);
      }
      pushMessage(OPERATION_HUB_CHANNEL, { event: STOP_OPERATION });
    });
}

export function rejectInvestible(marketId, investibleId, marketInvestible, commentsState, commentsDispatch, invDispatch,
  diffDispatch, marketStagesState) {
  pushMessage(OPERATION_HUB_CHANNEL, { event: START_OPERATION });
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
      pushMessage(OPERATION_HUB_CHANNEL, { event: STOP_OPERATION });
    });
}

function MarketMetaData(props) {
  const {
    market,
    marketInvestible,
    investibleId,
    isAdmin,
    stageActions,
    stage,
    inArchives,
    isAssigned,
    blockingComments,
    todoComments,
    isInVoting,
    acceptedFull,
    acceptedEmpty,
    invested,
    accepted,
    myUserId,
    questionByAssignedComments,
    pageState, updatePageState
  } = props;
  const intl = useIntl()
  const {
    showDiff
  } = pageState

  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [diffState, diffDispatch] = useContext(DiffContext);
  const [messagesState] = useContext(NotificationsContext);
  const [, invDispatch] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const workItemClasses = workListStyles();
  const myMessageDescription = findMessageOfTypeAndId(investibleId, messagesState, 'DESCRIPTION');
  const diff = getDiff(diffState, investibleId);
  const classes = useMetaDataStyles();
  const attachedFiles = marketInvestible.investible && marketInvestible.investible.attached_files;
  const unacceptedAssignment = findMessageOfType('UNACCEPTED_ASSIGNMENT', investibleId, messagesState);
  const unaccepted = unacceptedAssignment && isAssigned && !accepted.includes(myUserId);

  function myAccept() {
    return accept(market.id, investibleId, marketInvestible, invDispatch, diffDispatch, unacceptedAssignment,
      workItemClasses);
  }

  function myRejectInvestible() {
    return rejectInvestible(market.id, investibleId, marketInvestible, commentsState, commentsDispatch, invDispatch,
      diffDispatch, marketStagesState);
  }

  function onDeleteFile(path) {
    return deleteAttachedFilesFromInvestible(market.id, investibleId, [path])
      .then((investible) => {
        addInvestible(investiblesDispatch, diffDispatch, investible);
        return EMPTY_SPIN_RESULT;
      });
  }

  function onAttachFiles(metadatas) {
    return attachFilesToInvestible(market.id, investibleId, metadatas)
      .then((investible) => addInvestible(investiblesDispatch, diffDispatch, investible));
  }

  function toggleDiffShow() {
    if (showDiff) {
      markDiffViewed(diffDispatch, investibleId);
    }
    updatePageState({showDiff: !showDiff});
  }

  return (
    <dl className={classes.root}>
      {!_.isEmpty(stageActions) &&
      (
        <React.Fragment>
          <FormControl style={{ width: '100%' }}>
            <InputLabel id="select-allowed-stages-label">
              {intl.formatMessage({ id: 'allowedStagesDropdownLabel' })}</InputLabel>
            <Select
              value={stage}
            >
              {stageActions}
            </Select>
          </FormControl>
          {unaccepted && (
            <div style={{display: 'flex', paddingTop: '1rem', marginBottom: 0}}>
              <SpinningButton onClick={myAccept} className={classes.actionPrimary}>
                {intl.formatMessage({ id: 'planningAcceptLabel' })}
              </SpinningButton>
              <SpinningButton onClick={myRejectInvestible} className={classes.actionSecondary}>
                {intl.formatMessage({ id: 'saveReject' })}
              </SpinningButton>
            </div>
          )}
          {!inArchives && isAssigned && !unaccepted && (
            <>
              <InputLabel id="next-allowed-stages-label" style={{ marginTop: '1rem', marginBottom: '0.25rem' }}>
                {intl.formatMessage({ id: 'quickChangeStage' })}</InputLabel>
              <MoveToNextVisibleStageActionButton
                key="visible"
                investibleId={investibleId}
                marketId={market.id}
                currentStageId={stage}
                disabled={!_.isEmpty(blockingComments) || !_.isEmpty(questionByAssignedComments) || (isInVoting && !isAssigned)}
                iconColor={isInVoting && _.size(invested) > 0 && acceptedEmpty ? HIGHLIGHTED_BUTTON_COLOR : undefined}
                hasTodos={!_.isEmpty(todoComments)}
                highlighted={acceptedFull && isInVoting}
              />
            </>
          )}
        </React.Fragment>
      )}
      {myMessageDescription && diff && (
        <>
          <div style={{paddingTop: '0.5rem'}} />
          <SpinningIconLabelButton icon={showDiff ? ExpandLess : ExpandMoreIcon}
                                   onClick={toggleDiffShow} doSpin={false}>
            <FormattedMessage id={showDiff ? 'diffDisplayDismissLabel' : 'diffDisplayShowLabel'} />
          </SpinningIconLabelButton>
        </>
      )}
      <div style={{paddingTop: '1rem'}} />
      <AttachedFilesList
        marketId={market.id}
        onUpload={onAttachFiles}
        isAdmin={isAdmin}
        onDeleteClick={onDeleteFile}
        attachedFiles={attachedFiles}/>
    </dl>
  );
}

MarketMetaData.propTypes = {
  investibleId: PropTypes.string.isRequired,
  market: PropTypes.object.isRequired,
  marketInvestible: PropTypes.object.isRequired,
  isAdmin: PropTypes.bool.isRequired,
  stageActions: PropTypes.array,
}

export function Assignments(props) {
  const { marketPresences, isAdmin, toggleAssign, classes, assigned, showMoveMessage, toolTipId,
    highlighted } = props;
  const intl = useIntl();
  const metaClasses = useMetaDataStyles();
  const myPresence = marketPresences.find((presence) => presence.current_user);
  const isFollowing = myPresence && myPresence.following;
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
    <div className={classes.assignmentFlexRow}>
      <ul>
        {_.isEmpty(sortedAssigned) && showMoveMessage && (
          <Typography key="unassigned" component="li">
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
                <Gravatar email={presence.email} name={presence.name}/>
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
      </ul>
      <div className={classes.flex1}>
        {isAdmin && isFollowing && (
          <div className={classes.assignIconContainer}>
            <Tooltip
              title={intl.formatMessage({ id: toolTipId })}
            >
              <IconButton
                className={classes.noPad}
                onClick={toggleAssign}
              >
                <PersonAddIcon htmlColor={ACTION_BUTTON_COLOR}/>
              </IconButton>
            </Tooltip>
          </div>
        )}
      </div>
    </div>
  );
}

export default PlanningInvestible;
