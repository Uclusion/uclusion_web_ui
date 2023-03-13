import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'
import { FormattedMessage, useIntl } from 'react-intl'
import { Box, Card, CardContent, Typography, useMediaQuery, useTheme } from '@material-ui/core';
import ReadOnlyQuillEditor from '../../../components/TextEditors/ReadOnlyQuillEditor'
import { makeStyles } from '@material-ui/styles'
import CardType from '../../../components/CardType'
import ExpiresDisplay from '../../../components/Expiration/ExpiresDisplay'
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext'
import { findMessageOfTypeAndId } from '../../../utils/messageUtils'
import { getInvestibleVoters } from '../../../utils/votingUtils';
import { Delete, Edit } from '@material-ui/icons';
import { invalidEditEvent } from '../../../utils/windowUtils'
import { useHistory } from 'react-router'
import clsx from 'clsx'
import GravatarAndName from '../../../components/Avatars/GravatarAndName'
import TooltipIconButton from '../../../components/Buttons/TooltipIconButton'
import { formWizardLink, navigate, preventDefaultAndProp } from '../../../utils/marketIdPathFunctions';
import { APPROVAL_WIZARD_TYPE } from '../../../constants/markets';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { removeInvestment } from '../../../api/marketInvestibles';
import { commonQuick } from '../../../components/AddNewWizards/Approval/ApprovalWizard';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { workListStyles } from '../../Home/YourWork/WorkListItem';

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
        right: '0rem',
        top: 0
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
  const { marketPresences, investibleId, investmentReasons, showExpiration, expirationMinutes, votingAllowed,
    yourPresence, market, isInbox, groupId} = props;
  const history = useHistory();
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('xs'));
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const [, marketPresencesDispatch] = useContext(MarketPresencesContext);
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const [operationRunning, setOperationRunning] = useContext(OperationInProgressContext);
  const workItemClasses = workListStyles();
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

  function remove(event) {
    preventDefaultAndProp(event);
    setOperationRunning(true);
    return removeInvestment(market.id, investibleId).then(result => {
      commonQuick(result, commentsDispatch, market.id, commentsState, marketPresencesDispatch, messagesState,
        workItemClasses, messagesDispatch, () => {}, setOperationRunning);
      setOperationRunning(false);
    });
  }

  return (
    <ol className={classes.root}>
        {sortedVoters.map((voter, index) => {
          const { name, email, id: userId, quantity, maxBudget, maxBudgetUnit, updatedAt } = voter;
          const isYourVote = userId === yourPresence.id;
          const myMessage = findMessageOfTypeAndId(`${investibleId}_${userId}`, messagesState, 'VOTE');
          const reason = getVoterReason(userId);
          const voteId = `cv${userId}`;

          function setBeingEdited(value, event) {
            if (!invalidEditEvent(event, history)) {
              navigate(history, formWizardLink(APPROVAL_WIZARD_TYPE, market.id, investibleId, groupId));
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
                <Box display="flex">
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
                    <div className={classes.editVoteDisplay}>
                      <TooltipIconButton
                        onClick={() => navigate(history, formWizardLink(APPROVAL_WIZARD_TYPE, market.id, investibleId,
                          groupId))}
                        icon={<Edit fontSize='small' />}
                        translationId="edit"
                      />
                    </div>
                  )}
                  {showExpiration && !mobileLayout && (
                    <div style={{marginRight: '2rem'}}>
                      <ExpiresDisplay
                        createdAt={new Date(updatedAt)}
                        expirationMinutes={expirationMinutes}
                      />
                    </div>
                  )}
                  {isYourVote && (
                    <div style={{marginRight: '2rem'}}>
                      <TooltipIconButton
                        disabled={operationRunning !== false}
                        onClick={remove}
                        icon={<Delete fontSize={mobileLayout ? 'small' : undefined} />}
                        size={mobileLayout ? 'small' : undefined}
                        translationId="commentRemoveLabel"
                      />
                    </div>
                  )}
                </Box>
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
