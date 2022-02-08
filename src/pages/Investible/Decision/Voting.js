import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'
import { FormattedMessage, useIntl } from 'react-intl'
import { Card, CardActions, CardContent, Typography, useMediaQuery, useTheme } from '@material-ui/core'
import ReadOnlyQuillEditor from '../../../components/TextEditors/ReadOnlyQuillEditor'
import { makeStyles } from '@material-ui/styles'
import CardType from '../../../components/CardType'
import ProgressBar from '../../../components/Expiration/ProgressBarExpiration'
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext'
import { findMessageOfTypeAndId } from '../../../utils/messageUtils'
import { getInvestibleVoters } from '../../../utils/votingUtils';
import { Edit } from '@material-ui/icons'
import YourVoting from '../Voting/YourVoting'
import { invalidEditEvent } from '../../../utils/windowUtils'
import { useHistory } from 'react-router'
import clsx from 'clsx'
import GravatarAndName from '../../../components/Avatars/GravatarAndName'
import TooltipIconButton from '../../../components/Buttons/TooltipIconButton'

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
        position: "relative",
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
      editable: {
        "& > *": {
          cursor: "url('/images/edit_cursor.svg') 0 24, pointer"
        }
      },
      notEditable: {},
      smallGravatar: {
        width: '30px',
        height: '30px',
      },
      createdBy: {
        fontSize: '15px',
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
  const { marketPresences, investibleId, investmentReasons, showExpiration, expirationMinutes, votingPageState,
    updateVotingPageState, votingPageStateReset, votingAllowed, yourPresence, market, isAssigned, isInbox } = props;
  const history = useHistory();
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('xs'));
  const [messagesState] = useContext(NotificationsContext);
  const classes = useVoteStyles();
  const intl = useIntl();
  const {
    votingBeingEdited
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

          function setBeingEdited(value, event) {
            if (!invalidEditEvent(event, history)) {
              updateVotingPageState({ votingBeingEdited: value });
            }
          }
          const isEditable = isYourVote && votingAllowed;
          const hasContent = maxBudget > 0 || reason;
          return (
            <div className={myMessage && classes.highlighted} key={index}>
              <Card
                key={userId}
                className={clsx(index % 2 === 1 ? classes.cardPadded : classes.card,
                  isEditable ? classes.editable : classes.notEditable)}
                component="li"
                id={voteId}
                elevation={3}
                style={{paddingBottom: hasContent ? undefined : '1rem'}}
                onClick={(event) => {
                  if (isEditable) {
                    setBeingEdited(true, event);
                  }
                }}
              >
                <CardType
                  className={classes.cardType}
                  type={`certainty${Math.abs(quantity)}`}
                  gravatar={<GravatarAndName email={email}
                                     name={name} typographyVariant="caption"
                                     typographyClassName={classes.createdBy}
                                     avatarClassName={classes.smallGravatar}
                            />}
                />
                {isEditable && mobileLayout && (
                  <CardActions className={classes.editVoteDisplay}>
                    <TooltipIconButton
                      onClick={() => updateVotingPageState({votingBeingEdited: true})}
                      icon={<Edit fontSize='small' />}
                      translationId="edit"
                    />
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
                {hasContent && (
                  <CardContent className={classes.cardContent}>
                    {maxBudget > 0 && (
                      <div style={{display: 'flex', alignItems: 'center', paddingBottom: '1rem'}}>
                        <Typography className={classes.voter} component="strong">
                          {!maxBudgetUnit && intl.formatMessage({id: 'maxBudgetValue'},
                            { x: maxBudget})}
                          {maxBudgetUnit && intl.formatMessage({id: 'maxBudgetValueWithUnits'},
                            { x: maxBudget, y: maxBudgetUnit})}
                        </Typography>
                      </div>
                    )}
                    {!_.isEmpty(reason) &&
                      <ReadOnlyQuillEditor value={reason.body} isEditable={isEditable}
                                           id={isInbox ? `inboxReason${reason.id}` : reason.id}
                                           setBeingEdited={(event) => setBeingEdited(true, event)}
                      />}
                  </CardContent>
                )}
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
