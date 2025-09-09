import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import _, { isEmpty } from 'lodash';
import { useHistory, useLocation } from 'react-router';
import { FormattedMessage, useIntl } from 'react-intl';
import { Grid, Typography, useMediaQuery, useTheme } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import Voting from './Voting';
import CommentBox from '../../../containers/CommentBox/CommentBox';
import {
  ISSUE_TYPE,
  JUSTIFY_TYPE,
  QUESTION_TYPE,
  REPLY_TYPE,
  SUGGEST_CHANGE_TYPE,
  TODO_TYPE,
} from '../../../constants/comments';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import {
  getInCurrentVotingStage,
  getProposedOptionsStage,
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import {
  ACTIVE_STAGE,
  APPROVAL_WIZARD_TYPE,
  DECISION_COMMENT_WIZARD_TYPE,
  JOB_COMMENT_WIZARD_TYPE,
  OPTION_EDIT_WIZARD_TYPE
} from '../../../constants/markets';
import CardType, { OPTION, PROPOSED, VOTING_TYPE } from '../../../components/CardType';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { addInvestible, refreshInvestibles } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import AttachedFilesList from '../../../components/Files/AttachedFilesList';
import { DiffContext } from '../../../contexts/DiffContext/DiffContext';
import {
  attachFilesToInvestible,
  deleteAttachedFilesFromInvestible,
  moveInvestibleToCurrentVoting
} from '../../../api/investibles';
import { invalidEditEvent } from '../../../utils/windowUtils';
import EditMarketButton from '../../Dialog/EditMarketButton';
import { ArrowDownward, ArrowUpward, ExpandLess } from '@material-ui/icons';
import { useInvestibleEditStyles } from '../InvestibleBodyEdit';
import { getPageReducerPage, usePageStateReducer } from '../../../components/PageState/pageStateHooks';
import SpinningIconLabelButton from '../../../components/Buttons/SpinningIconLabelButton';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { getDiff } from '../../../contexts/DiffContext/diffContextHelper';
import { findMessageOfTypeAndId } from '../../../utils/messageUtils';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import InvesibleCommentLinker from '../../Dialog/InvesibleCommentLinker';
import AddIcon from '@material-ui/icons/Add';
import {
  decomposeMarketPath,
  formInvestibleAddCommentLink,
  formWizardLink,
  navigate
} from '../../../utils/marketIdPathFunctions';
import DescriptionOrDiff from '../../../components/Descriptions/DescriptionOrDiff';
import { pushMessage } from '../../../utils/MessageBusUtils';
import {
  LOCK_INVESTIBLE,
  LOCK_INVESTIBLE_CHANNEL
} from '../../../contexts/InvestibesContext/investiblesContextMessages';
import { setUclusionLocalStorageItem } from '../../../components/localStorageUtils';
import SpinningButton from '../../../components/SpinBlocking/SpinningButton';
import { wizardStyles } from '../../../components/AddNewWizards/WizardStylesContext';
import EditIcon from '@material-ui/icons/Edit';
import ListAltIcon from '@material-ui/icons/ListAlt';
import { hasDecisionComment } from '../../../components/AddNewWizards/DecisionComment/AddCommentStep';
import { getComment } from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';

const useStyles = makeStyles((theme) => ({
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
    paddingLeft: '2rem',
    paddingTop: '2rem',
    marginBottom: '-42px',
    marginTop: '-23px',
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
    float: "right",
    padding: 0,
    margin: 0,
  },
  editCardContent: {
    margin: theme.spacing(2, 1, 2, 0),
    padding: 0
  },
  votingCardContent: {
    margin: theme.spacing(2, 1, 0, 0),
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

function GridMobileDiv(props) {
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  if (mobileLayout) {
    return (
      <div>
        {props.children}
      </div>
    )
  }
  return (
    <Grid container>
      {props.children}
    </Grid>
  )
}

/**
 * A page that represents what the investible looks like for a DECISION Dialog
 * @param props
 * @constructor
 */
function DecisionInvestible(props) {
  const {
    marketPresences,
    investibleComments,
    userId,
    market,
    fullInvestible,
    isAdmin,
    inArchives,
    isSent,
    removeActions,
    isInbox
  } = props;
  const intl = useIntl();
  const history = useHistory();
  const location = useLocation();
  const classes = useStyles();
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const wizardClasses = wizardStyles();
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [commentsState] = useContext(CommentsContext);
  const [diffState, diffDispatch] = useContext(DiffContext);
  const [messagesState] = useContext(NotificationsContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const investibleId = fullInvestible?.investible?.id;
  const myMessageDescription = findMessageOfTypeAndId(investibleId, messagesState, 'DESCRIPTION');
  const diff = getDiff(diffState, investibleId);
  const { id: marketId, market_stage: marketStage, parent_comment_id: parentCommentId, parent_comment_market_id: parentMarketId } = market;
  const [pageStateFull, pageDispatch] = usePageStateReducer('investible');
  const [pageState, updatePageState] = getPageReducerPage(pageStateFull, pageDispatch, investibleId);
  const {
    showDiff
  } = pageState;
  const investmentReasonsRemoved = investibleComments.filter((comment) =>
    ![JUSTIFY_TYPE, TODO_TYPE].includes(comment.comment_type)) || [];
  const investmentReasons = investibleComments.filter((comment) => comment.comment_type === JUSTIFY_TYPE);
  const info = investibleComments.filter((comment) =>
    [TODO_TYPE, REPLY_TYPE].includes(comment.comment_type));
  const myIssues = investibleComments.filter((comment) => comment.comment_type === ISSUE_TYPE && !comment.resolved);
  const hasIssue = !_.isEmpty(myIssues);
  const { investible, market_infos: marketInfos } = fullInvestible;
  const marketInfo = marketInfos.find((info) => info.market_id === marketId) || {};
  const { stage } = marketInfo;
  const [marketStagesState] = useContext(MarketStagesContext);
  const proposedStage = getProposedOptionsStage(marketStagesState, marketId);
  const inProposed = proposedStage && stage === proposedStage.id;
  const activeMarket = marketStage === ACTIVE_STAGE;
  const yourPresence = marketPresences.find((presence) => presence.current_user) || {};
  const yourVote = yourPresence.investments?.find((investment) => investment.investible_id === investibleId
    && !investment.deleted);
  const {
    name, created_by: createdBy, locked_by: lockedBy, attached_files: attachedFiles, description
  } = investible;
  const optionCreatedBy = marketPresences.find(presence => presence.id === createdBy) || {};
  const [votingPageStateFull, votingPageDispatch] = usePageStateReducer('voting');
  const [votingPageState, updateVotingPageState] =
    getPageReducerPage(votingPageStateFull, votingPageDispatch, investibleId, {useCompression: true});
  const { useCompression } = votingPageState;
  const { pathname } = location;
  const { marketId: typeObjectIdRaw, action } = decomposeMarketPath(pathname);
  const typeObjectId = action === 'inbox' ? typeObjectIdRaw : undefined;
  const underConsiderationStage = getInCurrentVotingStage(marketStagesState, marketId);

  function isEditableByUser() {
    return !removeActions && !inArchives && (isAdmin || (inProposed && createdBy === userId));
  }
  let lockedByName
  if (lockedBy) {
    const lockedByPresence = marketPresences.find((presence) => presence.id === lockedBy)
    if (lockedByPresence) {
      const { name } = lockedByPresence
      lockedByName = name
    }
  }

  function changeStage() {
    const fromStage = inProposed ? proposedStage : underConsiderationStage;
    const toStage = inProposed ? underConsiderationStage : proposedStage;
    const moveInfo = {
      marketId,
      investibleId,
      stageInfo: {
        current_stage_id: fromStage.id,
        stage_id: toStage.id,
      },
    };
    return moveInvestibleToCurrentVoting(moveInfo)
      .then((inv) => {
        refreshInvestibles(investiblesDispatch, () => {}, [inv]);
        setOperationRunning(false);
      });
  }

  const allowedCommentTypes = [QUESTION_TYPE, SUGGEST_CHANGE_TYPE, ISSUE_TYPE, TODO_TYPE];
  const parentComment = getComment(commentsState, parentMarketId, parentCommentId) || {};
  const { investible_id: parentInvestibleId } = parentComment;

  function createTask() {
    return navigate(history, formInvestibleAddCommentLink(JOB_COMMENT_WIZARD_TYPE, parentInvestibleId, parentMarketId, TODO_TYPE, 
      undefined, investibleId, marketId));
  }

  function toggleDiffShow() {
    updatePageState({showDiff: !showDiff});
  }

  function mySetBeingEdited(event) {
    if (!isEditableByUser() || invalidEditEvent(event, history)) {
      return;
    }
    const needsLock = lockedBy !== yourPresence?.id && !_.isEmpty(lockedBy);
    if (needsLock) {
      pushMessage(LOCK_INVESTIBLE_CHANNEL, { event: LOCK_INVESTIBLE, marketId, investibleId });
    }
    setUclusionLocalStorageItem(`name-editor-${investibleId}`, name);
    navigate(history, formWizardLink(OPTION_EDIT_WIZARD_TYPE, marketId, investibleId))
  }

  function getActions() {
    return (
    <>
      {isAdmin && (
        <>
          <div style={{paddingTop: '1rem'}} />
          <SpinningIconLabelButton icon={inProposed ? ArrowUpward : ArrowDownward} id='optionStageChange'
                                   onClick={changeStage}>
            {intl.formatMessage({ id: inProposed ? 'promoteOption' : 'demoteOption'})}
          </SpinningIconLabelButton>
        </>
      )}
      {parentInvestibleId && (
        <>
          <div style={{paddingTop: '1rem'}} />
          <SpinningIconLabelButton icon={ListAltIcon} id='optionCreateTask' onClick={createTask} doSpin={false}>
            {intl.formatMessage({ id: 'makeTask'})}
          </SpinningIconLabelButton>
        </>
      )}
    </>
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

  const votingAllowed = !inProposed && !inArchives && !hasIssue && activeMarket;
  const displayVotingInput = !removeActions && votingAllowed && !yourVote;
  const displayCommentInput = !removeActions && !inArchives && marketId && !_.isEmpty(investible);
  const editClasses = useInvestibleEditStyles();
  const allowedCommentTypesFiltered = mobileLayout ? allowedCommentTypes : allowedCommentTypes.filter((allowedCommentType) =>
    hasDecisionComment(marketId, allowedCommentType, investibleId));
  const afterDescription = <>{!inProposed && (
    <div style={{marginTop: '1rem'}}>
      <CommentBox comments={info} marketId={marketId} allowedTypes={allowedCommentTypes}
                  isInbox={removeActions} removeActions={removeActions} usePadding={false} />
      <h2 id="approvals" style={{marginTop: '1rem'}}>
        <FormattedMessage id="decisionInvestibleOthersVoting"/>
      </h2>
      {displayVotingInput && investibleId && mobileLayout && (
        <SpinningButton id="approvalButton" icon={AddIcon} iconColor="black" className={wizardClasses.actionNext}
                        variant="text" doSpin={false} focus={isInbox}
                        style={{ display: 'flex', marginBottom: '1rem' }}
                        onClick={() => navigate(history,
                          formWizardLink(APPROVAL_WIZARD_TYPE, marketId, investibleId, undefined,
                            undefined, typeObjectId))}>
          {intl.formatMessage({ id: 'createNewApproval'})}
        </SpinningButton>
      )}
      <Voting
        investibleId={investibleId}
        marketPresences={marketPresences}
        investmentReasons={investmentReasons}
        market={market}
        groupId={marketId}
        yourPresence={yourPresence}
        toggleCompression={() => updateVotingPageState({ useCompression: !useCompression })}
        useCompression={useCompression}
      />
      <div style={{marginTop: '1rem'}}/>
    </div>
  )}
    {(displayCommentInput || !_.isEmpty(investmentReasonsRemoved)) && (
      <div style={{ paddingBottom: '1rem' }}>
        <h2 id="comments" style={{ marginTop: 0 }}>
          <FormattedMessage id="comments"/>
        </h2>
        {displayCommentInput && !isEmpty(allowedCommentTypesFiltered) && (
          <div style={{display: mobileLayout ? undefined : 'flex'}}>
            {allowedCommentTypesFiltered.map((allowedCommentType) => {
              return (
                <SpinningButton id={`new${allowedCommentType}`} className={wizardClasses.actionNext}
                                icon={hasDecisionComment(marketId, allowedCommentType, investibleId) ? EditIcon :
                                  AddIcon}
                                iconColor="black"
                                style={{
                                  display: "flex",
                                  marginRight: mobileLayout ? undefined : '2rem', marginBottom: '0.75rem'
                                }}
                                variant="text" doSpin={false}
                                onClick={() => navigate(history,
                                  formInvestibleAddCommentLink(DECISION_COMMENT_WIZARD_TYPE, investibleId, marketId,
                                    allowedCommentType, typeObjectId))}>
                  {intl.formatMessage({ id: `createNew${allowedCommentType}${
                    allowedCommentType === TODO_TYPE ? 'Option' : ''}${mobileLayout ? 'Mobile' : ''}`})}
                </SpinningButton>
              );
            })}
          </div>
        )}
        <CommentBox comments={investmentReasonsRemoved} marketId={marketId} allowedTypes={allowedCommentTypes}
                    isInbox={removeActions} removeActions={removeActions} usePadding={false}/>
      </div>
    )
    }</>;
  const contents = <div className={classes.votingCardContent}>
    {lockedBy && yourPresence.id !== lockedBy && isEditableByUser() && (
      <Typography>
        {intl.formatMessage({ id: "lockedBy" }, { x: lockedByName })}
      </Typography>
    )}
    {marketId && investibleId && userId && (
      <div className={isEditableByUser() ? editClasses.containerEditable : editClasses.container}
           onClick={(event) => mySetBeingEdited(event)} style={{minHeight: mobileLayout ? undefined : '6rem'}}>
        <Typography className={editClasses.title} variant="h3" component="h1">
          {name}
        </Typography>
        <DescriptionOrDiff id={investibleId} description={description} showDiff={showDiff}/>
      </div>
    )}
    {mobileLayout && isEditableByUser() && (
      <div>
        <EditMarketButton
          labelId="edit"
          marketId={marketId}
          onClick={(event) => mySetBeingEdited(event)}
        />
      </div>
    )}
    {afterDescription}
  </div>;
  const actions = 
    <div>
      {!removeActions && activeMarket && mobileLayout && (
        getActions()
      )}
      {isSent && (
        <InvesibleCommentLinker investibleId={investibleId} marketId={marketId} />
      )}
      {myMessageDescription && diff && (
        <>
          <div style={{paddingTop: '0.5rem'}} />
          <SpinningIconLabelButton icon={showDiff ? ExpandLess : ExpandMoreIcon}
                                   onClick={toggleDiffShow} doSpin={false}>
            {intl.formatMessage({ id: showDiff ? 'diffDisplayDismissLabel' : 'diffDisplayShowLabel'})}
          </SpinningIconLabelButton>
        </>
      )}
      <Typography variant="body2" style={{paddingBottom: '1rem'}}>
        {intl.formatMessage({ id: 'created_by' })} {optionCreatedBy.name}.
      </Typography>
      {!removeActions && (
        <AttachedFilesList
          key="files"
          marketId={marketId}
          onDeleteClick={onDeleteFile}
          isAdmin={isAdmin}
          attachedFiles={attachedFiles}
          onUpload={onAttachFiles} />
      )}
    </div>;

  return (
    <div style={{ marginLeft: !mobileLayout ? '2rem' : undefined, marginRight: !mobileLayout ? '2rem' : undefined }}
         id={`option${investibleId}`}>
      <div className={classes.root} id="optionMain">
        <CardType
          className={classes.cardType}
          type={VOTING_TYPE}
          subtype={inProposed ? PROPOSED : OPTION}
        />
        <GridMobileDiv>
          {mobileLayout && contents}
          {!mobileLayout && (
            <Grid item md={10} xs={12}>
              {contents}
            </Grid>
          )}
          {!mobileLayout && (
            <Grid className={classes.borderLeft} item md={2} xs={12}>
              {actions}
            </Grid>
          )}
        </GridMobileDiv>
      </div>
      {mobileLayout && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <h2 id="details" style={{ marginBottom: 0, paddingBottom: 0, marginTop: 0, paddingTop: 0 }}>
              <FormattedMessage id="planningInvestibleOpenLabel"/>
            </h2>
          </div>
          {actions}
        </div>
      )}
</div>
)
  ;
}

DecisionInvestible.propTypes = {
  market: PropTypes.object.isRequired,
  fullInvestible: PropTypes.object.isRequired,
  marketPresences: PropTypes.arrayOf(PropTypes.object),
  investibleComments: PropTypes.arrayOf(PropTypes.object),
  comments: PropTypes.arrayOf(PropTypes.object),
  userId: PropTypes.string.isRequired,
  toggleEdit: PropTypes.func,
  isAdmin: PropTypes.bool,
  inArchives: PropTypes.bool,
  removeActions: PropTypes.bool
};

DecisionInvestible.defaultProps = {
  marketPresences: [],
  investibleComments: [],
  comments: [],
  isAdmin: false,
  inArchives: false,
  removeActions: false
};

export default DecisionInvestible;
