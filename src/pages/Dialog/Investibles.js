import React from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router';
import { Grid, Paper, Typography, Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { formInvestibleLink, navigate } from '../../utils/marketIdPathFunctions';
import { Badge } from '@material-ui/core';
import { ISSUE_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE } from '../../containers/CommentBox/CommentBox';
import AnnouncementIcon from '@material-ui/icons/Announcement';
import RateReviewIcon from '@material-ui/icons/RateReview';
import LiveHelpIcon from '@material-ui/icons/LiveHelp';

const useStyles = makeStyles(theme => ({
  investibleCard: {
    padding: theme.spacing(2),
    textAlign: 'left',
    height: '4vh',
  },
}));

function Investibles(props) {
  const history = useHistory();
  const classes = useStyles();
  const { investibles, marketId, comments } = props;

  function getCommentIcons(comments) {
    const issues = comments.filter((comment) => comment.type === ISSUE_TYPE);
    const questions = comments.filter((comment) => comment.type === QUESTION_TYPE);
    const suggestions = comments.filter((comment) => comment.type === SUGGEST_CHANGE_TYPE);
    const icons = [];
    if (issues.length > 0) {
      icons.push(
        <Badge badgeContent={issues.length} color="primary" id="issues">
          <AnnouncementIcon />
        </Badge>
      );
    }
    if (suggestions.length > 0) {
      icons.push(
        <Badge badgeContent={suggestions.length} color="primary" id="suggestions">
          <RateReviewIcon />
        </Badge>
      );
    }
    if (questions.length > 0) {
      icons.push(
        <Badge badgeContent={questions.length} color="primary" id="questions">
          <LiveHelpIcon />
        </Badge>
      );
    }

  }

  function getInvestibles() {
    return investibles.map((inv) => {
      const { investible } = inv;
      const { id, name, } = investible;
      const investibleComments = comments.filter((comment) => comment.investible_id === id);
      return (
        <Grid
          item
          key={id}
          xs={12}
          s={6}
          md={4}
        >
          <Paper
            className={classes.investibleCard}
            onClick={() => navigate(history, formInvestibleLink(marketId, id))}
          >
            <Typography
              noWrap
            >
              {name}
            </Typography>
            {getCommentIcons(investibleComments)}
          </Paper>
        </Grid>
      );
    });
  }

  return (
    <Grid container spacing={4}>
      {getInvestibles()}
    </Grid>
  );

}

Investibles.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  investibles: PropTypes.arrayOf(PropTypes.object).isRequired,
  marketId: PropTypes.string.isRequired,
};

export default Investibles;