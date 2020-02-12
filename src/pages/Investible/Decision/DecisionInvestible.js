import React, { useState, useRef, useContext } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { useHistory } from 'react-router';
import { useIntl } from 'react-intl';
import { Grid, Paper, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import SubSection from '../../../containers/SubSection/SubSection';
import YourVoting from '../Voting/YourVoting';
import Voting from './Voting';
import CommentBox from '../../../containers/CommentBox/CommentBox';
import {
  ISSUE_TYPE, JUSTIFY_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE,
} from '../../../constants/comments';
import CommentAddBox from '../../../containers/CommentBox/CommentAddBox';
import RaiseIssue from '../../../components/SidebarActions/RaiseIssue';
import AskQuestions from '../../../components/SidebarActions/AskQuestion';
import Screen from '../../../containers/Screen/Screen';
import { formMarketLink, makeArchiveBreadCrumbs, makeBreadCrumbs } from '../../../utils/marketIdPathFunctions';
import InvestibleEditActionButton from '../InvestibleEditActionButton';
import SuggestChanges from '../../../components/SidebarActions/SuggestChanges';
import MoveToCurrentVotingActionButton from './MoveToCurrentVotingActionButton';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import {
  getProposedOptionsStage,
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { ACTIVE_STAGE } from '../../../constants/markets';
import { SECTION_TYPE_PRIMARY, SECTION_TYPE_SECONDARY } from '../../../constants/global'
import DeleteInvestibleActionButton from './DeleteInvestibleActionButton';
import DescriptionOrDiff from '../../../components/Descriptions/DescriptionOrDiff';

const useStyles = makeStyles((theme) => ({
  container: {
    padding: '3px 89px 21px 21px',
    marginTop: '-6px',
    boxShadow: 'none',
    [theme.breakpoints.down('sm')]: {
      padding: '3px 21px 42px 21px',
    },
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: '42px',
    paddingBottom: '9px',
    [theme.breakpoints.down('xs')]: {
      fontSize: 25,
    },
  },
  content: {
    fontSize: '15 !important',
    lineHeight: '175%',
    color: '#414141',
    [theme.breakpoints.down('xs')]: {
      fontSize: 13,
    },
    '& > .ql-container': {
      fontSize: '15 !important',
    },
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
  const [commentAddType, setCommentAddType] = useState(ISSUE_TYPE);
  const [commentAddHidden, setCommentAddHidden] = useState(true);
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

  const commentAddRef = useRef(null);

  const allowedCommentTypes = [ISSUE_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE];

  function commentButtonOnClick(type) {
    setCommentAddType(type);
    setCommentAddHidden(false);
  }

  function closeCommentAdd() {
    setCommentAddHidden(true);
  }


  function getSidebarActions() {
    if (!activeMarket) {
      return [];
    }
    const sidebarActions = [];
    if (isAdmin) {
      sidebarActions.push(<InvestibleEditActionButton key="edit" onClick={toggleEdit} />);
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

    if (inProposed && createdBy === userId) {
      sidebarActions.push(<InvestibleEditActionButton key="edit" onClick={toggleEdit} />);
    }

    sidebarActions.push(<RaiseIssue key="issue" onClick={commentButtonOnClick} />);
    sidebarActions.push(<AskQuestions key="question" onClick={commentButtonOnClick} />);
    sidebarActions.push(<SuggestChanges key="suggest" onClick={commentButtonOnClick} />);
    return sidebarActions;
  }

  if (!investibleId) {
    // we have no usable data;
    return <></>;
  }

  const hasDiscussion = !_.isEmpty(investmentReasonsRemoved);
  const discussionVisible = !commentAddHidden || hasDiscussion;
  const canVote = myPresence && myPresence.following;

  return (
    <Screen
      title={name}
      tabTitle={name}
      breadCrumbs={breadCrumbs}
      hidden={hidden}
      sidebarActions={getSidebarActions()}
    >
      <Grid container spacing={2}>
        <Grid
          id="description"
          item xs={12}>
          <SubSection
            type={SECTION_TYPE_PRIMARY}
            title={intl.formatMessage({ id: 'decisionInvestibleDescription' })}
          >
            <Paper
              className={classes.container}>
              <Typography className={classes.title} variant="h3" component="h1">
                {name}
              </Typography>
              <DescriptionOrDiff
                hidden={hidden}
                id={investibleId}
                description={description}
              />
            </Paper>
            {inProposed && lockedBy && (
              <Typography>
                {intl.formatMessage({ id: 'lockedBy' }, { x: lockedByName })}
              </Typography>
            )}
          </SubSection>
        </Grid>
        {!inProposed && canVote && (
        <Grid
          id="yourVote"
          item xs={12}>
          <SubSection
            type={SECTION_TYPE_SECONDARY}
            title={intl.formatMessage({ id: 'decisionInvestibleYourVoting' })}
          >
            {hasIssueOrMarketIssue && (
              <Typography>
                {intl.formatMessage({ id: votingBlockedMessage })}
              </Typography>
            )}
            {!hasIssueOrMarketIssue && (
              <YourVoting
                investibleId={investibleId}
                marketPresences={marketPresences}
                comments={investmentReasons}
                userId={userId}
                market={market}
              />
            )}
          </SubSection>
        </Grid>
        )}
        {!inProposed && (
        <Grid item xs={12}>
          <SubSection
            type={SECTION_TYPE_SECONDARY}
            title={intl.formatMessage({ id: 'decisionInvestibleOthersVoting' })}
          >
            <Voting
              investibleId={investibleId}
              marketPresences={marketPresences}
              investmentReasons={investmentReasons}
            />
          </SubSection>
        </Grid>
        )}
        {discussionVisible && (
        <Grid item xs={12}>
          <SubSection
            type={SECTION_TYPE_SECONDARY}
            title={intl.formatMessage({ id: 'decisionInvestibleDiscussion' })}
          >
            <CommentAddBox
              hidden={commentAddHidden}
              allowedTypes={allowedCommentTypes}
              investible={investible}
              marketId={marketId}
              issueWarningId="issueWarningInvestible"
              type={commentAddType}
              onSave={closeCommentAdd}
              onCancel={closeCommentAdd}
            />
            <div ref={commentAddRef} />
            <CommentBox comments={investmentReasonsRemoved} marketId={marketId} />
          </SubSection>
        </Grid>
        )}
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
