import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'
import { FormattedMessage, useIntl } from 'react-intl'
import clsx from 'clsx'
import { Card, CardContent, Typography } from '@material-ui/core'
import ReadOnlyQuillEditor from '../../../components/TextEditors/ReadOnlyQuillEditor'
import { makeStyles } from '@material-ui/styles'
import CardType from '../../../components/CardType'
import ProgressBar from '../../../components/Expiration/ProgressBarExpiration'
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext'
import { findMessageOfTypeAndId } from '../../../utils/messageUtils'
import Gravatar from '../../../components/Avatars/Gravatar';

const useVoteStyles = makeStyles(
  theme => {
    return {
      root: {
        listStyle: "none",
        margin: 0,
        padding: 0
      },
      card: {
        position: "relative"
      },
      cardContent: {
        flex: "0 1 100%",
        padding: 0,
        margin: theme.spacing(2, 2, 0),
        "& .ql-editor": {
          padding: 0
        }
      },
      cardType: {
        display: "inline-block"
      },
      voter: {
        marginLeft: 6,
        fontSize: 16,
        fontWeight: "bold"
      },
      highlighted: {
        boxShadow: "10px 5px 5px yellow"
      },
      expiresDisplay: {
        alignItems: "flex-end",
        display: "flex",
        flexDirection: "column",
        position: "absolute",
        right: 0,
      },
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
  const { marketPresences, investibleId, investmentReasons, showExpiration, expirationMinutes } = props;
  const [messagesState] = useContext(NotificationsContext);
  const classes = useVoteStyles();
  const intl = useIntl();
  function getInvestibleVoters() {
    const acc = [];
    marketPresences.forEach(presence => {
      const { name, id, email, investments } = presence;
      investments.forEach(investment => {
        const {
          quantity,
          investible_id: invId,
          max_budget: maxBudget,
          max_budget_unit: maxBudgetUnit,
          updated_at: updatedAt,
          deleted
        } = investment;
        // // console.debug(investment);
        if (investibleId === invId && !deleted) {
          acc.push({ name, userId: id, email, quantity, maxBudget, maxBudgetUnit, updatedAt });
        }
      });
    });
    return acc;
  }

  function getVoterReason(userId) {
    return investmentReasons.find(comment => comment.created_by === userId);
  }

  const voters = getInvestibleVoters();
  const sortedVoters = _.sortBy(voters, "quantity");

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
        const { name, email, userId, quantity, maxBudget, maxBudgetUnit, updatedAt } = voter;
        const myMessage = findMessageOfTypeAndId(`${investibleId}_${userId}`, messagesState, 'VOTE');
        const reason = getVoterReason(userId);
        const voteId = `cv${userId}`;

        return (
          <Card
            elevation={0}
            key={userId}
            className={clsx(
              classes.card,
              myMessage && classes.highlighted
            )}
            component="li"
            id={voteId}
          >
            <CardType
              className={classes.cardType}
              type={`certainty${Math.abs(quantity)}`}
            />
            {showExpiration && (
              <div className={classes.expiresDisplay}>
                <ProgressBar
                  createdAt={new Date(updatedAt)}
                  expirationMinutes={expirationMinutes}
                  smallForMobile={true}
                />
              </div>
            )}
            <CardContent className={classes.cardContent}>
              <div style={{display: 'flex', alignItems: 'center'}}>
              <Gravatar email={email} name={name}/>
              <Typography className={classes.voter} component="strong">
                {maxBudget > 0 && !maxBudgetUnit && intl.formatMessage({id: 'maxBudgetValue'},
                  { x: maxBudget})}
                {maxBudget > 0 && maxBudgetUnit && intl.formatMessage({id: 'maxBudgetValueWithUnits'},
                  { x: maxBudget, y: maxBudgetUnit, name})}
                {(!maxBudget > 0) && name}
              </Typography>
              </div>
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
  investibleId: PropTypes.string
};

Voting.defaultProps = {
  investmentReasons: [],
  marketPresences: []
};

export default Voting;
