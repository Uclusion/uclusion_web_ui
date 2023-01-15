import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'
import { useHistory } from 'react-router'
import { FormattedMessage, useIntl } from 'react-intl'
import { Card, CardContent, Grid, Typography, useMediaQuery, useTheme } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import YourVoting from '../Voting/YourVoting'
import Voting from './Voting'
import CommentBox from '../../../containers/CommentBox/CommentBox'
import { ISSUE_TYPE, JUSTIFY_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE, } from '../../../constants/comments'
import CommentAddBox from '../../../containers/CommentBox/CommentAddBox'
import MoveToCurrentVotingActionButton from './MoveToCurrentVotingActionButton'
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext'
import { getProposedOptionsStage, } from '../../../contexts/MarketStagesContext/marketStagesContextHelper'
import { ACTIVE_STAGE } from '../../../constants/markets'
import DeleteInvestibleActionButton from './DeleteInvestibleActionButton'
import CardType, { OPTION, PROPOSED, VOTING_TYPE } from '../../../components/CardType'
import DismissableText from '../../../components/Notifications/DismissableText'
import MoveBackToPoolActionButton from './MoveBackToPoolActionButton'
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'
import { addInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper'
import CardActions from '@material-ui/core/CardActions'
import clsx from 'clsx'
import AttachedFilesList from '../../../components/Files/AttachedFilesList'
import { useMetaDataStyles } from '../Planning/PlanningInvestibleNav'
import { DiffContext } from '../../../contexts/DiffContext/DiffContext'
import { attachFilesToInvestible, deleteAttachedFilesFromInvestible } from '../../../api/investibles'
import { doSetEditWhenValid } from '../../../utils/windowUtils'
import EditMarketButton from '../../Dialog/EditMarketButton'
import { ExpandLess } from '@material-ui/icons'
import InvestibleBodyEdit from '../InvestibleBodyEdit'
import { getPageReducerPage, usePageStateReducer } from '../../../components/PageState/pageStateHooks'
import SpinningIconLabelButton from '../../../components/Buttons/SpinningIconLabelButton'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import { getDiff, markDiffViewed } from '../../../contexts/DiffContext/diffContextHelper'
import { findMessageOfTypeAndId } from '../../../utils/messageUtils'
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext'
import { setUclusionLocalStorageItem } from '../../../components/localStorageUtils'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import InvesibleCommentLinker from '../../Dialog/InvesibleCommentLinker'

const useStyles = makeStyles((theme) => ({
  mobileColumn: {
    [theme.breakpoints.down("sm")]: {
      flexDirection: 'column'
    }
  },
  root: {
    alignItems: "flex-start",
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between"
  },
  actions: {
    paddingTop: "1rem",
    justifyContent: 'flex-end',
    '& > button': {
      marginRight: '-8px'
    },
    [theme.breakpoints.down('sm')]: {
      justifyContent: 'center',
    }
  },
  container: {
    padding: "3px 89px 21px 21px",
    marginTop: "-6px",
    boxShadow: "none",
    [theme.breakpoints.down("sm")]: {
      padding: "3px 21px 42px 21px"
    }
  },
  borderLeft: {
    padding: '2rem',
    marginBottom: '-42px',
    marginTop: '-42px',
    [theme.breakpoints.down("sm")]: {
      padding: '1rem 0',
      marginTop: '1rem',
      borderLeft: 'none',
      borderTop: '1px solid #e0e0e0',
      flexGrow: 'unset',
      maxWidth: 'unset',
      flexBasis: 'auto'
    }
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
  upperRightCard: {
    display: "inline-flex",
    float: "right",
    padding: 0,
    margin: 0,
  },
  editCardContent: {
    margin: theme.spacing(2, 1),
    padding: 0
  },
  votingCardContent: {
    margin: theme.spacing(2, 6),
    padding: 0
  },
  flexCenter: {
    [theme.breakpoints.down("sm")]: {
      alignItems: 'center',
      padding: '20px'
    }
  },
  fullWidthCentered: {
    alignItems: 'center',
    justifyContent: 'center',
    display: "flex",
    marginTop: '20px',
    [theme.breakpoints.down("sm")]: {
      maxWidth: '100%',
      flexBasis: '100%',
      flexDirection: 'column'
    }
  },
}));

/**
 * A page that represents what the investible looks like for a DECISION Dialog
 * @param props
 * @constructor
 */
function DecisionInvestible(props) {
  const {
    investibleId,
    marketPresences,
    investibleComments,
    comments,
    userId,
    market,
    fullInvestible,
    isAdmin,
    inArchives,
    hidden,
    isSent
  } = props;
  const intl = useIntl();
  const history = useHistory();
  const classes = useStyles();
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const metaClasses = useMetaDataStyles();
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [diffState, diffDispatch] = useContext(DiffContext);
  const [messagesState] = useContext(NotificationsContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const myMessageDescription = findMessageOfTypeAndId(investibleId, messagesState, 'DESCRIPTION');
  const diff = getDiff(diffState, investibleId);
  const { id: marketId, market_stage: marketStage } = market;
  const [pageStateFull, pageDispatch] = usePageStateReducer('investible');
  const [pageState, updatePageState, pageStateReset] = getPageReducerPage(pageStateFull, pageDispatch, investibleId);
  const {
    beingEdited,
    showDiff
  } = pageState;
  const investmentReasonsRemoved = investibleComments.filter((comment) => comment.comment_type !== JUSTIFY_TYPE) || [];
  const investmentReasons = investibleComments.filter((comment) => comment.comment_type === JUSTIFY_TYPE);
  const myIssues = investibleComments.filter((comment) => comment.comment_type === ISSUE_TYPE && !comment.resolved);
  const marketIssues = comments.filter((comment) => comment.comment_type === ISSUE_TYPE && !comment.resolved && !comment.investible_id);
  const hasMarketIssue = !_.isEmpty(marketIssues);
  const hasIssue = !_.isEmpty(myIssues);
  const hasIssueOrMarketIssue = hasMarketIssue || hasIssue;
  const votingBlockedMessage = hasMarketIssue
    ? 'decisionInvestibleVotingBlockedMarket'
    : 'decisionInvestibleVotingBlockedInvestible';
  const { investible, market_infos: marketInfos } = fullInvestible;
  const marketInfo = marketInfos.find((info) => info.market_id === marketId) || {};
  const { group_id: groupId, stage } = marketInfo;
  const allowDelete = marketPresences && marketPresences.length < 2;
  const [marketStagesState] = useContext(MarketStagesContext);
  const inProposedStage = getProposedOptionsStage(marketStagesState, marketId);
  const inProposed = inProposedStage && stage === inProposedStage.id;
  const activeMarket = marketStage === ACTIVE_STAGE;
  const yourPresence = marketPresences.find((presence) => presence.current_user) || {};
  const yourVote = yourPresence.investments
    && yourPresence.investments.find((investment) => investment.investible_id === investibleId && !investment.deleted);
  const {
    name, created_by: createdBy, locked_by: lockedBy, attached_files: attachedFiles,
  } = investible;
  const optionCreatedBy = marketPresences.find(presence => presence.id === createdBy) || {};
  const [votingPageStateFull, votingPageDispatch] = usePageStateReducer('voting');
  const [votingPageState, updateVotingPageState, votingPageStateReset] =
    getPageReducerPage(votingPageStateFull, votingPageDispatch, investibleId);

  function isEditableByUser() {
    return !inArchives && (isAdmin || (inProposed && createdBy === userId));
  }
  let lockedByName
  if (lockedBy) {
    const lockedByPresence = marketPresences.find((presence) => presence.id === lockedBy)
    if (lockedByPresence) {
      const { name } = lockedByPresence
      lockedByName = name
    }
  }

  function toggleDiffShow() {
    if (showDiff) {
      markDiffViewed(diffDispatch, investibleId);
    }
    updatePageState({showDiff: !showDiff});
  }

  function mySetBeingEdited(isEdit, event) {
    return doSetEditWhenValid(isEdit, isEditableByUser,
      (value) => {
        updatePageState({beingEdited: value});
        setUclusionLocalStorageItem(`name-editor-${investibleId}`, name);
      }, event, history);
  }

  const allowedCommentTypes = [QUESTION_TYPE, SUGGEST_CHANGE_TYPE, ISSUE_TYPE];

  function getActions() {
    return (
    <dl className={classes.upperRightCard}>
      {mobileLayout && isEditableByUser() && !beingEdited && (
          <EditMarketButton
            labelId="edit"
            marketId={marketId}
            onClick={(event) => mySetBeingEdited(true, event)}
          />
      )}
      {isAdmin && inProposed && (
          <MoveToCurrentVotingActionButton
            key="moveToCurrent"
            investibleId={investibleId}
            marketId={marketId}
            hasIssue={hasIssue}
          />
      )}
      {isAdmin && !inProposed && (
        <MoveBackToPoolActionButton
          key="moveBack"
          investibleId={investibleId}
          marketId={marketId}
        />
      )}
      {allowDelete && (
        <DeleteInvestibleActionButton
          key="delete"
          investibleId={investibleId}
          marketId={marketId}
        />
      )}
    </dl>
    );
  }

  function onDeleteFile(path) {
    return deleteAttachedFilesFromInvestible(marketId, investible.id, [path]).then((investible) => {
      addInvestible(investiblesDispatch, diffDispatch, investible);
      setOperationRunning(false);
    });
  }

  function onAttachFiles(metadatas) {
    return attachFilesToInvestible(marketId, investible.id, metadatas)
      .then((investible) => addInvestible(investiblesDispatch, diffDispatch, investible));
  }

  const votingAllowed = !inProposed && !inArchives && !hasIssueOrMarketIssue && activeMarket;
  const displayVotingInput = votingAllowed && !yourVote;

  return (
    <div style={{marginLeft: mobileLayout ? undefined : '2rem', marginRight: mobileLayout ? undefined : '2rem',
      marginBottom: '1rem'}} id={`option${investibleId}`}>
      {activeMarket && inProposed && isAdmin && (
        <DismissableText textId='decisionInvestibleProposedHelp' text={
          <div>
            You can move this option to be approved by using the up arrow.
          </div>
        } />
      )}
      <Card className={classes.root} id="optionMain">
        <CardType
          className={classes.cardType}
          type={VOTING_TYPE}
          subtype={inProposed ? PROPOSED : OPTION}
          myBeingEdited={beingEdited}
        />
        <Grid container className={classes.mobileColumn}>
          <Grid item md={9} xs={12}>
            <CardContent className={beingEdited ? classes.editCardContent : classes.votingCardContent}>
              {lockedBy && yourPresence.id !== lockedBy && isEditableByUser() && (
                <Typography>
                  {intl.formatMessage({ id: "lockedBy" }, { x: lockedByName })}
                </Typography>
              )}
              {marketId && investibleId && userId && (
                <InvestibleBodyEdit hidden={hidden} marketId={marketId} investibleId={investibleId}
                                    pageState={pageState}
                                    userId={userId}
                                    pageStateUpdate={updatePageState}
                                    pageStateReset={pageStateReset}
                                    fullInvestible={fullInvestible}
                          setBeingEdited={mySetBeingEdited} beingEdited={beingEdited}
                          isEditableByUser={isEditableByUser}/>
              )}
            </CardContent>
          </Grid>
          <Grid className={classes.borderLeft} item md={3} xs={12}>
            <CardActions className={classes.actions}>
              {activeMarket && (
                getActions()
              )}
              {isSent && (
                <div style={{paddingLeft: '1rem', paddingRight: '1rem'}}>
                  <InvesibleCommentLinker investibleId={investibleId} marketId={marketId} />
                </div>
              )}
            </CardActions>
            {myMessageDescription && diff && (
              <>
                <div style={{paddingTop: '0.5rem'}} />
                <SpinningIconLabelButton icon={showDiff ? ExpandLess : ExpandMoreIcon}
                                         onClick={toggleDiffShow} doSpin={false}>
                  <FormattedMessage id={showDiff ? 'diffDisplayDismissLabel' : 'diffDisplayShowLabel'} />
                </SpinningIconLabelButton>
              </>
            )}
            <dl className={clsx(metaClasses.root, classes.flexCenter)}>
              <Typography variant="body2" style={{paddingBottom: '1rem'}}>
                {intl.formatMessage({ id: 'created_by' })} {optionCreatedBy.name}.
              </Typography>
              <AttachedFilesList
                key="files"
                marketId={marketId}
                onDeleteClick={onDeleteFile}
                isAdmin={isAdmin}
                attachedFiles={attachedFiles}
                onUpload={onAttachFiles} />
            </dl>
          </Grid>
        </Grid>
      </Card>
      {!votingAllowed && !inProposed && activeMarket && (
        <Typography>
          {intl.formatMessage({ id: votingBlockedMessage })}
        </Typography>
      )}
      {displayVotingInput && investibleId && (
        <>
          <YourVoting
            investibleId={investibleId}
            marketPresences={marketPresences}
            comments={investmentReasons}
            userId={userId}
            market={market}
            groupId={marketId}
            votingPageState={votingPageState}
            updateVotingPageState={updateVotingPageState}
            votingPageStateReset={votingPageStateReset}
          />
          {!yourVote && marketId && !_.isEmpty(investible) && !hidden && (
            <>
              <h3>{intl.formatMessage({ id: 'orStructuredComment' })}</h3>
              <CommentAddBox
                allowedTypes={allowedCommentTypes}
                investible={investible}
                marketId={marketId}
                groupId={groupId}
                issueWarningId="issueWarningInvestible"
                nameDifferentiator="decisionInvestible"
              />
            </>
          )}
        </>
      )}
      {!inProposed && (
        <>
          <h2 id="approvals">
            <FormattedMessage id="decisionInvestibleOthersVoting" />
          </h2>
          <Voting
            investibleId={investibleId}
            marketPresences={marketPresences}
            investmentReasons={investmentReasons}
            votingPageState={votingPageState}
            updateVotingPageState={updateVotingPageState}
            votingPageStateReset={votingPageStateReset}
            market={market}
            groupId={marketId}
            votingAllowed={votingAllowed}
            yourPresence={yourPresence}
          />
        </>
      )}
      <Grid container spacing={2}>
        <Grid item xs={12} style={{ marginTop: '2rem' }}>
          {!inArchives && (inProposed || yourVote) && marketId && !_.isEmpty(investible) && !hidden && (
            <CommentAddBox
              allowedTypes={allowedCommentTypes}
              investible={investible}
              marketId={marketId}
              groupId={groupId}
              issueWarningId={inProposed ? undefined : 'issueWarningInvestible'}
              nameDifferentiator="decisionInvestible"
            />
          )}
          <CommentBox comments={investmentReasonsRemoved} marketId={marketId} allowedTypes={allowedCommentTypes}
                      isInbox />
        </Grid>
      </Grid>
    </div>
  );
}

DecisionInvestible.propTypes = {
  market: PropTypes.object.isRequired,
  fullInvestible: PropTypes.object.isRequired,
  marketPresences: PropTypes.arrayOf(PropTypes.object),
  investibleComments: PropTypes.arrayOf(PropTypes.object),
  comments: PropTypes.arrayOf(PropTypes.object),
  investibleId: PropTypes.string.isRequired,
  userId: PropTypes.string.isRequired,
  toggleEdit: PropTypes.func,
  isAdmin: PropTypes.bool,
  inArchives: PropTypes.bool,
  hidden: PropTypes.bool,
};

DecisionInvestible.defaultProps = {
  marketPresences: [],
  investibleComments: [],
  comments: [],
  isAdmin: false,
  inArchives: false,
  hidden: false,
};

export default DecisionInvestible;
