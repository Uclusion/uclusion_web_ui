import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { Typography, Grid, CardContent } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { useIntl } from 'react-intl';
import { useHistory } from 'react-router';
import { formInvestibleLink, navigate } from '../../../utils/marketIdPathFunctions';
import RaisedCard from '../../../components/Cards/RaisedCard';
import { ISSUE_TYPE } from '../../../constants/comments';
import { getCommentTypeIcon } from '../../../components/Comments/commentFunctions';
import { getCertaintyChart, getVoteTotalsForUser } from '../../../utils/userFunctions';
import VoteCard from '../../../components/Cards/VoteCard';

const useStyles = makeStyles(theme => ({
  noPadding: {
    padding: theme.spacing(0),
    '&:last-child': {
      padding: 0,
    },
  },
}));
function CurrentVoting(props) {
  const history = useHistory();
  const classes = useStyles();
  const intl = useIntl();
  const {
    marketPresences,
    investibles,
    marketId,
    comments,
  } = props;
  const strippedInvestibles = investibles.map((inv) => inv.investible);

  function getInvestibleVotes() {
    // first set every investibles support and investments to 0
    const tallies = strippedInvestibles.reduce((acc, inv) => {
      const { id } = inv;
      const augmented = {
        ...inv,
        investments: [],
        numSupporters: 0,
      };
      acc[id] = augmented;
      return acc;
    }, {});
    // now we fill in votes from market presences
    marketPresences.forEach((presence) => {
      const userInvestments = getVoteTotalsForUser(presence);
      Object.keys(userInvestments).forEach((investible_id) => {
        const oldValue = tallies[investible_id];
        if (oldValue) {
          const newInvestments = [...oldValue.investments, userInvestments[investible_id]];
          const newValue = {
            ...oldValue,
            investments: newInvestments,
            numSupporters: newInvestments.length,
          };
          tallies[investible_id] = newValue;
        }
      });
    });
    return tallies;
  }

  function getIndicator(comments, type) {
    const typeComments = comments.filter((comment) => comment.comment_type === type);
    if (typeComments.length > 0) {
      return getCommentTypeIcon(type);
    }
    return null;
  }

  function getCommentIndicators(comments) {
    const indicators = [];
    const commentRoots = comments.filter((comment) => !comment.parent_id && !comment.resolved);
    [ISSUE_TYPE].forEach((type) => {
      const indicator = getIndicator(commentRoots, type);
      if (indicator !== null) {
        indicators.push({ type, indicator });
      }
    });
    return indicators;
  }

  function getCommentsDisplay(commentIndicators) {
    return (
      <Grid
        container
        spacing={1}
        alignItems="flex-end"
      >
        {commentIndicators.map((indicatorInfo) => {
          const { type, indicator } = indicatorInfo;
          return (
            <Grid
              item
              key={type}
            >
              {indicator}
            </Grid>
          );
        })}
      </Grid>
    );
  }

  function getItemVote(item) {
    const { id, investments, name } = item;
    const investibleComments = comments.filter((comment) => comment.investible_id === id);
    const commentIndicators = getCommentIndicators(investibleComments);
    const issuesExist = commentIndicators.length > 0;
    return (
      <Grid
        item
        key={id}
        xs={12}
        sm={6}
      >
        <RaisedCard
          className="raisedcard"
          onClick={() => navigate(history, formInvestibleLink(marketId, id))}
        >
          <CardContent className={ classes.noPadding }>
            <VoteCard
              title={name}
              comments={commentIndicators}
              voteNum={intl.formatMessage({ id: 'numVoting' }, { x: investments.length })}
              chart={getCertaintyChart(investments)} />
            {/* <Grid
              direction="column"
              container
              spacing={1}
              alignItems="center"
            >
              <Grid
                item
                xs={12}
              >
                <Typography>
                  {name}
                </Typography>
              </Grid>
              <Grid
                item
                xs={12}
              >
                {issuesExist && getCommentsDisplay(commentIndicators)}
                {!issuesExist && getVoteDisplay(investments)}
              </Grid>
            </Grid> */}
          </CardContent>
        </RaisedCard>
      </Grid>
    );
  }

  const tallies = getInvestibleVotes();
  const talliesArray = Object.values(tallies);
  // descending order of support
  const sortedTalliesArray = _.sortBy(talliesArray, 'numSupporters', 'name').reverse();
  
  return (
    <Grid container spacing={1} >
      {sortedTalliesArray.map((item) => getItemVote(item))}
    </Grid>
  );
}

CurrentVoting.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  investibles: PropTypes.arrayOf(PropTypes.object),
  // eslint-disable-next-line react/forbid-prop-types
  marketPresences: PropTypes.arrayOf(PropTypes.object),
  marketId: PropTypes.string.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  comments: PropTypes.arrayOf(PropTypes.object),
};

CurrentVoting.defaultProps = {
  investibles: [],
  marketPresences: [],
  comments: [],
};

export default CurrentVoting;
