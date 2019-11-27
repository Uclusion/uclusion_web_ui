import React from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router';
import {
  Grid, Paper, Typography, Badge,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import AnnouncementIcon from '@material-ui/icons/Announcement';
import RateReviewIcon from '@material-ui/icons/RateReview';
import LiveHelpIcon from '@material-ui/icons/LiveHelp';
import { FormattedDate, useIntl } from 'react-intl';
import GridList from '@material-ui/core/GridList';
import GridListTile from '@material-ui/core/GridListTile';
import { formInvestibleLink, navigate } from '../../../utils/marketIdPathFunctions';
import { ISSUE_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE } from '../../../constants/comments';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
  investibleCard: {
    padding: theme.spacing(2),
    textAlign: 'left',
    backgroundColor: theme.palette.grey[theme.palette.type === 'dark' ? 900 : 100],
  },
  investibleCardAccepted: {
    padding: theme.spacing(2),
    textAlign: 'left',
  },
  textData: {
    fontSize: 12,
  },
}));

function PlanningIdeas(props) {
  const history = useHistory();
  const classes = useStyles();
  const {
    investibles, marketId, comments, acceptedStageId, inDialogStageId,
  } = props;
  const intl = useIntl();
  const updatedText = intl.formatMessage(({ id: 'decisionDialogInvestiblesUpdatedAt' }));

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
          <AnnouncementIcon />
        </Badge>,
      );
    }
    if (Array.isArray(suggestions) && suggestions.length > 0) {
      icons.push(
        <Badge badgeContent={suggestions.length} color="primary" id="suggestions">
          <RateReviewIcon />
        </Badge>,
      );
    }
    if (Array.isArray(questions) && questions.length > 0) {
      icons.push(
        <Badge badgeContent={questions.length} color="primary" id="questions">
          <LiveHelpIcon />
        </Badge>,
      );
    }
  }

  function getInvestibles(stageId) {
    const filterOutArchived = investibles.filter((investible) => {
      const { market_infos: marketInfos } = investible;
      const marketInfo = marketInfos.find((info) => info.market_id === marketId);
      return marketInfo.stage === stageId;
    });
    return filterOutArchived.map((inv) => {
      const { investible, market_infos: marketInfos } = inv;
      const { id, name } = investible;
      const investibleComments = Array.isArray(comments)
        && comments.filter((comment) => comment.investible_id === id);
      const marketInfo = marketInfos.find((info) => info.market_id === marketId);
      // TODO if one of those filtered arrays is empty need to add dummy to it that doesn't link
      // but does show red and warn
      return (
        <Grid
          item
          key={id}
        >
          <Paper
            className={marketInfo.stage === acceptedStageId
              ? classes.investibleCardAccepted : classes.investibleCard}
            onClick={() => navigate(history, formInvestibleLink(marketId, id))}
          >
            <Typography
              noWrap
            >
              {name}
            </Typography>
            <Typography
              color="textSecondary"
              className={classes.textData}
            >
              {updatedText}
              <FormattedDate value={investible.updated_at} />
            </Typography>
            {getCommentIcons(investibleComments)}
          </Paper>
        </Grid>
      );
    });
  }

  return (
    <div className={classes.root}>
      <GridList cols={2}>
        <GridListTile>
          {getInvestibles(acceptedStageId)}
        </GridListTile>
        <GridListTile>
          {getInvestibles(inDialogStageId)}
        </GridListTile>
      </GridList>
    </div>
  );
}

PlanningIdeas.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  investibles: PropTypes.arrayOf(PropTypes.object).isRequired,
  marketId: PropTypes.string.isRequired,
  acceptedStageId: PropTypes.string.isRequired,
  inDialogStageId: PropTypes.string.isRequired,
};

export default PlanningIdeas;
