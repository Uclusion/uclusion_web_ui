import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'
import { FormattedMessage, useIntl } from 'react-intl'
import { Card, CardActions, CardContent, Typography } from '@material-ui/core'
import ReadOnlyQuillEditor from '../../../components/TextEditors/ReadOnlyQuillEditor'
import { makeStyles } from '@material-ui/styles'
import CardType from '../../../components/CardType'
import ProgressBar from '../../../components/Expiration/ProgressBarExpiration'
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext'
import { findMessageOfTypeAndId } from '../../../utils/messageUtils'
import Gravatar from '../../../components/Avatars/Gravatar';
import { getInvestibleVoters } from '../../../utils/votingUtils';
import EditOutlinedIcon from '@material-ui/icons/EditOutlined'

const useVoteStyles = makeStyles(
  theme => {
    return {
      root: {
        listStyle: "none",
        margin: 0,
        padding: 0,
        paddingBottom: '1rem'
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
        },
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
      editVoteDisplay: {
        alignItems: "flex-end",
        display: "flex",
        flexDirection: "column",
        position: "absolute",
        right: '4rem',
        top: 0
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
  const { marketPresences, investibleId, investmentReasons, showExpiration, expirationMinutes,
    setVotingBeingEdited, votingAllowed, yourPresence } = props;
  const [messagesState] = useContext(NotificationsContext);
  const classes = useVoteStyles();
  const intl = useIntl();

  function getVoterReason(userId) {
    return investmentReasons.find(comment => comment.created_by === userId);
  }

  const voters = getInvestibleVoters(marketPresences, investibleId);
  const sortedVoters = _.sortBy(voters, "quantity");

  if (sortedVoters.length === 0 || !yourPresence) {
    return (
      <Typography>
        <FormattedMessage id="noVoters" />
      </Typography>
    );
  }

  return (
    <ol className={classes.root}>
      {sortedVoters.map(voter => {
        const { name, email, id: userId, quantity, maxBudget, maxBudgetUnit, updatedAt } = voter;
        const isYourVote = userId === yourPresence.id;
        const myMessage = findMessageOfTypeAndId(`${investibleId}_${userId}`, messagesState, 'VOTE');
        const reason = getVoterReason(userId);
        const voteId = `cv${userId}`;

        return (
          <div className={myMessage && classes.highlighted}>
            <Card
              key={userId}
              className={classes.card}
              component="li"
              id={voteId}
              elevation={3}
            >
              <CardType
                className={classes.cardType}
                type={`certainty${Math.abs(quantity)}`}
              />
              {isYourVote && votingAllowed && (
                <CardActions className={classes.editVoteDisplay}>
                  <EditOutlinedIcon style={{maxHeight: '1.25rem', cursor: 'pointer'}} onClick={setVotingBeingEdited}/>
                </CardActions>
              )}
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
                <div style={{display: 'flex', alignItems: 'center', paddingBottom: '1rem'}}>
                  <Gravatar email={email} name={name}/>
                  <Typography className={classes.voter} component="strong">
                    {maxBudget > 0 && !maxBudgetUnit && intl.formatMessage({id: 'maxBudgetValue'},
                      { x: maxBudget, name})}
                    {maxBudget > 0 && maxBudgetUnit && intl.formatMessage({id: 'maxBudgetValueWithUnits'},
                      { x: maxBudget, y: maxBudgetUnit, name})}
                    {(!maxBudget > 0) && name}
                  </Typography>
                </div>
                {reason && <ReadOnlyQuillEditor value={reason.body} />}
              </CardContent>
            </Card>
          </div>
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
