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
import CommentBox from '../../../containers/CommentBox/CommentBox'
import {
  ISSUE_TYPE,
  JUSTIFY_TYPE,
  QUESTION_TYPE,
  REPORT_TYPE,
  SUGGEST_CHANGE_TYPE,
  TODO_TYPE
} from '../../../constants/comments'
import Screen from '../../../containers/Screen/Screen'
import CommentAddBox, { getIcon } from '../../../containers/CommentBox/CommentAddBox'
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
import { PLACEHOLDER } from '../../../constants/global'
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
import Chip from '@material-ui/core/Chip'
import Autocomplete from '@material-ui/lab/Autocomplete'
import TextField from '@material-ui/core/TextField'
import EventIcon from '@material-ui/icons/Event';
import DatePicker from 'react-datepicker'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import { doSetEditWhenValid, invalidEditEvent } from '../../../utils/windowUtils'
import Gravatar from '../../../components/Avatars/Gravatar';
import { getInvestibleVoters } from '../../../utils/votingUtils';
import { getCommenterPresences } from '../../Dialog/Planning/userUtils';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext'
import {
  findMessageOfType,
  findMessageOfTypeAndId,
  findMessagesForInvestibleId
} from '../../../utils/messageUtils'
import { removeMessage } from '../../../contexts/NotificationsContext/notificationsContextReducer'
import { ExpandLess, SettingsBackupRestore } from '@material-ui/icons'
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
import SpinningButton from '../../../components/SpinBlocking/SpinningButton'
import { removeWorkListItem, workListStyles } from '../../Home/YourWork/WorkListItem'
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext'
import { ACTIVE_STAGE } from '../../../constants/markets'
import {
  OPERATION_HUB_CHANNEL, STOP_OPERATION
} from '../../../contexts/OperationInProgressContext/operationInProgressMessages'
import { addEditVotingHasContents } from '../Voting/AddEditVote'
import { isEveryoneGroup } from '../../../contexts/GroupMembersContext/groupMembersHelper'
import InvesibleCommentLinker from '../../Dialog/InvesibleCommentLinker'
import { GmailTabItem, GmailTabs } from '../../../containers/Tab/Inbox'
import ThumbsUpDownIcon from '@material-ui/icons/ThumbsUpDown'

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
      flexBasis: '90%',
      paddingTop: '1rem',
      paddingRight: '1rem',
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
      flexBasis: '90%',
      paddingTop: '1rem',
      paddingRight: '1rem',
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
      zIndex: 8,
      position: 'fixed',
      top: '3.8rem',
      paddingLeft: '1rem',
      paddingTop: '2rem',
      minWidth: '13rem',
      textOverflow: 'ellipsis',
      transform: 'translateX(calc(100vw - 488px))'
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
    hidden
  } = props;
  const lockedDialogClasses = useLockedDialogStyles();
  const [open, setOpen] = useState(false);
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const singleTabLayout = mobileLayout;
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
  const { id: marketId, market_stage: marketStage } = market;
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
  const { stage, assigned: invAssigned, completion_estimate: marketDaysEstimate, addressed,
    required_approvers:  requiredApprovers, required_reviews: requiredReviewers, ticket_code: ticketCode,
    open_for_investment: openForInvestment, former_stage_id: formerStageId, accepted, group_id: groupId } = marketInfo;
  const addressedIds = (addressed || []).filter((address) => !address.deleted && !address.abstain)
    .map((address) => address.user_id);
  const assigned = invAssigned || [];
  const { investible } = marketInvestible;
  const { name, locked_by: lockedBy, created_at: createdAt, label_list: originalLabelList } = investible;
  const [marketStagesState] = useContext(MarketStagesContext);
  const [pageStateFull, pageDispatch] = usePageStateReducer('investible');
  const [pageState, updatePageState, pageStateReset] = getPageReducerPage(pageStateFull, pageDispatch, investibleId,
    {sectionOpen: 'descriptionVotingSection'});
  const {
    beingEdited,
    editCollaborators,
    sectionOpen
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
  const canVote = isInVoting && !inArchives && (!isAssigned || market.assigned_can_approve);
  const yourPresence = marketPresences.find((presence) => presence.current_user);
  const yourVote = yourPresence && yourPresence.investments &&
    yourPresence.investments.find((investment) => investment.investible_id === investibleId && !investment.deleted);
  // If you have a vote already then do not display voting input
  const displayVotingInput = canVote && !yourVote && _.isEmpty(search);
  const [operationRunning, setOperationRunning] = useContext(OperationInProgressContext);
  const hasUsableVotingInput = !inArchives && addEditVotingHasContents(investibleId, false, operationRunning);

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

  const inReviewStage = getInReviewStage(marketStagesState, marketId) || {};
  const isInReview = inReviewStage && stage === inReviewStage.id;
  const inAcceptedStage = getAcceptedStage(marketStagesState, marketId) || {};
  const isInAccepted = inAcceptedStage && stage === inAcceptedStage.id;
  const inBlockedStage = getBlockedStage(marketStagesState, marketId) || {};
  const isInBlocked = inBlockedStage && stage === inBlockedStage.id;
  const inVerifiedStage = getVerifiedStage(marketStagesState, marketId) || {};
  const isInVerified = inVerifiedStage && stage === inVerifiedStage.id;
  const furtherWorkStage = getFurtherWorkStage(marketStagesState, marketId) || {};
  const isFurtherWork = furtherWorkStage && stage === furtherWorkStage.id;
  const requiresInputStage = getRequiredInputStage(marketStagesState, marketId) || {};
  const isRequiresInput = requiresInputStage && stage === requiresInputStage.id;
  const notDoingStage = getNotDoingStage(marketStagesState, marketId);
  const isInNotDoing = notDoingStage && stage === notDoingStage.id;
  const displayEdit = !inArchives && (isAssigned || isInNotDoing || isInVoting || isFurtherWork || isRequiresInput);
  const myPresence = marketPresences.find((presence) => presence.current_user) || {};
  const fullStage = getFullStage(marketStagesState, marketId, stage) || {};
  const inMarketArchives = isInNotDoing || isInVerified;
  const reportMessage = findMessageOfType('REPORT_REQUIRED', investibleId, messagesState);
  const blockingComments = investibleComments.filter(
    comment => comment.comment_type === ISSUE_TYPE
  );
  const blockingCommentsUnresolved = blockingComments.filter(
    comment => comment.comment_type === ISSUE_TYPE && !comment.resolved
  );
  function canGetInput() {
    return _.isEmpty(blockingCommentsUnresolved) && !isInVerified && !isInNotDoing;
  }
  const suggestionComments = investibleComments.filter(
    comment => comment.comment_type === SUGGEST_CHANGE_TYPE
  );
  const reportsComments = investibleComments.filter(
    comment => comment.comment_type === REPORT_TYPE
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
  const todoComments = investibleComments.filter(
    comment => comment.comment_type === TODO_TYPE && !comment.resolved
  );
  const reportComments = investibleComments.filter(comment => comment.comment_type === REPORT_TYPE);
  let allowedCommentTypes = [];
  let sectionComments = [];
  if (sectionOpen === 'tasksSection') {
    allowedCommentTypes = [TODO_TYPE];
    sectionComments = todoComments;
  } else if (sectionOpen === 'questionsSection' && canGetInput()) {
    allowedCommentTypes = [QUESTION_TYPE];
    sectionComments = questionComments;
  } else if (sectionOpen === 'suggestionsSection' && canGetInput()) {
    allowedCommentTypes = [SUGGEST_CHANGE_TYPE];
    sectionComments = suggestionComments;
  } else if (sectionOpen === 'reportsSection' && !isInVoting) {
    allowedCommentTypes = [REPORT_TYPE];
    sectionComments = reportsComments;
  } else if (sectionOpen === 'blockersSection' && canOpenBlocking()) {
    allowedCommentTypes = [ISSUE_TYPE];
    sectionComments = blockingComments;
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
  const acceptedFull = inAcceptedStage.allowed_investibles > 0
    && assignedInAcceptedStage.length >= inAcceptedStage.allowed_investibles;
  function getStageActions() {
    if (inArchives) {
      return []
    }
    const notAssigned = isFurtherWork || isInNotDoing
    const menuItems = [
      <MenuItem
        key={(getInCurrentVotingStage(marketStagesState, marketId) || {}).id}
        value={(getInCurrentVotingStage(marketStagesState, marketId) || {}).id}
      >
        <MoveToVotingActionButton
          investibleId={investibleId}
          marketId={marketId}
          currentStageId={stage}
          disabled={isInVoting || !_.isEmpty(blockingCommentsUnresolved) || notAssigned}
          hasAssignedQuestions={!_.isEmpty(questionSuggestionsByAssignedComments)}
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
          hasAssignedQuestions={!_.isEmpty(questionSuggestionsByAssignedComments)}
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
          disabled={isInReview || !_.isEmpty(blockingCommentsUnresolved) || notAssigned}
          hasAssignedQuestions={!_.isEmpty(questionSuggestionsByAssignedComments)}
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
          disabled={isFurtherWork}
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

  const todoWarning = isInVoting || isFurtherWork || isInBlocked || isRequiresInput ? null : 'todoWarningPlanning';

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
    setOperationRunning('readyToStart');
    return updateInvestible(updateInfo).then((fullInvestible) => {
      onInvestibleStageChange(stage, fullInvestible, investibleId, marketId, undefined,
        undefined, investiblesDispatch, diffDispatch, marketStagesState, [UNASSIGNED_TYPE],
        fullStage);
      if (isReadyToStart) {
        notify(myPresence.id, investibleId, UNASSIGNED_TYPE, YELLOW_LEVEL, investiblesState, market, messagesDispatch);
      }
      setOperationRunning(false);
    });
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
  function toggleEditState(editType) {
    return () => updatePageState({editCollaborators: editType});
  }

  const displayApprovalsBySearch = _.isEmpty(search) ? _.size(invested) : _.size(investmentReasons);
  const openComments = investmentReasonsRemoved.filter((comment) => !comment.resolved) || [];
  const openProblemComments = openComments.filter((comment) =>
    [QUESTION_TYPE, ISSUE_TYPE, SUGGEST_CHANGE_TYPE].includes(comment.comment_type));

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

  const attachedFiles = marketInvestible.investible && marketInvestible.investible.attached_files;

  function onDeleteFile(path) {
    return deleteAttachedFilesFromInvestible(market.id, investibleId, [path]).then((investible) => {
      addInvestible(investiblesDispatch, diffDispatch, investible);
      setOperationRunning(false);
    });
  }

  function onAttachFiles(metadatas) {
    return attachFilesToInvestible(market.id, investibleId, metadatas)
      .then((investible) => addInvestible(investiblesDispatch, diffDispatch, investible));
  }

  function openSubSection(subSection) {
    updatePageState({sectionOpen: subSection});
  }

  const title = ticketCode ? `${ticketCode} ${name}` : name;
  const voters = getInvestibleVoters(marketPresences, investibleId);
  const descriptionSectionResults = (_.isEmpty(search) ? 0 : (results || []).find((item) => item.id === investibleId))
    + _.size(investmentReasons);
  const sections = ['descriptionVotingSection', 'tasksSection', 'questionsSection', 'suggestionsSection',
    'reportsSection', 'blockersSection'];
  return (
    <Screen
      title={title}
      tabTitle={name}
      hidden={hidden}
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
      <div className={mobileLayout ? undefined : classes.paper}>
        {market.id && marketInvestible.investible && (
          <div className={clsx(classes.group, classes.assignments)}>
            <div className={classes.assignmentContainer}>
              <Assignments
                classes={classes}
                marketPresences={marketPresences}
                assigned={assigned}
                highlighted={isInVoting ? assignedNotAccepted : undefined}
                toggleIconButton={toggleEditState('assign')}
                assignmentColumnMessageId='planningInvestibleAssignments'
                toolTipId='storyAddParticipantsLabel'
                showMoveMessage
              />
            </div>
          </div>
        )}
        {market.id && marketInvestible.investible && isFurtherWork && (
          <div className={classes.assignmentContainer}>
            <FormControlLabel
              id='readyToStartCheckbox'
              control={
                <Checkbox
                  value={openForInvestment}
                  disabled={operationRunning !== false}
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
                toolTipId="collaborators"
              />
            </div>
          </div>
        )}
        {market.id && marketInvestible.investible && (isInVoting || isInReview) && (
          <div className={clsx(classes.group, classes.assignments)}>
            <div className={classes.assignmentContainer}>
              <Assignments
                classes={classes}
                marketPresences={marketPresences}
                assigned={isInVoting ? requiredApprovers : requiredReviewers}
                toolTipId={isInVoting ? 'storyApproversLabel' : 'storyReviewersLabel'}
                toggleIconButton={isInVoting ? toggleEditState('approve') : toggleEditState('review')}
                assignmentColumnMessageId={isInVoting ? 'requiredApprovers' : 'requiredReviewers'}
              />
            </div>
          </div>
        )}
        {!isEveryoneGroup(groupId, marketId) && (
          <div className={clsx(classes.group, classes.assignments)}>
            <div className={classes.assignmentContainer}>
              <Assignments
                classes={classes}
                marketPresences={marketPresences}
                assigned={addressedIds}
                toggleAssign={toggleEditState('addressed')}
                toolTipId='storyAddressedLabel'
                toggleIconButton={toggleEditState('assign')}
                assignmentColumnMessageId='addressed'
              />
            </div>
          </div>
        )}
        <MarketMetaData
          stage={stage}
          investibleId={investibleId}
          market={market}
          marketInvestible={marketInvestible}
          isAdmin={!inArchives}
          stageActions={getStageActions()}
          inArchives={inArchives}
          isAssigned={isAssigned}
          blockingComments={blockingCommentsUnresolved}
          todoComments={todoComments}
          isInVoting={isInVoting}
          acceptedFull={acceptedFull}
          questionByAssignedComments={questionSuggestionsByAssignedComments}
          pageState={pageState}
          updatePageState={updatePageState}
          acceptedEmpty={assignedInAcceptedStage.length === 0}
          invested={invested}
          accepted={accepted || []}
          myUserId={userId}
        />
      </div>
      <div style={{paddingRight: mobileLayout ? undefined : '13rem'}}>
        <GmailTabs
          value={singleTabLayout ? 0 : sections.findIndex((section) => section === sectionOpen)}
          onChange={(event, value) => {
            openSubSection(sections[value]);
          }}
          indicatorColors={['#00008B', '#00008B', '#00008B', '#00008B', '#00008B', '#00008B']}
          style={{ borderTop: '1px ridge lightgrey', paddingBottom: '0.25rem' }}>
          {(!singleTabLayout || sectionOpen === 'descriptionVotingSection') && (
            <GmailTabItem icon={<ThumbsUpDownIcon />}
                          label={intl.formatMessage({id: 'descriptionVotingLabel'})}
                          tag={descriptionSectionResults === 0 ? undefined : `${descriptionSectionResults}`} />
          )}
          {(!singleTabLayout || sectionOpen === 'tasksSection') && (
            <GmailTabItem icon={getIcon(TODO_TYPE)} label={intl.formatMessage({id: 'taskSection'})}
                          tag={_.isEmpty(todoComments) ? undefined : `${_.size(todoComments)}`} />
          )}
          {(!singleTabLayout || sectionOpen === 'questionsSection') && (
            <GmailTabItem icon={getIcon(QUESTION_TYPE)} label={intl.formatMessage({id: 'questions'})}
                          tag={_.isEmpty(questionComments) ? undefined : `${_.size(questionComments)}` } />
          )}
          {(!singleTabLayout || sectionOpen === 'suggestionsSection') && (
            <GmailTabItem icon={getIcon(SUGGEST_CHANGE_TYPE)}
                          label={intl.formatMessage({id: 'suggestions'})}
                          tag={_.isEmpty(suggestionComments) ? undefined : `${_.size(suggestionComments)}`} />
          )}
          {(!singleTabLayout || sectionOpen === 'reportsSection') && !isFurtherWork && (
            <GmailTabItem icon={getIcon(REPORT_TYPE)}
                          label={intl.formatMessage({id: 'reportsSectionLabel'})}
                          tag={_.isEmpty(reportsComments) ? undefined : `${_.size(reportsComments)}`} />
          )}
          {(!singleTabLayout || sectionOpen === 'blockersSection') && (
            <GmailTabItem icon={getIcon(ISSUE_TYPE)}
                          label={intl.formatMessage({id: 'blocking'})}
                          tag={_.isEmpty(blockingComments) ? undefined : `${_.size(blockingComments)}`}
            />
          )}
        </GmailTabs>
        {!inArchives && isInVoting && isAssigned && acceptedFull && (
          <DismissableText textId='planningInvestibleAcceptedFullHelp' text={
            <div>
              Starting this job is not recommended because the <Link href="https://documentation.uclusion.com/channels/jobs/stages/#started" target="_blank">Started</Link> stage limit is set.
            </div>
          }/>
        )}
        {!inArchives && isInAccepted && isAssigned && (
          <DismissableText textId='planningInvestibleAcceptedHelp' text={
            <div>
              For help create
              a <Link href="https://documentation.uclusion.com/structured-comments/#questions" target="_blank">question</Link> and
              save to add options to it.
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
                  className={classes.cardType}
                  createdAt={createdAt}
                  myBeingEdited={beingEdited}
                  stageChangedAt={new Date(marketInfo.last_stage_change_date)}
                />
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
                </div>
                {marketDaysEstimate && isInAccepted && (
                  <DaysEstimate readOnly value={marketDaysEstimate} />
                )}
              </div>
              <div>
                {!inArchives && (
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
                <div style={{maxWidth: '10rem', minWidth: '5rem', marginTop: '5rem'}}>
                  <AttachedFilesList
                    marketId={market.id}
                    onUpload={onAttachFiles}
                    onDeleteClick={onDeleteFile}
                    attachedFiles={attachedFiles}/>
                </div>
              </div>
              {originalLabelList && originalLabelList.map((label) =>
                <div key={label} className={classes.labelChip}>
                  <Chip label={label} onDelete={()=>deleteLabel(`${label}`)} color="primary" />
                </div>
              )}
            </div>
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
            {(displayVotingInput || hasUsableVotingInput) && investibleId && (
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
              </>
            )}
            {displayVotingInput && investibleId && !isAssigned && (
              <h3>{intl.formatMessage({ id: 'orStructuredComment' })}</h3>
            )}
          </>
        )}
        {sectionOpen !== 'descriptionVotingSection' && (
          <Grid container spacing={2}>
            <Grid item xs={12} style={{ marginTop: '15px' }}>
              {!inArchives && !isInNotDoing && !isInVerified && _.isEmpty(search) && marketId && !_.isEmpty(investible)
                && !hidden && !_.isEmpty(allowedCommentTypes) && (
                  <CommentAddBox
                    allowedTypes={allowedCommentTypes}
                    investible={investible}
                    marketInfo={marketInfo}
                    marketId={marketId}
                    groupId={groupId}
                    issueWarningId={isFurtherWork ? undefined : 'issueWarningPlanning'}
                    todoWarningId={todoWarning}
                    isInReview={isInReview}
                    isAssignee={isAssigned}
                    isStory
                    numProgressReport={reportComments.length}
                  />
                )}
              <CommentBox
                comments={sectionComments}
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
  return acceptInvestible(marketId, investibleId)
    .then((marketInfo) => {
      const newInfos = _.unionBy([marketInfo], marketInvestible.market_infos, 'id');
      const inv = {investible: marketInvestible.investible, market_infos: newInfos};
      refreshInvestibles(invDispatch, diffDispatch, [inv]);
      if (unacceptedAssignment) {
        removeWorkListItem(unacceptedAssignment, workItemClasses.removed);
      }
      pushMessage(OPERATION_HUB_CHANNEL, { event: STOP_OPERATION, id: 'accept' });
    });
}

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

function MarketMetaData(props) {
  const {
    market,
    marketInvestible,
    investibleId,
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
  const [diffState, diffDispatch] = useContext(DiffContext);
  const [messagesState] = useContext(NotificationsContext);
  const [, invDispatch] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const workItemClasses = workListStyles();
  const myMessageDescription = findMessageOfTypeAndId(investibleId, messagesState, 'DESCRIPTION');
  const diff = getDiff(diffState, investibleId);
  const classes = useMetaDataStyles();
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

  function toggleDiffShow() {
    if (showDiff) {
      markDiffViewed(diffDispatch, investibleId);
    }
    updatePageState({showDiff: !showDiff});
  }

  return (
    <div>
      {!_.isEmpty(stageActions) &&
      (
        <React.Fragment>
          <FormControl style={{paddingRight: '0.5rem'}}>
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
              <SpinningButton onClick={myAccept} className={classes.actionPrimary} id='accept'>
                {intl.formatMessage({ id: 'planningAcceptLabel' })}
              </SpinningButton>
              <SpinningButton onClick={myRejectInvestible} className={classes.actionSecondary} id='reject'>
                {intl.formatMessage({ id: 'saveReject' })}
              </SpinningButton>
            </div>
          )}
          {!inArchives && isAssigned && !unaccepted && (
            <>
              <InputLabel id="next-allowed-stages-label"
                          style={{ marginTop: '2rem', marginBottom: '0.25rem', fontSize: '0.7rem' }}>
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
    </div>
  );
}

MarketMetaData.propTypes = {
  investibleId: PropTypes.string.isRequired,
  market: PropTypes.object.isRequired,
  marketInvestible: PropTypes.object.isRequired,
  stageActions: PropTypes.array,
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
