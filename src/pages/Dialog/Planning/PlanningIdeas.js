import React from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router';
import {
  Paper, Typography, Badge, Link,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import AnnouncementIcon from '@material-ui/icons/Announcement';
import RateReviewIcon from '@material-ui/icons/RateReview';
import LiveHelpIcon from '@material-ui/icons/LiveHelp';
import { FormattedDate, useIntl } from 'react-intl';
import GridListTile from '@material-ui/core/GridListTile';
import { formInvestibleLink, formMarketAddInvestibleLink, navigate } from '../../../utils/marketIdPathFunctions';
import { ISSUE_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE } from '../../../constants/comments';
import { pink } from '@material-ui/core/colors';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
  investibleCard: {
    padding: theme.spacing(2),
    textAlign: 'left',
    marginRight: theme.spacing(1),
    backgroundColor: theme.palette.grey[300],
  },
  warningCard: {
    padding: theme.spacing(2),
    textAlign: 'left',
    marginRight: theme.spacing(1),
    backgroundColor: pink[500],
  },
  blockedInvestible: {
    padding: theme.spacing(2),
    textAlign: 'left',
    marginRight: theme.spacing(1),
    backgroundColor: theme.palette.error.main,
  },
  investibleCardAccepted: {
    padding: theme.spacing(2),
    textAlign: 'left',
    marginRight: theme.spacing(1),
  },
  textData: {
    fontSize: 12,
  },
}));

function PlanningIdeas(props) {
  const history = useHistory();
  const classes = useStyles();
  const {
    investibles, marketId, comments, acceptedStageId, inDialogStageId, inReviewStageId, inBlockingStageId, presenceId,
  } = props;
  const intl = useIntl();

  function getCommentIcons(comments) {
    if (!Array.isArray(comments)) {
      return;
    }
    const issues = comments.filter((comment) => comment.type === ISSUE_TYPE);
    const questions = comments.filter((comment) => comment.type === QUESTION_TYPE);
    const suggestions = comments.filter((comment) => comment.type === SUGGEST_CHANGE_TYPE);
    const icons = [];
    if (Array.isArray(issues) && issues.length > 0) {
      icons.push(
        <Badge badgeContent={issues.length} color="primary" id="issues">
          <AnnouncementIcon/>
        </Badge>,
      );
    }
    if (Array.isArray(suggestions) && suggestions.length > 0) {
      icons.push(
        <Badge badgeContent={suggestions.length} color="primary" id="suggestions">
          <RateReviewIcon/>
        </Badge>,
      );
    }
    if (Array.isArray(questions) && questions.length > 0) {
      icons.push(
        <Badge badgeContent={questions.length} color="primary" id="questions">
          <LiveHelpIcon/>
        </Badge>,
      );
    }
  }

  function createWarningShellInvestible(stageId) {

    const isAccepted = stageId === acceptedStageId;
    const warningText = isAccepted ? intl.formatMessage(({ id: 'planningNoneAcceptedWarning' }))
      : intl.formatMessage(({ id: 'planningNoneInDialogWarning' }));

    const contents = (
      <Paper className={classes.warningCard}>
        <Typography
          noWrap
        >
          {warningText}
        </Typography>
      </Paper>
    );

    if (!isAccepted) {
      function onClick() {
        const link = formMarketAddInvestibleLink(marketId);
        const assignedLink = link + `#assignee=${presenceId}`;
        navigate(history, assignedLink);
      }
      return (
        <Link
          underline="none"
          key={stageId}
          onClick={onClick}
        >
          {contents}
        </Link>
      );
    }
    return (
      <div>
        {contents}
      </div>
    );
  }

  function getInvestibles(stageId, doCreateWarningShells) {
    // console.log(comments);
    const filtered = investibles.filter((investible) => {
      const { market_infos: marketInfos } = investible;
      // console.log(`Investible id is ${id}`);
      const marketInfo = marketInfos.find((info) => info.market_id === marketId);
      return marketInfo.stage === stageId;
    });
    if (doCreateWarningShells && (!Array.isArray(filtered) || filtered.length === 0)) {
      return createWarningShellInvestible(stageId,);
    }
    return filtered.map((inv) => {
      const { investible, market_infos: marketInfos } = inv;
      const { id, name } = investible;
      const investibleComments = Array.isArray(comments)
        && comments.filter((comment) => comment.investible_id === id);
      const marketInfo = marketInfos.find((info) => info.market_id === marketId);
      const updatedText = marketInfo.stage === acceptedStageId
        ? intl.formatMessage(({ id: 'acceptedInvestiblesUpdatedAt' }))
        : marketInfo.stage === inReviewStageId ? intl.formatMessage(({ id: 'reviewingInvestiblesUpdatedAt' }))
          : marketInfo.stage === inBlockingStageId ? intl.formatMessage(({ id: 'blockedInvestiblesUpdatedAt' }))
            : intl.formatMessage(({ id: 'inDialogInvestiblesUpdatedAt' }));
      return (
        <div key={id}>
          <Paper
            className={marketInfo.stage === acceptedStageId
              ? classes.investibleCardAccepted : marketInfo.stage === inBlockingStageId
                ? classes.blockedInvestible : classes.investibleCard}
            onClick={() => navigate(history, formInvestibleLink(marketId, id))}
          >
            <Typography>
              {name}
            </Typography>
            <Typography
              color="textSecondary"
              className={classes.textData}
            >
              {updatedText}
              <FormattedDate value={marketInfo.updated_at}/>
            </Typography>
            {getCommentIcons(investibleComments)}
          </Paper>
        </div>
      );
    });
  }

  return (
    <>
      <GridListTile key={`indialog${presenceId}`} cols={1} style={{ height: 'auto', width: '25%' }}>
        {getInvestibles(inDialogStageId, true)}
      </GridListTile>
      <GridListTile key={`accepted${presenceId}`} cols={1} style={{ height: 'auto', width: '25%' }}>
        {getInvestibles(acceptedStageId, true)}
      </GridListTile>
      <GridListTile key={`inreview${presenceId}`} cols={1} style={{ height: 'auto', width: '25%' }}>
        {getInvestibles(inReviewStageId, false)}
      </GridListTile>
      <GridListTile key={`blocked${presenceId}`} cols={1} style={{ height: 'auto', width: '25%' }}>
        {getInvestibles(inBlockingStageId, false)}
      </GridListTile>
    </>
  );
}

PlanningIdeas.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  investibles: PropTypes.arrayOf(PropTypes.object),
  marketId: PropTypes.string.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  comments: PropTypes.arrayOf(PropTypes.object),
  acceptedStageId: PropTypes.string.isRequired,
  inDialogStageId: PropTypes.string.isRequired,
  inReviewStageId: PropTypes.string.isRequired,
  inBlockingStageId: PropTypes.string.isRequired,
  presenceId: PropTypes.string.isRequired,
};

PlanningIdeas.defaultProps = {
  investibles: [],
  comments: [],
};

export default PlanningIdeas;
