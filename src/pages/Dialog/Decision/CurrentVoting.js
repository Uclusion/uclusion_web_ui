import React from "react";
import PropTypes from "prop-types";
import _ from "lodash";
import { Grid, CardContent } from "@material-ui/core";
import { makeStyles } from "@material-ui/styles";
import { pink } from '@material-ui/core/colors';
import { useIntl } from 'react-intl';
import { useHistory } from "react-router";
import {
  formInvestibleLink,
  navigate
} from "../../../utils/marketIdPathFunctions";
import RaisedCard from "../../../components/Cards/RaisedCard";
import { getVoteTotalsForUser } from "../../../utils/userFunctions";
import VoteCard from "../../../components/Cards/VoteCard";
import { ISSUE_TYPE } from "../../../constants/comments";
import { getCommentTypeIcon } from "../../../components/Comments/commentFunctions";
import useFitText from 'use-fit-text'

const useStyles = makeStyles(theme => ({
  noPadding: {
    padding: theme.spacing(0),
    "&:last-child": {
      padding: 0
    }
  },
  warnNoOptions: {
    backgroundColor: pink[500],
    display: 'grid',
    gridTemplateColumns: 'calc(100% - 130px) 130px',
    width: '100%',
    height: '97px',
    padding: '10px 0',
    background: 'white',
  },
  title: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    height: '77px',
    margin: '3px',
    padding: '0 20px',
    fontWeight: 'bold',
    color: '#3e3e3e',
    overflow: 'hidden',
  },
}));

function CurrentVoting(props) {
  const history = useHistory();
  const classes = useStyles();
  const intl = useIntl();
  const { marketPresences, investibles, marketId, comments } = props;
  const strippedInvestibles = investibles.map(inv => inv.investible);

  function getInvestibleVotes() {
    // first set every investibles support and investments to 0
    const tallies = strippedInvestibles.reduce((acc, inv) => {
      const { id } = inv;
      const augmented = {
        ...inv,
        investments: [],
        numSupporters: 0
      };
      acc[id] = augmented;
      return acc;
    }, {});
    // now we fill in votes from market presences
    marketPresences.forEach(presence => {
      const userInvestments = getVoteTotalsForUser(presence);
      Object.keys(userInvestments).forEach((investible_id) => {
        const oldValue = tallies[investible_id];
        if (oldValue) {
          const newInvestments = [
            ...oldValue.investments,
            userInvestments[investible_id],
          ];
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

  function getItemVote(item) {
    const { id, investments, name } = item;
    const investibleComments = comments.filter(
      comment =>
        comment.investible_id === id &&
        !comment.parent_id &&
        !comment.resolved &&
        getCommentTypeIcon(comment.comment_type) &&
        comment.comment_type === ISSUE_TYPE
    );

    return (
      <Grid item key={id} xs={12} sm={12} md={6}>
        <RaisedCard
          className="raisedcard"
          onClick={() => navigate(history, formInvestibleLink(marketId, id))}
        >
          <CardContent className={classes.noPadding}>
            <VoteCard
              title={name}
              comments={investibleComments}
              votes={investments}
            />
          </CardContent>
        </RaisedCard>
      </Grid>
    );
  }

  const tallies = getInvestibleVotes();
  const talliesArray = Object.values(tallies);
  // descending order of support
  const sortedTalliesArray = _.sortBy(
    talliesArray,
    'numSupporters',
    'name'
  ).reverse();
  const { fontSize, ref } = useFitText({ maxFontSize: 200 });
  return (
    <Grid container spacing={1}>
      {!_.isEmpty(sortedTalliesArray) && sortedTalliesArray.map((item) => getItemVote(item))}
      {_.isEmpty(sortedTalliesArray) && (
        <Grid item key="noneWarning">
          <RaisedCard
            className="raisedcard"
          >
            <CardContent className={classes.warnNoOptions}>
              <div
                ref={ref}
                style={{
                  fontSize,
                }}
                className={classes.title}
              >
                {intl.formatMessage({ id: 'decisionDialogNoInvestiblesWarning' })}
              </div>
            </CardContent>
          </RaisedCard>
        </Grid>
      )}
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
  comments: PropTypes.arrayOf(PropTypes.object)
};

CurrentVoting.defaultProps = {
  investibles: [],
  marketPresences: [],
  comments: []
};

export default CurrentVoting;
