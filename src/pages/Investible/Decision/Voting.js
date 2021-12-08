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
import { findMessageOfTypeAndId, findMessagesForInvestibleId } from '../../../utils/messageUtils'
import Gravatar from '../../../components/Avatars/Gravatar';
import { getInvestibleVoters } from '../../../utils/votingUtils';
import EditOutlinedIcon from '@material-ui/icons/EditOutlined'
import { deleteOrDehilightMessages } from '../../../api/users'
import { SettingsBackupRestore } from '@material-ui/icons'
import SpinningIconLabelButton from '../../../components/Buttons/SpinningIconLabelButton'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import YourVoting from '../Voting/YourVoting'
import { workListStyles } from '../../Home/YourWork/WorkListItem'

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
      cardPadded: {
        position: "relative",
        marginTop: '1rem'
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
        boxShadow: "4px 4px 4px yellow"
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
  const { marketPresences, investibleId, investmentReasons, showExpiration, expirationMinutes, votingPageState,
    updateVotingPageState, votingPageStateReset, votingAllowed, yourPresence, market, isAssigned } = props;
  const workItemClasses = workListStyles();
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const classes = useVoteStyles();
  const intl = useIntl();
  const investibleMessages = findMessagesForInvestibleId(investibleId, messagesState) || [];
  const voteMessages = investibleMessages.filter((message) => message.type_object_id.startsWith('UNREAD_VOTE'));
  const {
    votingBeingEdited,
  } = votingPageState;

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
    <>
      {!_.isEmpty(voteMessages) && (
        <>
          <SpinningIconLabelButton onClick={() => {
            deleteOrDehilightMessages(voteMessages, messagesDispatch, workItemClasses.removed)
              .then(() => setOperationRunning(false))
              .finally(() => {
                setOperationRunning(false);
              });
          }} icon={SettingsBackupRestore} id="removeVoteNotificationsButton">
            {intl.formatMessage({ id: 'removeNotifications' })}
          </SpinningIconLabelButton>
          <div style={{paddingBottom: '1rem'}} />
        </>
      )}
      <ol className={classes.root}>
        {sortedVoters.map((voter, index) => {
          const { name, email, id: userId, quantity, maxBudget, maxBudgetUnit, updatedAt } = voter;
          const isYourVote = userId === yourPresence.id;
          const myMessage = findMessageOfTypeAndId(`${investibleId}_${userId}`, messagesState, 'VOTE');
          const reason = getVoterReason(userId);
          const voteId = `cv${userId}`;
          if (votingBeingEdited && isYourVote && investibleId) {
            return (
              <React.Fragment key={index}>
                <div className={index % 2 === 1 ? classes.cardPadded : undefined}/>
                <YourVoting
                  investibleId={investibleId}
                  marketPresences={marketPresences}
                  comments={investmentReasons}
                  userId={userId}
                  market={market}
                  showBudget
                  votingPageState={votingPageState}
                  updateVotingPageState={updateVotingPageState}
                  votingPageStateReset={votingPageStateReset}
                  isAssigned={isAssigned}
                />
              </React.Fragment>
            )
          }

          return (
            <div className={myMessage && classes.highlighted} key={index}>
              <Card
                key={userId}
                className={index % 2 === 1 ? classes.cardPadded : classes.card}
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
                    <EditOutlinedIcon style={{maxHeight: '1.25rem', cursor: 'pointer'}}
                                      onClick={() => updateVotingPageState({votingBeingEdited: true})}/>
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
    </>
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
