import React from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router';
import { Grid, Typography, } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { formInvestibleLink, navigate } from '../../../utils/marketIdPathFunctions';
import { Badge } from '@material-ui/core';
import { ISSUE_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE } from '../../../constants/comments';
import AnnouncementIcon from '@material-ui/icons/Announcement';
import RateReviewIcon from '@material-ui/icons/RateReview';
import LiveHelpIcon from '@material-ui/icons/LiveHelp';
import { FormattedDate, useIntl } from 'react-intl';
import RaisedCard from '../../../components/Cards/RaisedCard';

const useStyles = makeStyles(theme => ({
  investibleCard: {
    textAlign: 'left',
  },
  textData: {
    fontSize: 12,
  },
}));

function ProposedIdeas(props) {
  const history = useHistory();
  const classes = useStyles();
  const { investibles, marketId, comments } = props;
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
        </Badge>
      );
    }
    if (Array.isArray(suggestions) && suggestions.length > 0) {
      icons.push(
        <Badge badgeContent={suggestions.length} color="primary" id="suggestions">
          <RateReviewIcon />
        </Badge>
      );
    }
    if (Array.isArray(questions) && questions.length > 0) {
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
      const { id, name } = investible;
      const investibleComments = Array.isArray(comments)
        && comments.filter((comment) => comment.investible_id === id);
      return (
        <Grid
          item
          key={id}
          xs={12}
          s={6}
          md={4}
        >

          <RaisedCard
            className={classes.investibleCard}
            onClick={() => navigate(history, formInvestibleLink(marketId, id))}
          >

            <Typography>
              {name}
            </Typography>
            <Typography
              color="textSecondary"
              className={classes.textData}
            >
              {updatedText}<FormattedDate value={investible.updated_at} />
            </Typography>
            {getCommentIcons(investibleComments)}
          </RaisedCard>
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

ProposedIdeas.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  investibles: PropTypes.arrayOf(PropTypes.object).isRequired,
  marketId: PropTypes.string.isRequired,
};

export default ProposedIdeas;