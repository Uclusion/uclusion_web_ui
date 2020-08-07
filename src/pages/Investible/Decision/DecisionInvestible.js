import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'
import { useHistory } from 'react-router'
import { FormattedMessage, useIntl } from 'react-intl'
import { Card, CardContent, Grid, Typography } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import YourVoting from '../Voting/YourVoting'
import Voting from './Voting'
import CommentBox from '../../../containers/CommentBox/CommentBox'
import { ISSUE_TYPE, JUSTIFY_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE, } from '../../../constants/comments'
import CommentAddBox from '../../../containers/CommentBox/CommentAddBox'
import Screen from '../../../containers/Screen/Screen'
import {
  formInvestibleLink,
  formMarketLink,
  makeArchiveBreadCrumbs,
  makeBreadCrumbs
} from '../../../utils/marketIdPathFunctions'
import MoveToCurrentVotingActionButton from './MoveToCurrentVotingActionButton'
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext'
import { getProposedOptionsStage, } from '../../../contexts/MarketStagesContext/marketStagesContextHelper'
import { ACTIVE_STAGE } from '../../../constants/markets'
import DeleteInvestibleActionButton from './DeleteInvestibleActionButton'
import DescriptionOrDiff from '../../../components/Descriptions/DescriptionOrDiff'
import EditMarketButton from '../../Dialog/EditMarketButton'
import CardType, { OPTION, VOTING_TYPE } from '../../../components/CardType'
import DismissableText from '../../../components/Notifications/DismissableText'
import MoveBackToPoolActionButton from './MoveBackToPoolActionButton'
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext'
import { getMarket } from '../../../contexts/MarketsContext/marketsContextHelper'
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'
import { addInvestible, getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper'
import CardActions from '@material-ui/core/CardActions'
import clsx from 'clsx'
import AttachedFilesList from '../../../components/Files/AttachedFilesList'
import { useMetaDataStyles } from '../Planning/PlanningInvestible'
import { DiffContext } from '../../../contexts/DiffContext/DiffContext'
import { attachFilesToInvestible, deleteAttachedFilesFromInvestible } from '../../../api/investibles'
import { EMPTY_SPIN_RESULT } from '../../../constants/global'
import {
  HIGHLIGHT_REMOVE,
  HighlightedCommentContext
} from '../../../contexts/HighlightingContexts/HighlightedCommentContext'

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
    borderLeft: '1px solid #e0e0e0',
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
  title: {
    fontSize: 32,
    fontWeight: "bold",
    lineHeight: "42px",
    paddingBottom: "9px",
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
  upperRightCard: {
    display: "inline-flex",
    float: "right",
    padding: 0,
    margin: 0,
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
}));

export function getInlineBreadCrumbs (marketState, parentMarketId, parentInvestibleId, investiblesState) {
  const inlineParentMarket = getMarket(marketState, parentMarketId);
  let breadCrumbTemplates = [];
  if (inlineParentMarket) {
    // Better would be to peg loading a level up since above can resolve with wrong
    const { name: inlineParentMarketName } = inlineParentMarket
    breadCrumbTemplates = [{ name: inlineParentMarketName, link: formMarketLink(parentMarketId), id: 'marketCrumb' }]
  }
  if (parentInvestibleId) {
    const inlineParentInvestible = getInvestible(investiblesState, parentInvestibleId)
    if (inlineParentInvestible) {
      const { investible } = inlineParentInvestible
      const { name: parentInvestibleName } = investible
      breadCrumbTemplates.push({
        name: parentInvestibleName,
        link: formInvestibleLink(parentMarketId, parentInvestibleId), id: 'marketCrumb'
      })
    }
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
    toggleEdit,
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
  const [highlightedCommentState, highlightedCommentDispatch] = useContext(HighlightedCommentContext);
  const { name: marketName, id: marketId, market_stage: marketStage, allow_multi_vote: allowMultiVote,
  is_inline: isInline, parent_investible_id: parentInvestibleId, parent_market_id: parentMarketId } = market;
  let breadCrumbTemplates = [{ name: marketName, link: formMarketLink(marketId), id: 'marketCrumb'}];
  const [marketState] = useContext(MarketsContext);
  const [investiblesState] = useContext(InvestiblesContext);
  if (isInline) {
    breadCrumbTemplates = getInlineBreadCrumbs(marketState, parentMarketId, parentInvestibleId, investiblesState);
  }
  const breadCrumbs = inArchives
    ? makeArchiveBreadCrumbs(history, breadCrumbTemplates)
    : makeBreadCrumbs(history, breadCrumbTemplates);
  const investmentReasonsRemoved = investibleComments.filter((comment) => comment.comment_type !== JUSTIFY_TYPE);
  const investmentReasons = investibleComments.filter((comment) => comment.comment_type === JUSTIFY_TYPE);
  const myIssues = investibleComments.filter((comment) => comment.comment_type === ISSUE_TYPE && !comment.resolved);
  const marketIssues = comments.filter((comment) => comment.comment_type === ISSUE_TYPE && !comment.resolved && !comment.investible_id);
  const hasMarketIssue = !_.isEmpty(marketIssues);
  const hasIssue = !_.isEmpty(myIssues);
  const hasIssueOrMarketIssue = hasMarketIssue || hasIssue;
  const votingBlockedMessage = hasMarketIssue
    ? 'decisionInvestibleVotingBlockedMarket'
    : 'decisionInvestibleVotingBlockedInvestible'
  const { investible, market_infos: marketInfos } = fullInvestible
  const marketInfo = marketInfos.find((info) => info.market_id === marketId)
  const allowDelete = marketPresences && marketPresences.length < 2
  const [marketStagesState] = useContext(MarketStagesContext)
  const inProposedStage = getProposedOptionsStage(marketStagesState, marketId)
  const inProposed = inProposedStage && marketInfo.stage === inProposedStage.id
  const activeMarket = marketStage === ACTIVE_STAGE
  const yourPresence = marketPresences.find((presence) => presence.current_user)
  const yourVote = yourPresence && yourPresence.investments.find((investment) => investment.investible_id === investibleId)

  const {
    description, name, created_by: createdBy, locked_by: lockedBy, attached_files: attachedFiles,
  } = investible
  let lockedByName
  if (lockedBy) {
    const lockedByPresence = marketPresences.find((presence) => presence.id === lockedBy)
    if (lockedByPresence) {
      const { name } = lockedByPresence
      lockedByName = name
    }
  }

  const allowedCommentTypes = [QUESTION_TYPE, SUGGEST_CHANGE_TYPE, ISSUE_TYPE];

  function getActions() {
    return (
    <dl className={classes.upperRightCard}>
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
      {!inArchives && (isAdmin || (inProposed && createdBy === userId)) && (
        <EditMarketButton
          labelId="edit"
          marketId={marketId}
          onClick={toggleEdit}
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

  if (investibleId in highlightedCommentState) {
    highlightedCommentDispatch({ type: HIGHLIGHT_REMOVE, commentId: investibleId });
  }

  return (
    <Screen
      title={name}
      tabTitle={name}
      breadCrumbs={breadCrumbs}
      hidden={hidden}
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
      <Card className={classes.root}
            id="optionMain"
            elevation={0}
      >
        <CardType
          className={classes.cardType}
          label={`${intl.formatMessage({
            id: "decisionInvestibleDescription"
          })}`}
          type={VOTING_TYPE}
          subtype={OPTION}
        />
        <Grid container className={classes.mobileColumn}>
          <Grid item md={9} xs={12}>

        <CardContent className={classes.votingCardContent}>
          <Typography className={classes.title} variant="h3" component="h1">
            {name}
          </Typography>
          {lockedBy && (
            <Typography>
              {intl.formatMessage({ id: "lockedBy" }, { x: lockedByName })}
            </Typography>
          )}
          <DescriptionOrDiff
            id={investibleId}
            description={description}
          />
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
      {!inProposed && activeMarket && hasIssueOrMarketIssue && (
        <Typography>
          {intl.formatMessage({ id: votingBlockedMessage })}
        </Typography>
      )}
      {!inProposed && !inArchives && !hasIssueOrMarketIssue && (
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
              />
            </>
          )}
        </>
      )}
      {!inProposed && (
        <>
          <h2>
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
            />
          )}
          <CommentBox comments={investmentReasonsRemoved} marketId={marketId} allowedTypes={allowedCommentTypes} />
        </Grid>
      </Grid>
    </Screen>
  );
}

DecisionInvestible.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  market: PropTypes.object.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  fullInvestible: PropTypes.object.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  marketPresences: PropTypes.arrayOf(PropTypes.object),
  // eslint-disable-next-line react/forbid-prop-types
  investibleComments: PropTypes.arrayOf(PropTypes.object),
  // eslint-disable-next-line react/forbid-prop-types
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
  toggleEdit: () => {
  },
  isAdmin: false,
  inArchives: false,
  hidden: false,
};

export default DecisionInvestible;
