import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { useHistory } from 'react-router';
import { FormattedMessage, useIntl } from 'react-intl';
import { CardContent, Grid, Typography, useMediaQuery, useTheme } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import Voting from './Voting';
import CommentBox from '../../../containers/CommentBox/CommentBox';
import { ISSUE_TYPE, JUSTIFY_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE, } from '../../../constants/comments';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { getProposedOptionsStage, } from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { ACTIVE_STAGE, APPROVAL_WIZARD_TYPE, DECISION_COMMENT_WIZARD_TYPE } from '../../../constants/markets';
import DeleteInvestibleActionButton from './DeleteInvestibleActionButton';
import CardType, { OPTION, PROPOSED, VOTING_TYPE } from '../../../components/CardType';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { addInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import CardActions from '@material-ui/core/CardActions';
import clsx from 'clsx';
import AttachedFilesList from '../../../components/Files/AttachedFilesList';
import { useMetaDataStyles } from '../Planning/PlanningInvestibleNav';
import { DiffContext } from '../../../contexts/DiffContext/DiffContext';
import { attachFilesToInvestible, deleteAttachedFilesFromInvestible } from '../../../api/investibles';
import { doSetEditWhenValid } from '../../../utils/windowUtils';
import EditMarketButton from '../../Dialog/EditMarketButton';
import { ExpandLess } from '@material-ui/icons';
import InvestibleBodyEdit, { useInvestibleEditStyles } from '../InvestibleBodyEdit';
import { getPageReducerPage, usePageStateReducer } from '../../../components/PageState/pageStateHooks';
import SpinningIconLabelButton from '../../../components/Buttons/SpinningIconLabelButton';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { getDiff, markDiffViewed } from '../../../contexts/DiffContext/diffContextHelper';
import { findMessageOfTypeAndId } from '../../../utils/messageUtils';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { setUclusionLocalStorageItem } from '../../../components/localStorageUtils';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import InvesibleCommentLinker from '../../Dialog/InvesibleCommentLinker';
import AddIcon from '@material-ui/icons/Add';
import { formInvestibleAddCommentLink, formWizardLink, navigate } from '../../../utils/marketIdPathFunctions';

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
    display: "inline-flex",
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
    isSent,
    removeActions
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
  const { investible, market_infos: marketInfos } = fullInvestible;
  const marketInfo = marketInfos.find((info) => info.market_id === marketId) || {};
  const { group_id: groupId, stage } = marketInfo;
  const allowDelete = marketPresences && marketPresences.length < 2;
  const [marketStagesState] = useContext(MarketStagesContext);
  const inProposedStage = getProposedOptionsStage(marketStagesState, marketId);
  const inProposed = inProposedStage && stage === inProposedStage.id;
  const activeMarket = marketStage === ACTIVE_STAGE;
  const yourPresence = marketPresences.find((presence) => presence.current_user) || {};
  const yourVote = yourPresence.investments?.find((investment) => investment.investible_id === investibleId
    && !investment.deleted);
  const {
    name, created_by: createdBy, locked_by: lockedBy, attached_files: attachedFiles,
  } = investible;
  const optionCreatedBy = marketPresences.find(presence => presence.id === createdBy) || {};
  const [votingPageStateFull, votingPageDispatch] = usePageStateReducer('voting');
  const [votingPageState, updateVotingPageState, votingPageStateReset] =
    getPageReducerPage(votingPageStateFull, votingPageDispatch, investibleId);

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
      {allowDelete && (
        <DeleteInvestibleActionButton
          key="delete"
          investibleId={investibleId}
          marketId={marketId}
          groupId={groupId}
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
  const displayVotingInput = !removeActions && votingAllowed && !yourVote;
  const displayCommentInput = !removeActions && !inArchives && marketId && !_.isEmpty(investible) && !hidden;
  const editClasses = useInvestibleEditStyles();
  const contents = <CardContent className={beingEdited ? classes.editCardContent : classes.votingCardContent}>
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
                          beingEdited={beingEdited}
                          isEditableByUser={isEditableByUser}/>
    )}
  </CardContent>;
  const actions = <CardActions className={mobileLayout ? undefined : classes.actions}>
    <div className={mobileLayout ? undefined : clsx(metaClasses.root, classes.flexCenter)}>
      {!removeActions && activeMarket && (
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
            <FormattedMessage id={showDiff ? 'diffDisplayDismissLabel' : 'diffDisplayShowLabel'} />
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
    </div>
  </CardActions>;
  return (
    <div style={{marginLeft: !mobileLayout ? '2rem' : undefined, marginRight: !mobileLayout ? '2rem' : undefined}}
         id={`option${investibleId}`}>
      <div className={classes.root} id="optionMain">
        <CardType
          className={classes.cardType}
          type={VOTING_TYPE}
          subtype={inProposed ? PROPOSED : OPTION}
          myBeingEdited={beingEdited}
        />
        <GridMobileDiv>
          {mobileLayout && actions}
          <div className={classes.editRow}>
            {mobileLayout && isEditableByUser() && !beingEdited && (
              <div>
                <EditMarketButton
                  labelId="edit"
                  marketId={marketId}
                  onClick={(event) => mySetBeingEdited(true, event)}
                />
              </div>
            )}
          </div>
          {mobileLayout && contents}
          {!mobileLayout && (
            <Grid item md={10} xs={12}
                  className={isEditableByUser() ? editClasses.containerEditable : editClasses.container}
                  onClick={(event) => mySetBeingEdited(true, event)}>
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
      {!inProposed && (
        <>
          <h2 id="approvals">
            <FormattedMessage id="decisionInvestibleOthersVoting" />
          </h2>
          {displayVotingInput && investibleId && (
            <SpinningIconLabelButton icon={AddIcon} doSpin={false} whiteBackground
                                     style={{display: "flex", marginBottom: '1rem'}}
                                     onClick={() => navigate(history,
                                       formWizardLink(APPROVAL_WIZARD_TYPE, marketId, investibleId))}>
              <FormattedMessage id="createNewVote" />
            </SpinningIconLabelButton>
          )}
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
      {(displayCommentInput || !_.isEmpty(investmentReasonsRemoved)) && (
        <Grid container spacing={2} style={{paddingBottom: '1rem'}}>
          <Grid item xs={12} style={{ marginBottom: '1rem', marginTop: '1rem'  }}>
            {displayCommentInput && (
              <SpinningIconLabelButton icon={AddIcon} doSpin={false} whiteBackground
                                       onClick={() => navigate(history,
                                         formInvestibleAddCommentLink(DECISION_COMMENT_WIZARD_TYPE, investibleId))}>
                <FormattedMessage id='createComment'/>
              </SpinningIconLabelButton>
            )}
            <CommentBox comments={investmentReasonsRemoved} marketId={marketId} allowedTypes={allowedCommentTypes}
                        isInbox={removeActions} removeActions={removeActions} usePadding={false} />
          </Grid>
        </Grid>
      )}
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
