import React, { useContext } from "react";
import PropTypes from "prop-types";
import _ from "lodash";
import { FormattedMessage } from "react-intl";
import clsx from "clsx";
import { Card, CardContent, Typography } from "@material-ui/core";
import ReadOnlyQuillEditor from "../../../components/TextEditors/ReadOnlyQuillEditor";
import { HighlightedVotingContext } from "../../../contexts/HighlightedVotingContext";
import { makeStyles } from "@material-ui/styles";
import CardType from "../../../components/CardType";

const useVoteStyles = makeStyles(
  theme => {
    return {
      root: {
        listStyle: "none",
        margin: 0,
        padding: 0
      },
      card: {
        alignItems: "flex-start",
        display: "flex",
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between"
      },
      maxBudget: {
        alignItems: "flex-end",
        display: "flex",
        flexDirection: "column",
        margin: theme.spacing(2),
        textTransform: "capitalize"
      },
      maxBudgetLabel: {
        color: "#757575",
        fontSize: 14
      },
      maxBudgetValue: {
        fontSize: 16,
        fontWeight: "bold"
      },
      cardContent: {
        flex: "0 1 100%",
        padding: 0,
        margin: theme.spacing(0, 2),
        "& .ql-editor": {
          padding: 0
        }
      },
      voter: {
        fontSize: 16,
        fontWeight: "bold"
      },
      containerYellow: {
        boxShadow: "10px 5px 5px yellow"
      }
    };
  },
  { name: "Vote" }
);

/**
 * The voting for an investible screen is the detail. It lists the people,
 * their certainty and their reasons
 * @constructor
 */
function Voting(props) {
  const { marketPresences, investibleId, investmentReasons } = props;
  const [highlightedVoteState] = useContext(HighlightedVotingContext);
  const classes = useVoteStyles();
  function getInvestibleVoters() {
    const acc = [];
    marketPresences.forEach(presence => {
      const { name, id, investments } = presence;
      investments.forEach(investment => {
        const {
          quantity,
          investible_id: invId,
          max_budget: maxBudget
        } = investment;
        // console.debug(investment);
        if (investibleId === invId) {
          acc.push({ name, userId: id, quantity, maxBudget });
        }
      });
    });
    return acc;
  }

  function getVoterReason(userId) {
    return investmentReasons.find(comment => comment.created_by === userId);
  }

  const voters = getInvestibleVoters();
  const sortedVoters = _.sortBy(voters, "name");

  if (sortedVoters.length === 0) {
    return (
      <Typography>
        <FormattedMessage id="noVoters" />
      </Typography>
    );
  }

  return (
    <ol className={classes.root}>
      {sortedVoters.map(voter => {
        const { name, userId, quantity, maxBudget } = voter;
        const reason = getVoterReason(userId);
        const voteId = `cv${userId}`;

        return (
          <Card
            key={userId}
            className={clsx(
              classes.card,
              userId in highlightedVoteState && classes.highlighted
            )}
            component="li"
            id={voteId}
          >
            <CardType type={`certainty${quantity}`} />
            {maxBudget > 0 && (
              <Typography className={classes.maxBudget} component="div">
                <div className={classes.maxBudgetLabel}>
                  <FormattedMessage id="maxBudgetLabel" />
                </div>
                <div className={classes.maxBudgetValue}>
                  <FormattedMessage
                    id="maxBudgetValue"
                    values={{ x: maxBudget }}
                  />
                </div>
              </Typography>
            )}
            <CardContent className={classes.cardContent}>
              <Typography className={classes.voter} component="strong">
                {name}
              </Typography>
              {reason && <ReadOnlyQuillEditor value={reason.body} />}
            </CardContent>
          </Card>
        );
      })}
    </ol>
  );
}

Voting.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  investmentReasons: PropTypes.arrayOf(PropTypes.object),
  // eslint-disable-next-line react/forbid-prop-types
  marketPresences: PropTypes.arrayOf(PropTypes.object),
  investibleId: PropTypes.string.isRequired
};

Voting.defaultProps = {
  investmentReasons: [],
  marketPresences: []
};

export default Voting;
