import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { useHistory } from 'react-router';
import { FormattedMessage, useIntl } from 'react-intl'
import { Card, CardContent, Grid, Typography } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles';
import YourVoting from '../Voting/YourVoting';
import Voting from './Voting';
import CommentBox from '../../../containers/CommentBox/CommentBox';
import {
  ISSUE_TYPE, JUSTIFY_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE,
} from '../../../constants/comments';
import CommentAddBox from '../../../containers/CommentBox/CommentAddBox';
import Screen from '../../../containers/Screen/Screen';
import { formMarketLink, makeArchiveBreadCrumbs, makeBreadCrumbs } from '../../../utils/marketIdPathFunctions';
import MoveToCurrentVotingActionButton from './MoveToCurrentVotingActionButton';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import {
  getProposedOptionsStage,
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { ACTIVE_STAGE } from '../../../constants/markets';
import DeleteInvestibleActionButton from './DeleteInvestibleActionButton';
import DescriptionOrDiff from '../../../components/Descriptions/DescriptionOrDiff';
import EditMarketButton from '../../Dialog/EditMarketButton';
import CardType, { VOTING_TYPE } from '../../../components/CardType';

const useStyles = makeStyles((theme) => ({
  container: {
    padding: "3px 89px 21px 21px",
    marginTop: "-6px",
    boxShadow: "none",
    [theme.breakpoints.down("sm")]: {
      padding: "3px 21px 42px 21px"
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
  votingCardContent: {
    margin: theme.spacing(2, 6),
    padding: 0
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
    toggleEdit,
    isAdmin,
    inArchives,
    hidden,
  } = props;

  const intl = useIntl();
  const history = useHistory();
  const classes = useStyles();

  const { name: marketName, id: marketId, market_stage: marketStage } = market;
  const breadCrumbTemplates = [{ name: marketName, link: formMarketLink(marketId), id: 'marketCrumb'}];
  const breadCrumbs = inArchives
    ? makeArchiveBreadCrumbs(history, breadCrumbTemplates)
    : makeBreadCrumbs(history, breadCrumbTemplates);
  // eslint-disable-next-line max-len
  const investmentReasonsRemoved = investibleComments.filter((comment) => comment.comment_type !== JUSTIFY_TYPE);
  // eslint-disable-next-line max-len
  const investmentReasons = investibleComments.filter((comment) => comment.comment_type === JUSTIFY_TYPE);
  // eslint-disable-next-line max-len
  const myIssues = investibleComments.filter((comment) => comment.comment_type === ISSUE_TYPE && !comment.resolved);
  // eslint-disable-next-line max-len
  const marketIssues = comments.filter((comment) => comment.comment_type === ISSUE_TYPE && !comment.resolved && !comment.investible_id);
  // eslint-disable-next-line max-len
  const hasMarketIssue = !_.isEmpty(marketIssues);
  const hasIssue = !_.isEmpty(myIssues);
  const hasIssueOrMarketIssue = hasMarketIssue || hasIssue;
  const votingBlockedMessage = hasMarketIssue
    ? 'decisionInvestibleVotingBlockedMarket'
    : 'decisionInvestibleVotingBlockedInvestible';
  const { investible, market_infos: marketInfos } = fullInvestible;
  const marketInfo = marketInfos.find((info) => info.market_id === marketId);
  const allowDelete = marketPresences && marketPresences.length < 2;
  const [marketStagesState] = useContext(MarketStagesContext);
  const inProposedStage = getProposedOptionsStage(marketStagesState, marketId);
  const inProposed = inProposedStage && marketInfo.stage === inProposedStage.id;
  const activeMarket = marketStage === ACTIVE_STAGE;
  const myPresence = marketPresences.find((presence) => presence.current_user);

  const {
    description, name, created_by: createdBy, locked_by: lockedBy,
  } = investible;
  let lockedByName;
  if (lockedBy) {
    const lockedByPresence = marketPresences.find((presence) => presence.id === lockedBy);
    if (lockedByPresence) {
      const { name } = lockedByPresence;
      lockedByName = name;
    }
  }

  const allowedCommentTypes = [ISSUE_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE];

  function getSidebarActions() {
    if (!activeMarket) {
      return [];
    }
    const sidebarActions = [];
    if (isAdmin) {
      if (inProposed) {
        sidebarActions.push(<MoveToCurrentVotingActionButton
          key="moveToCurrent"
          investibleId={investibleId}
          marketId={marketId}
        />);
      }
      if (allowDelete) {
        sidebarActions.push(<DeleteInvestibleActionButton
          key="delete"
          investibleId={investibleId}
          marketId={marketId}
        />);
      }
    }
    return sidebarActions;
  }

  if (!investibleId) {
    // we have no usable data;
    return <></>;
  }

  const canVote = myPresence && myPresence.following;

  return (
    <Screen
      title={name}
      tabTitle={name}
      breadCrumbs={breadCrumbs}
      hidden={hidden}
      sidebarActions={getSidebarActions()}
    >
      <Card elevation={0}>
        <CardType
          className={classes.cardType}
          label={`${intl.formatMessage({
            id: "decisionInvestibleDescription"
          })}`}
          type={VOTING_TYPE}
        />
        <CardContent className={classes.votingCardContent}>
          <h1>
            {name}
            {(isAdmin || (inProposed && createdBy === userId)) && (
              <EditMarketButton
                labelId="edit"
                marketId={marketId}
                onClick={toggleEdit}
              />
            )}
          </h1>
          {lockedBy && (
            <Typography>
              {intl.formatMessage({ id: "lockedBy" }, { x: lockedByName })}
            </Typography>
          )}
          <DescriptionOrDiff
            hidden={hidden}
            id={investibleId}
            description={description}
          />
        </CardContent>
      </Card>
      {!inProposed && hasIssueOrMarketIssue && (
        <Typography>
          {intl.formatMessage({ id: votingBlockedMessage })}
        </Typography>
      )}
      {!inProposed && canVote && !hasIssueOrMarketIssue && (
        <YourVoting
          investibleId={investibleId}
          marketPresences={marketPresences}
          comments={investmentReasons}
          userId={userId}
          market={market}
        />
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
          {activeMarket && (
            <CommentAddBox
              allowedTypes={allowedCommentTypes}
              investible={investible}
              marketId={marketId}
              issueWarningId="issueWarningInvestible"
            />
          )}
          <CommentBox comments={investmentReasonsRemoved} marketId={marketId} />
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
