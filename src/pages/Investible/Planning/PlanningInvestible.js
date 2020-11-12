import React, { useContext, useState } from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'
import {
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  makeStyles,
  Menu,
  MenuItem,
  Tooltip,
  Typography
} from '@material-ui/core'
import InsertLinkIcon from '@material-ui/icons/InsertLink'
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
import {
  formInvestibleEditLink,
  formMarketArchivesLink,
  formMarketLink,
  makeArchiveBreadCrumbs,
  makeBreadCrumbs,
  navigate
} from '../../../utils/marketIdPathFunctions'
import Screen from '../../../containers/Screen/Screen'
import CommentAddBox from '../../../containers/CommentBox/CommentAddBox'
import MoveToNextVisibleStageActionButton from './MoveToNextVisibleStageActionButton'
import { getMarketInfo, getVotesForInvestible } from '../../../utils/userFunctions'
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
import DescriptionOrDiff from '../../../components/Descriptions/DescriptionOrDiff'
import EditMarketButton from '../../Dialog/EditMarketButton'
import MarketLinks from '../../Dialog/MarketLinks'
import CardType, {
  FURTHER_WORK,
  IN_BLOCKED,
  IN_PROGRESS,
  IN_REVIEW,
  IN_VERIFIED,
  IN_VOTING,
  NOT_DOING,
  REQUIRES_INPUT,
  STORY_TYPE
} from '../../../components/CardType'
import clsx from 'clsx'
import { DECISION_TYPE } from '../../../constants/markets'
import DismissableText from '../../../components/Notifications/DismissableText'
import PersonAddIcon from '@material-ui/icons/PersonAdd'
import { EMPTY_SPIN_RESULT } from '../../../constants/global'
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
import ExpandableAction from '../../../components/SidebarActions/Planning/ExpandableAction'
import { ACTION_BUTTON_COLOR } from '../../../components/Buttons/ButtonConstants'
import AttachedFilesList from '../../../components/Files/AttachedFilesList'
import {
  attachFilesToInvestible,
  changeLabels,
  deleteAttachedFilesFromInvestible,
  updateInvestible
} from '../../../api/investibles'
import { DiffContext } from '../../../contexts/DiffContext/DiffContext'
import ShareStoryButton from './ShareStoryButton'
import Chip from '@material-ui/core/Chip'
import Autocomplete from '@material-ui/lab/Autocomplete'
import TextField from '@material-ui/core/TextField'
import EventIcon from '@material-ui/icons/Event';
import InvestibleBodyEdit from '../InvestibleBodyEdit'
import DatePicker from 'react-datepicker'
import moment from 'moment'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import { doSetEditWhenValid } from '../../../utils/windowUtils'

const useStyles = makeStyles(
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
    title: {
      fontSize: 32,
      fontWeight: "bold",
      lineHeight: "42px",
      paddingBottom: "9px",
      [theme.breakpoints.down("xs")]: {
        fontSize: 25
      }
    },
    titleEditable: {
      fontSize: 32,
      fontWeight: "bold",
      lineHeight: "42px",
      paddingBottom: "9px",
      cursor: "url('/images/edit_cursor.svg') 0 24, pointer",
      [theme.breakpoints.down("xs")]: {
        fontSize: 25
      }
    },
    content: {
      fontSize: "15 !important",
      lineHeight: "175%",
      color: "#414141",
      [theme.breakpoints.down("xs")]: {
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
      [theme.breakpoints.down("xs")]: {
        flexDirection: 'column'
      }
    },
    editCardContent: {
      margin: theme.spacing(2, 1),
      padding: 0,
      '& img': {
        margin: '.75rem 0',
      },
      [theme.breakpoints.down("xs")]: {
        margin: 0,
        padding: '15px'
      }
    },
    votingCardContent: {
      margin: theme.spacing(2, 6),
      padding: 0,
      '& img': {
        margin: '.75rem 0',
      },
      [theme.breakpoints.down("xs")]: {
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
    borderLeft: {
      borderLeft: '1px solid #e0e0e0',
      padding: '0 0 0 2rem',
      marginBottom: '-42px',
      marginTop: '-42px',
      [theme.breakpoints.down("xs")]: {
        padding: '1rem 0',
        marginTop: '1rem',
        borderLeft: 'none',
        borderTop: '1px solid #e0e0e0',
        flexGrow: 'unset',
        maxWidth: 'unset',
        flexBasis: 'auto'
      }
    },
    editRow: {
      height: '4rem'
    },
    fullWidthCentered: {
      alignItems: 'center',
      justifyContent: 'center',
      display: "flex",
      marginTop: '20px',
      [theme.breakpoints.down("xs")]: {
        maxWidth: '100%',
        flexBasis: '100%',
        flexDirection: 'column'
      }
    },
    autocompleteContainer: {
      display: 'flex',
      marginLeft: '30px',
      padding: '10px',
      [theme.breakpoints.down("xs")]: {
        marginLeft: '0',
        flexDirection: 'column'
      }
    },
    labelChip: {
      paddingRight: '10px',
      [theme.breakpoints.down("xs")]: {
        paddingRight: 0,
        paddingBottom: '5px'
      }
    },
    labelExplain: {
      marginLeft: '10px',
      width: 90,
      [theme.breakpoints.down("xs")]: {
        width: 'auto'
      }
    },
    fullWidth: {
      [theme.breakpoints.down("xs")]: {
        maxWidth: '100%',
        flexBasis: '100%'
      }
    },
    datePicker: {
      position: 'absolute',
      zIndex: 1000
    },
  }),
  { name: "PlanningInvestible" }
);

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
    inArchives,
    hidden
  } = props;
  const classes = useStyles();
  const [investiblesState, investiblesDispatch] = useContext(InvestiblesContext);
  const [, diffDispatch] = useContext(DiffContext);
  const [changeStagesExpanded, setChangeStagesExpanded] = useState(false);
  const [newLabel, setNewLabel] = useState(undefined);
  const [showDatepicker, setShowDatepicker] = useState(false);
  const [clearMeHack, setClearMeHack] = useState('a');
  const [labelFocus, setLabelFocus] = useState(false);
  const { name: marketName, id: marketId, votes_required: votesRequired } = market;
  const labels = getMarketLabels(investiblesState, marketId);
  const investmentReasonsRemoved = investibleComments.filter(
    comment => comment.comment_type !== JUSTIFY_TYPE
  );
  const investmentReasons = investibleComments.filter(
    comment => comment.comment_type === JUSTIFY_TYPE
  );
  const marketInfo = getMarketInfo(marketInvestible, marketId) || {};
  const { stage, assigned: invAssigned, children, days_estimate: marketDaysEstimate } = marketInfo;
  const [daysEstimate, setDaysEstimate] = useState(marketDaysEstimate);
  const [lastEdit, setLastEdit] = useState(undefined);
  const assigned = invAssigned || []; // handle the empty case to make subsequent code easier
  const presencesFollowing = (marketPresences || []).filter((presence) => presence.following && !presence.market_banned) || [];
  const everyoneAssigned = !_.isEmpty(marketPresences) && assigned.length === presencesFollowing.length;
  const { investible } = marketInvestible;
  const { description, name, locked_by: lockedBy, created_at: createdAt, label_list: originalLabelList } = investible;
  const [labelList, setLabelList] = useState(originalLabelList);
  let lockedByName;
  if (lockedBy) {
    const lockedByPresence = marketPresences.find(
      presence => presence.id === lockedBy
    );
    if (lockedByPresence) {
      const { name } = lockedByPresence;
      lockedByName = name;
    }
  }
  const [marketStagesState] = useContext(MarketStagesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
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
  const inCurrentVotingStage = getInCurrentVotingStage(
    marketStagesState,
    marketId
  ) || {};
  const isInVoting = inCurrentVotingStage && stage === inCurrentVotingStage.id;
  const notDoingStage = getNotDoingStage(marketStagesState, marketId);
  const isInNotDoing = notDoingStage && stage === notDoingStage.id;
  const fullStage = getFullStage(marketStagesState, marketId, stage) || {};
  const inMarketArchives = isInNotDoing || isInVerified;
  const isAssigned = assigned.includes(userId);
  const displayEdit = isAdmin && !inArchives && (isAssigned || isInNotDoing || isInVoting || isReadyFurtherWork || isRequiresInput);
  const myPresence = marketPresences.find((presence) => presence.current_user) || {};
  const [beingEdited, setBeingEdited] = useState(lockedBy === myPresence.id && displayEdit ? investibleId : undefined);
  const breadCrumbTemplates = [
    { name: marketName, link: formMarketLink(marketId) }
  ];
  if (inMarketArchives) {
    breadCrumbTemplates.push({
      name: intl.formatMessage({ id: "dialogArchivesLabel" }),
      link: formMarketArchivesLink(marketId)
    });
  }
  const breadCrumbs = inArchives
    ? makeArchiveBreadCrumbs(history, breadCrumbTemplates)
    : makeBreadCrumbs(history, breadCrumbTemplates);

  const allowedCommentTypes = [QUESTION_TYPE];
  if (isAssigned) {
    allowedCommentTypes.push(REPORT_TYPE);
    allowedCommentTypes.push(TODO_TYPE);
  }
  if (!isAssigned) {
    allowedCommentTypes.push(SUGGEST_CHANGE_TYPE);
    allowedCommentTypes.push(TODO_TYPE);
    if (isInReview) {
      // Reviewers or QE may need to open progress reports
      allowedCommentTypes.push(REPORT_TYPE);
    }
  }
  if (!isInNotDoing) {
    allowedCommentTypes.push(ISSUE_TYPE);
  }
  const stageName = isInVoting
    ? intl.formatMessage({ id: "planningVotingStageLabel" })
    : // eslint-disable-next-line no-nested-ternary
    isInReview
    ? intl.formatMessage({ id: "planningReviewStageLabel" })
    : // eslint-disable-next-line no-nested-ternary
    isInAccepted
    ? intl.formatMessage({ id: "planningAcceptedStageLabel" })
    : isInBlocked
    ? intl.formatMessage({ id: "planningBlockedStageLabel" })
    : isInVerified
    ? intl.formatMessage({ id: "planningVerifiedStageLabel" })
    : isReadyFurtherWork
    ? intl.formatMessage({ id: "planningFurtherWorkStageLabel" })
    : isRequiresInput
    ? intl.formatMessage({ id: "requiresInputStageLabel" }) :
          intl.formatMessage({ id: "planningNotDoingStageLabel" });

  if (!investibleId) {
    // we have no usable data;
    return <></>;
  }
  const invested = getVotesForInvestible(marketPresences, investibleId);

  function assignedInStage(investibles, userId, stageId) {
    return investibles.filter(investible => {
      const { market_infos: marketInfos } = investible;
      // // console.log(`Investible id is ${id}`);
      const marketInfo = marketInfos.find(info => info.market_id === marketId);
      // eslint-disable-next-line max-len
      return (
        marketInfo.stage === stageId &&
        marketInfo.assigned &&
        marketInfo.assigned.includes(userId)
      );
    });
  }

  function hasEnoughVotes(myInvested, myRequired) {
    // if everyone is assigned, then we can't require any votes as nobody can vote
    const required = everyoneAssigned? 0 : myRequired !== undefined ? myRequired : 1;
    return _.size(myInvested) >= required;
  }

  function changeLabelsAndQuickAdd(marketId, investibleId, newLabels) {
    return changeLabels(marketId, investibleId, newLabels).then((fullInvestible) =>{
      refreshInvestibles(investiblesDispatch, diffDispatch, [fullInvestible]);
    });
  }

  function deleteLabel(aLabel) {
    const originalLabels = labelList || [];
    const newLabels = originalLabels.filter((label) => aLabel !== label) || [];
    setLabelList(newLabels);
    changeLabelsAndQuickAdd(marketId, investibleId, newLabels).catch(() => setLabelList(originalLabels));
  }

  function labelInputOnChange(event, value) {
    setNewLabel(value);
  }

  function labelInputFocus() {
    setLabelFocus(!labelFocus);
  }

  function addLabel() {
    const formerLabels = labelList ? labelList : [];
    const newLabels = [...formerLabels, newLabel];
    setLabelList(newLabels);
    changeLabelsAndQuickAdd(marketId, investibleId, newLabels).catch(() => setLabelList(formerLabels));
    setNewLabel(undefined);
    setClearMeHack(clearMeHack+clearMeHack);
  }

  function getSidebarActions() {
    if (inArchives) {
      return [];
    }
    const sidebarActions = [];
    if (!isInNotDoing) {
      if (isAssigned) {
        sidebarActions.push(<ExpandableAction
          id="link"
          key="link"
          icon={<InsertLinkIcon htmlColor={ACTION_BUTTON_COLOR}/>}
          label={intl.formatMessage({ id: "childDialogExplanation" })}
          openLabel={intl.formatMessage({ id: 'planningInvestibleDecision' })}
          onClick={() => navigate(history, `/dialogAdd#type=${DECISION_TYPE}&investibleId=${investibleId}&id=${marketId}`)}
        />)
      }
    }
    return sidebarActions;
  }

  const enoughVotes = hasEnoughVotes(invested, votesRequired);
  const assignedInAcceptedStage = assigned.reduce((acc, userId) => {
    return acc.concat(assignedInStage(
      investibles,
      userId,
      inAcceptedStage.id
    ));
  }, []);
  const blockingComments = investibleComments.filter(
    comment => comment.comment_type === ISSUE_TYPE && !comment.resolved
  );
  const todoComments = investibleComments.filter(
    comment => comment.comment_type === TODO_TYPE && !comment.resolved
  );
  const questionByAssignedComments = investibleComments.filter(
    comment => comment.comment_type === QUESTION_TYPE && !comment.resolved && assigned.includes(comment.created_by)
  );
  const acceptedFull = inAcceptedStage.allowed_investibles > 0
    && assignedInAcceptedStage.length >= inAcceptedStage.allowed_investibles;
  function getStageActions() {
    if (inArchives || isInNotDoing) {
      return [];
    }

    if (isReadyFurtherWork) {
      return [
        <MenuItem
          key="notdoing"
        >
          <MoveToNotDoingActionButton
            investibleId={investibleId}
            marketId={marketId}
            currentStageId={stage}
            isOpen={changeStagesExpanded}
            disabled={isInNotDoing}
          />
        </MenuItem>
      ];
    }
    return [
      <MenuItem
        key="voting"
        >
        <MoveToVotingActionButton
          investibleId={investibleId}
          marketId={marketId}
          currentStageId={stage}
          isOpen={changeStagesExpanded}
          disabled={isInVoting || (!isAssigned && !isInBlocked) || !_.isEmpty(blockingComments)}
          hasAssignedQuestions={!_.isEmpty(questionByAssignedComments)}
        />
      </MenuItem>,
      <MenuItem
        key="accepted"
        >
        <MoveToAcceptedActionButton
          investibleId={investibleId}
          marketId={marketId}
          currentStageId={stage}
          isOpen={changeStagesExpanded}
          full={acceptedFull}
          disabled={!isAssigned || !_.isEmpty(blockingComments) || acceptedFull || !enoughVotes}
          hasAssignedQuestions={!_.isEmpty(questionByAssignedComments)}
        />
      </MenuItem>,
      <MenuItem
        key="inreview"
        >
        <MoveToInReviewActionButton
          investibleId={investibleId}
          marketId={marketId}
          currentStageId={stage}
          isOpen={changeStagesExpanded}
          disabled={isInReview || !_.isEmpty(blockingComments)}
          hasTodos={!_.isEmpty(todoComments)}
          hasAssignedQuestions={!_.isEmpty(questionByAssignedComments)}
        />
      </MenuItem>,
      <MenuItem
        key="furtherwork"
        >
        <MoveToFurtherWorkActionButton
          investibleId={investibleId}
          marketId={marketId}
          currentStageId={stage}
          isOpen={changeStagesExpanded}
          disabled={isReadyFurtherWork}
        />
      </MenuItem>,
      <MenuItem
        key="verified"
        >
        <MoveToVerifiedActionButton
          investibleId={investibleId}
          marketId={marketId}
          currentStageId={stage}
          isOpen={changeStagesExpanded}
          disabled={isInVerified || !_.isEmpty(blockingComments)}
          hasTodos={!_.isEmpty(todoComments)}
        />
      </MenuItem>,
      <MenuItem
        key="notdoing"
        >
        <MoveToNotDoingActionButton
          investibleId={investibleId}
          marketId={marketId}
          currentStageId={stage}
          isOpen={changeStagesExpanded}
          disabled={isInNotDoing}
        />
      </MenuItem>
    ];
  }

  const canVote = !isAssigned && isInVoting && !inArchives;
  const yourPresence = marketPresences.find((presence) => presence.current_user);
  const yourVote = yourPresence && yourPresence.investments && yourPresence.investments.find((investment) => investment.investible_id === investibleId);
  const todoWarning = isInVoting ? null : fullStage.allows_todos ? 'todoWarningPlanning' : 'todoWarningDone'
  function toggleAssign() {
    navigate(history, `${formInvestibleEditLink(marketId, investibleId)}#assign=true`);
  }
  function toggleEdit() {
    setShowDatepicker(!showDatepicker);
  }
  function getStartDate() {
    if (daysEstimate && createdAt) {
      return moment(createdAt).add(daysEstimate, 'days').toDate();
    }
    return undefined;
  }
  function handleDateChange(date) {
    const usedDate = createdAt ? createdAt : new Date();
    const myValue = moment(date).diff(moment(usedDate), 'days', true);
    const value = Math.ceil(myValue);
    const valueInt = value ? parseInt(value, 10) : null;
    if (!_.isEqual(valueInt, daysEstimate)) {
      setDaysEstimate(valueInt);
      toggleEdit();
      const updateInfo = {
        marketId,
        investibleId,
        daysEstimate: valueInt,
      };
      setOperationRunning(true);
      return updateInvestible(updateInfo).then((fullInvestible) => {
        refreshInvestibles(investiblesDispatch, diffDispatch, [fullInvestible]);
        setOperationRunning(false);
      });
    }
  }
  const availableLabels = _.difference(labels, labelList);
  const defaultProps = {
    options: availableLabels,
    getOptionLabel: (option) => option,
  };
  const subtype = isInVoting ? IN_VOTING :
    isInAccepted ? IN_PROGRESS :
      isInReview ? IN_REVIEW :
        isInBlocked ? IN_BLOCKED :
          isInNotDoing ? NOT_DOING :
            isReadyFurtherWork ? FURTHER_WORK :
              isRequiresInput ? REQUIRES_INPUT :
                IN_VERIFIED;
  function expansionChanged(event, expanded) {
    setChangeStagesExpanded(expanded);
  }

  function isEditableByUser() {
    return displayEdit;
  }

  function mySetBeingEdited(isEdit, event) {
    doSetEditWhenValid(isEdit, isEditableByUser, setBeingEdited, investibleId, event);
  }
  const myBeingEdited = beingEdited === investibleId;
  return (
    <Screen
      title={name}
      tabTitle={name}
      breadCrumbs={breadCrumbs}
      hidden={hidden}
    >
      {!inArchives && isInVoting && isAssigned && enoughVotes && _.size(invested) > 0 && _.isEmpty(assignedInStage(investibles, userId, inAcceptedStage.id)) && (
        <DismissableText textId='planningInvestibleEnoughVotesHelp' />
      )}
      {!inArchives && isInVoting && isAssigned && enoughVotes && !_.isEmpty(assignedInStage(investibles, userId, inAcceptedStage.id)) && (
        <DismissableText textId='planningInvestibleAcceptedFullHelp' />
      )}
      {!inArchives && isInAccepted && isAssigned && (
        <DismissableText textId='planningInvestibleAcceptedHelp' />
      )}
      {!yourVote && !inArchives && canVote && (
        <DismissableText textId='planningInvestibleVotingHelp' />
      )}
      <Card elevation={0}>
        <CardType
          className={classes.cardType}
          label={`${stageName} ${intl.formatMessage({
            id: "planningInvestibleDescription"
          })}`}
          type={STORY_TYPE}
          subtype={subtype}
          createdAt={createdAt}
          lastEdit={lastEdit}
        />
        <CardContent className={myBeingEdited ? classes.editCardContent : classes.votingCardContent}>
          <Grid container className={classes.mobileColumn}>
            <Grid item xs={9} className={classes.fullWidth}>
              {!myBeingEdited && (
                <Typography className={isEditableByUser() ? classes.titleEditable : classes.title} variant="h3"
                            component="h1" onClick={() => mySetBeingEdited(true)}>
                  {name}
                </Typography>
              )}
              {lockedBy && (
                <Typography>
                  {intl.formatMessage({ id: "lockedBy" }, { x: lockedByName })}
                </Typography>
              )}
              {myBeingEdited && (
                <InvestibleBodyEdit hidden={hidden} marketId={marketId} investibleId={investibleId}
                                    setBeingEdited={mySetBeingEdited} setLastEdit={setLastEdit} lastEdit={lastEdit} />
              )}
              {!myBeingEdited && (
                <DescriptionOrDiff
                  id={investibleId}
                  description={description}
                  setBeingEdited={mySetBeingEdited}
                  isEditable={isEditableByUser()}
                />
              )}
            </Grid>
            <Grid className={classes.borderLeft} item xs={3}>
              <div className={classes.editRow}>
                <dl className={classes.upperRightCard}>
                  {displayEdit && !inMarketArchives && (
                    <div>
                      <EditMarketButton
                        labelId="changeCompletionDate"
                        marketId={marketId}
                        onClick={toggleEdit}
                        icon={<EventIcon htmlColor={ACTION_BUTTON_COLOR} />}
                      />
                      {showDatepicker && (
                        <div className={classes.datePicker}>
                          <DatePicker
                            placeholderText={intl.formatMessage({ id: "selectDate" })}
                            selected={getStartDate()}
                            onChange={handleDateChange}
                            popperPlacement="bottom-start"
                            minDate={new Date()}
                            inline
                            onClickOutside={toggleEdit}
                          />
                        </div>
                      )}
                    </div>
                  )}
                  <div><ShareStoryButton /></div>
                  {!inArchives && isAssigned && (
                      <MoveToNextVisibleStageActionButton
                        key="visible"
                        investibleId={investibleId}
                        marketId={marketId}
                        currentStageId={stage}
                        disabled={!_.isEmpty(blockingComments) || !isAssigned || (isInVoting && (!enoughVotes || !_.isEmpty(assignedInAcceptedStage)))}
                        enoughVotes={enoughVotes}
                        acceptedStageAvailable={!acceptedFull}
                        hasTodos={!_.isEmpty(todoComments)}
                        hasAssignedQuestions={!_.isEmpty(questionByAssignedComments)}
                      />
                  )}
                </dl>
              </div>
              {marketDaysEstimate > 0 && (
                <div style={{paddingTop: '1.5rem'}}>
                  <DaysEstimate readOnly value={daysEstimate} createdAt={createdAt} />
                </div>
              )}
              <MarketMetaData
                stage={marketInfo.stage_name}
                investibleId={investibleId}
                isInVoting={isInVoting}
                market={market}
                marketInvestible={marketInvestible}
                marketPresences={marketPresences}
                isAdmin={isAdmin && !inArchives}
                toggleAssign={toggleAssign}
                children={children || []}
                stageActions={getStageActions()}
                expansionChanged={expansionChanged}
                actions={getSidebarActions()}
              />
            </Grid>
          </Grid>
          <Grid item xs={9} className={classes.fullWidthCentered}>
            {labelList && labelList.map((label) =>
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
                                                      variant="outlined" />}
                  style={{ width: 230 }}
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
                {!newLabel && labelFocus && (
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
      {isInVoting && !inArchives && isAdmin && (canVote ? (
        <>
          <YourVoting
            investibleId={investibleId}
            marketPresences={marketPresences}
            comments={investmentReasons}
            userId={userId}
            market={market}
            showBudget
          />
          {!yourVote && (
            <>
              <h2>{intl.formatMessage({ id: 'orStructuredComment' })}</h2>
              <CommentAddBox
                allowedTypes={allowedCommentTypes}
                investible={investible}
                marketId={marketId}
                issueWarningId="issueWarningPlanning"
                todoWarningId={todoWarning}
                isStory
              />
            </>
          )}
        </>
          ) : (
            <DismissableText textId="planningInvestibleCantVote" />
        ))}
      <h2>
        <FormattedMessage id="decisionInvestibleOthersVoting" />
      </h2>
      <Voting
        investibleId={investibleId}
        marketPresences={marketPresences}
        investmentReasons={investmentReasons}
        showExpiration={fullStage.has_expiration}
        expirationMinutes={market.investment_expiration * 1440}
      />
      <Grid container spacing={2}>
        <Grid item xs={12} style={{ marginTop: '15px' }}>
          {!inArchives && isAdmin && (!isInVoting || !canVote || yourVote) && (
            <CommentAddBox
              allowedTypes={allowedCommentTypes}
              investible={investible}
              marketId={marketId}
              issueWarningId="issueWarningPlanning"
              todoWarningId={todoWarning}
              isStory
            />
          )}
          <CommentBox
            comments={investmentReasonsRemoved}
            marketId={marketId}
            allowedTypes={allowedCommentTypes}
          />
        </Grid>
      </Grid>
    </Screen>
  );
}

PlanningInvestible.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  market: PropTypes.object.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  marketInvestible: PropTypes.object.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  marketPresences: PropTypes.arrayOf(PropTypes.object),
  // eslint-disable-next-line react/forbid-prop-types
  investibleComments: PropTypes.arrayOf(PropTypes.object),
  // eslint-disable-next-line react/forbid-prop-types
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
      group: {
        backgroundColor: '#ecf0f1',
        borderRadius: 6,
        display: "flex",
        flexDirection: "row",
        padding: theme.spacing(1, 1),
        "&:first-child": {
          marginLeft: 0
        },
        [theme.breakpoints.down("xs")]: {
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
      }
    }
  },
  { name: "MetaData" }
);

function MarketMetaData(props) {
  const {
    market,
    marketPresences,
    marketInvestible,
    isAdmin,
    toggleAssign,
    children,
    stageActions,
    expansionChanged,
    actions,
    stage,
  } = props;
  let stageLabel;
  switch (stage) {
    case 'In Dialog':
      stageLabel = 'planningInvestibleToVotingLabel';
      break;
    case 'Verified':
      stageLabel = 'planningInvestibleMoveToVerifiedLabel';
      break;
    case 'Not Doing':
      stageLabel = 'planningInvestibleMoveToNotDoingLabel';
      break;
    case 'In Review':
      stageLabel = 'planningInvestibleNextStageInReviewLabel';
      break;
    case 'Further Work':
      stageLabel = 'planningInvestibleMoveToFurtherWorkLabel';
      break;
    case 'Accepted':
      stageLabel = 'planningInvestibleNextStageAcceptedLabel';
      break;
    case 'Requires Input':
      stageLabel = 'requiresInputStageLabel';
      break;
    default:
      stageLabel = 'changeStage'
  }
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [, diffDispatch] = useContext(DiffContext);
  const classes = useMetaDataStyles();
  const attachedFiles = marketInvestible.investible && marketInvestible.investible.attached_files;

  function handleClick(event) {
    setAnchorEl(event.currentTarget);
    expansionChanged(true);
  }

  function handleClose() {
    setAnchorEl(null);
    expansionChanged(false)
  }

  function onDeleteFile(path) {
    return deleteAttachedFilesFromInvestible(market.id, marketInvestible.investible.id, [path])
      .then((investible) => {
        addInvestible(investiblesDispatch, diffDispatch, investible);
        return EMPTY_SPIN_RESULT;
      });
  }

  function onAttachFiles(metadatas) {
    return attachFilesToInvestible(market.id, marketInvestible.investible.id, metadatas)
      .then((investible) => addInvestible(investiblesDispatch, diffDispatch, investible));
  }

  return (
    <dl className={classes.root}>
      {market.id && marketInvestible.investible && (
        <div className={classes.assignmentContainer}>
          <FormattedMessage id="planningInvestibleAssignments" />
          <div className={clsx(classes.group, classes.assignments)}>
            <Assignments
              classes={classes}
              marketId={market.id}
              marketPresences={marketPresences}
              investible={marketInvestible}
              isAdmin={isAdmin}
              toggleAssign={toggleAssign}
            />
          </div>
        </div>
      )}
      {!_.isEmpty(stageActions) &&
      (
        <React.Fragment>
        <span>
          <FormattedMessage id="changeStage"/>
        </span>
          <div className={classes.expansionControl} onChange={expansionChanged}>
            <Button
              className={classes.menuButton}
              endIcon={<ExpandMoreIcon style={{ marginRight: '16px' }} htmlColor={ACTION_BUTTON_COLOR}/>}
              aria-controls="stages-content"
              id="stages-header"
              onClick={handleClick}
            >
              <div className={classes.fontControl}>
                <FormattedMessage id={stageLabel}/>
              </div>
            </Button>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}>
              {stageActions}
            </Menu>
          </div>
        </React.Fragment>
      )}
      <MarketLinks links={children} actions={actions} />
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
  isInVoting: PropTypes.bool.isRequired,
  market: PropTypes.object.isRequired,
  marketPresences: PropTypes.array.isRequired,
  marketInvestible: PropTypes.object.isRequired,
  isAdmin: PropTypes.bool.isRequired,
  toggleAssign: PropTypes.func.isRequired,
  children: PropTypes.arrayOf(PropTypes.string).isRequired,
  stageActions: PropTypes.array,
  expansionChanged: PropTypes.func.isRequired,
  actions: PropTypes.arrayOf(PropTypes.element).isRequired,
}

function Assignments(props) {
  const { investible, marketId, marketPresences, isAdmin, toggleAssign, classes } = props;
  const intl = useIntl();
  const marketInfo = getMarketInfo(investible, marketId) || {};
  const { assigned } = marketInfo;
  const myPresence = marketPresences.find((presence) => presence.current_user);
  const isFollowing = myPresence && myPresence.following;
  const safeAssigned = assigned || [];
  return (
    <span className={classes.assignmentFlexRow}>
      <ul>
        {_.isEmpty(safeAssigned) && (
          <Typography key="unassigned" component="li">
            {intl.formatMessage({ id: 'reassignToMove' })}
          </Typography>
        )}
        {safeAssigned.map(userId => {
          let user = marketPresences.find(presence => presence.id === userId);
          if (!user) {
            user = { name: "Removed" };
          }
          return (
            <Typography key={userId} component="li">
              {user.name}
            </Typography>
          );
        })}
      </ul>
      <div className={classes.flex1}>
        {isAdmin && isFollowing && (
          <div className={classes.assignIconContainer}>
            <Tooltip
              title={intl.formatMessage({ id: 'storyAddParticipantsLabel' })}
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
    </span>
  );
}

export default PlanningInvestible;
