import React, { useContext, useState } from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'
import { useHistory } from 'react-router'
import { FormattedMessage, useIntl } from 'react-intl'
import { Card, CardContent, Grid, Typography } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import YourVoting from '../Voting/YourVoting'
import Voting from './Voting'
import CommentBox, { getSortedRoots } from '../../../containers/CommentBox/CommentBox'
import { ISSUE_TYPE, JUSTIFY_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE, } from '../../../constants/comments'
import CommentAddBox from '../../../containers/CommentBox/CommentAddBox'
import Screen from '../../../containers/Screen/Screen'
import {
  baseNavListItem,
  formCommentLink,
  formInvestibleLink,
  formMarketLink,
  makeArchiveBreadCrumbs,
  makeBreadCrumbs
} from '../../../utils/marketIdPathFunctions'
import MoveToCurrentVotingActionButton from './MoveToCurrentVotingActionButton'
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext'
import { getProposedOptionsStage, } from '../../../contexts/MarketStagesContext/marketStagesContextHelper'
import { ACTIVE_STAGE, PLANNING_TYPE } from '../../../constants/markets'
import DeleteInvestibleActionButton from './DeleteInvestibleActionButton'
import CardType, { OPTION, PROPOSED, VOTING_TYPE } from '../../../components/CardType'
import DismissableText from '../../../components/Notifications/DismissableText'
import MoveBackToPoolActionButton from './MoveBackToPoolActionButton'
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext'
import { getMarket } from '../../../contexts/MarketsContext/marketsContextHelper'
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'
import {
  addInvestible,
  getInvestibleName
} from '../../../contexts/InvestibesContext/investiblesContextHelper'
import CardActions from '@material-ui/core/CardActions'
import clsx from 'clsx'
import AttachedFilesList from '../../../components/Files/AttachedFilesList'
import { useMetaDataStyles } from '../Planning/PlanningInvestible'
import { DiffContext } from '../../../contexts/DiffContext/DiffContext'
import { attachFilesToInvestible, deleteAttachedFilesFromInvestible } from '../../../api/investibles'
import { EMPTY_SPIN_RESULT } from '../../../constants/global'
import { getMarketComments } from '../../../contexts/CommentsContext/commentsContextHelper'
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext'
import { doSetEditWhenValid, isTinyWindow } from '../../../utils/windowUtils'
import EditMarketButton from '../../Dialog/EditMarketButton'
import ShareStoryButton from '../Planning/ShareStoryButton'
import PlaylistAddCheckIcon from '@material-ui/icons/PlaylistAddCheck'
import EditIcon from '@material-ui/icons/Edit'
import HowToVoteIcon from '@material-ui/icons/HowToVote'
import ThumbsUpDownIcon from '@material-ui/icons/ThumbsUpDown'
import AddIcon from '@material-ui/icons/Add'
import BlockIcon from '@material-ui/icons/Block'
import QuestionIcon from '@material-ui/icons/ContactSupport'
import ChangeSuggstionIcon from '@material-ui/icons/ChangeHistory'
import { getVotesForInvestible } from '../../../utils/userFunctions'
import { getFakeCommentsArray } from '../../../utils/stringFunctions'
import { QuestionAnswer } from '@material-ui/icons'
import BodyEdit from '../../BodyEdit'
import StarRateIcon from '@material-ui/icons/StarRate'

const useStyles = makeStyles((theme) => ({
  mobileColumn: {
    [theme.breakpoints.down("xs")]: {
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
    [theme.breakpoints.down("xs")]: {
      alignItems: 'center',
      padding: '20px'
    }
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
}));

export function getInlineBreadCrumbs (marketState, parentMarketId, parentInvestibleId, investiblesState,
  parentCommentId) {
  const inlineParentMarket = getMarket(marketState, parentMarketId);
  let breadCrumbTemplates = [];
  if (inlineParentMarket) {
    // Better would be to peg loading a level up since above can resolve with wrong
    const { name: inlineParentMarketName } = inlineParentMarket
    breadCrumbTemplates = [{ name: inlineParentMarketName, link: formMarketLink(parentMarketId), id: 'marketCrumb',
      icon: <PlaylistAddCheckIcon/> }]
  }
  if (parentInvestibleId) {
    breadCrumbTemplates.push({
      name: getInvestibleName(parentInvestibleId, investiblesState),
      link: formInvestibleLink(parentMarketId, parentInvestibleId), id: 'marketCrumb'
    })
  }
  if (parentCommentId) {
    breadCrumbTemplates.push({
      name: 'Question',
      link: formCommentLink(parentMarketId, parentInvestibleId, parentCommentId), id: 'marketCrumb'
    })
  }
  return breadCrumbTemplates
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
  } = props;
  const intl = useIntl();
  const history = useHistory();
  const classes = useStyles();
  const metaClasses = useMetaDataStyles();
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [, diffDispatch] = useContext(DiffContext);
  const { name: marketName, id: marketId, market_stage: marketStage, allow_multi_vote: allowMultiVote,
    parent_comment_id: parentCommentId, parent_comment_market_id: parentCommentMarketId,
    market_type: marketType } = market;
  const isInline = !_.isEmpty(parentCommentId);
  const [commentsState] = useContext(CommentsContext);
  let breadCrumbTemplates = [{ name: marketName, link: formMarketLink(marketId), id: 'marketCrumb'}];
  const [marketState] = useContext(MarketsContext);
  const [investiblesState] = useContext(InvestiblesContext);
  if (isInline) {
    const comments = getMarketComments(commentsState, parentCommentMarketId) || [];
    const parentComment = comments.find((comment) => comment.id === parentCommentId) || {};
    breadCrumbTemplates = getInlineBreadCrumbs(marketState, parentCommentMarketId, parentComment.investible_id,
      investiblesState, parentComment.id);
  }
  const breadCrumbs = inArchives
    ? makeArchiveBreadCrumbs(history, breadCrumbTemplates)
    : makeBreadCrumbs(history, breadCrumbTemplates);
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
  const allowDelete = marketPresences && marketPresences.length < 2;
  const [marketStagesState] = useContext(MarketStagesContext);
  const inProposedStage = getProposedOptionsStage(marketStagesState, marketId);
  const inProposed = inProposedStage && marketInfo.stage === inProposedStage.id;
  const activeMarket = marketStage === ACTIVE_STAGE;
  const yourPresence = marketPresences.find((presence) => presence.current_user) || {};
  const yourVote = yourPresence.investments && yourPresence.investments.find((investment) => investment.investible_id === investibleId);
  const {
    name, created_by: createdBy, locked_by: lockedBy, attached_files: attachedFiles,
  } = investible;
  function isEditableByUser() {
    return !inArchives && (isAdmin || (inProposed && createdBy === userId));
  }
  const [beingEdited, setBeingEdited] = useState(lockedBy === yourPresence.id && isEditableByUser() ? investibleId : undefined);
  let lockedByName
  if (lockedBy) {
    const lockedByPresence = marketPresences.find((presence) => presence.id === lockedBy)
    if (lockedByPresence) {
      const { name } = lockedByPresence
      lockedByName = name
    }
  }

  function mySetBeingEdited(isEdit, event) {
    doSetEditWhenValid(isEdit, isEditableByUser, setBeingEdited, investibleId, event);
  }

  const allowedCommentTypes = [QUESTION_TYPE, SUGGEST_CHANGE_TYPE, ISSUE_TYPE];

  function getActions() {
    return (
    <dl className={classes.upperRightCard}>
      {isTinyWindow() && isEditableByUser() && !beingEdited && (
          <EditMarketButton
            labelId="edit"
            marketId={marketId}
            onClick={() => mySetBeingEdited(true)}
          />
      )}
      {marketType === PLANNING_TYPE && (
        <ShareStoryButton />
      )}
      {isAdmin && inProposed && (
          <MoveToCurrentVotingActionButton
            key="moveToCurrent"
            investibleId={investibleId}
            marketId={marketId}
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
    return deleteAttachedFilesFromInvestible(marketId, investible.id, [path])
      .then((investible) => {
        addInvestible(investiblesDispatch, diffDispatch, investible);
        return EMPTY_SPIN_RESULT;
      });
  }

  function onAttachFiles(metadatas) {
    return attachFilesToInvestible(marketId, investible.id, metadatas)
      .then((investible) => addInvestible(investiblesDispatch, diffDispatch, investible));
  }

  if (!investibleId) {
    // we have no usable data;
    return <></>;
  }
  const myBeingEdited = beingEdited === investibleId;
  const displayVotingInput = !inProposed && !inArchives && !hasIssueOrMarketIssue;
  function createNavListItem(icon, textId, anchorId, howManyNum, alwaysShow) {
    return baseNavListItem(formInvestibleLink(marketId, investibleId), icon, textId, anchorId, howManyNum, alwaysShow);
  }
  const invested = getVotesForInvestible(marketPresences, investibleId);
  const openComments = investmentReasonsRemoved.filter((comment) => !comment.resolved) || [];
  const closedComments = investmentReasonsRemoved.filter((comment) => comment.resolved) || [];
  const sortedClosedRoots = getSortedRoots(closedComments);
  const { id: closedId } = getFakeCommentsArray(sortedClosedRoots)[0];
  const sortedRoots = getSortedRoots(openComments);
  const blocking = sortedRoots.filter((comment) => comment.comment_type === ISSUE_TYPE);
  const { id: blockingId } = getFakeCommentsArray(blocking)[0];
  const questions = sortedRoots.filter((comment) => comment.comment_type === QUESTION_TYPE);
  const { id: questionId } = getFakeCommentsArray(questions)[0];
  const suggestions = sortedRoots.filter((comment) => comment.comment_type === SUGGEST_CHANGE_TYPE);
  const { id: suggestId } = getFakeCommentsArray(suggestions)[0];
  const navigationMenu = {navHeaderIcon: StarRateIcon,
    navListItemTextArray: [createNavListItem(EditIcon,'description_label', 'optionMain'),
      displayVotingInput ? createNavListItem(HowToVoteIcon, 'pleaseVoteNav', 'pleaseVote') : {},
      createNavListItem(ThumbsUpDownIcon, 'approvals', 'approvals', _.size(invested)),
      inArchives ? {} : createNavListItem(AddIcon,'commentAddBox'),
      createNavListItem(BlockIcon,'blocking', `c${blockingId}`, _.size(blocking)),
      createNavListItem(QuestionIcon, 'questions', `c${questionId}`, _.size(questions)),
      createNavListItem(ChangeSuggstionIcon,'suggestions', `c${suggestId}`, _.size(suggestions)),
      createNavListItem(QuestionAnswer,'closedComments', `c${closedId}`, _.size(sortedClosedRoots))
    ]};
  return (
    <Screen
      title={name}
      tabTitle={name}
      breadCrumbs={breadCrumbs}
      hidden={hidden}
      navigationOptions={navigationMenu}
    >
      {activeMarket && !inProposed && !allowMultiVote && (
        <DismissableText textId='decisionInvestibleVotingSingleHelp' />
      )}
      {activeMarket && !inProposed && allowMultiVote && (
        <DismissableText textId='decisionInvestibleVotingMultiHelp' />
      )}
      {activeMarket && inProposed && isAdmin && (
        <DismissableText textId='decisionInvestibleProposedHelp' />
      )}
      <Card className={classes.root} id="optionMain">
        <CardType
          className={classes.cardType}
          type={VOTING_TYPE}
          subtype={inProposed ? PROPOSED : OPTION}
          myBeingEdited={myBeingEdited}
        />
        <Grid container className={classes.mobileColumn}>
          <Grid item md={9} xs={12}>

        <CardContent className={myBeingEdited ? classes.editCardContent : classes.votingCardContent}>
          {lockedBy && yourPresence.id !== lockedBy && isEditableByUser() && (
            <Typography>
              {intl.formatMessage({ id: "lockedBy" }, { x: lockedByName })}
            </Typography>
          )}
          {marketId && investibleId && (
            <BodyEdit hidden={hidden} marketId={marketId} investibleId={investibleId} loadId={investibleId}
                      setBeingEdited={mySetBeingEdited} beingEdited={myBeingEdited}
                      isEditableByUser={isEditableByUser}/>
          )}
        </CardContent>
          </Grid>
          <Grid className={classes.borderLeft} item md={3} xs={12}>
            <CardActions className={classes.actions}>
              {activeMarket && (
                getActions()
              )}
            </CardActions>
            <dl className={clsx(metaClasses.root, classes.flexCenter)}>
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
      {!displayVotingInput && !inProposed && (
        <Typography>
          {intl.formatMessage({ id: votingBlockedMessage })}
        </Typography>
      )}
      {displayVotingInput && (
        <>
          <YourVoting
            investibleId={investibleId}
            marketPresences={marketPresences}
            comments={investmentReasons}
            userId={userId}
            market={market}
          />
          {!yourVote && (
            <>
              <h2>{intl.formatMessage({ id: 'orStructuredComment' })}</h2>
              <CommentAddBox
                allowedTypes={allowedCommentTypes}
                investible={investible}
                marketId={marketId}
                issueWarningId="issueWarningInvestible"
                hidden={hidden}
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
          />
        </>
      )}
      <Grid container spacing={2}>
        <Grid item xs={12} style={{ marginTop: '71px' }}>
          {!inArchives && (inProposed || yourVote) && (
            <CommentAddBox
              allowedTypes={allowedCommentTypes}
              investible={investible}
              marketId={marketId}
              issueWarningId="issueWarningInvestible"
              hidden={hidden}
            />
          )}
          <CommentBox comments={investmentReasonsRemoved} marketId={marketId} allowedTypes={allowedCommentTypes} />
        </Grid>
      </Grid>
    </Screen>
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
