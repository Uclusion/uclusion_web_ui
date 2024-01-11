import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { Card, CardContent, useMediaQuery, useTheme } from '@material-ui/core';
import ReadOnlyQuillEditor from '../../../components/TextEditors/ReadOnlyQuillEditor';
import { makeStyles } from '@material-ui/styles';
import CardType from '../../../components/CardType';
import ExpiresDisplay from '../../../components/Expiration/ExpiresDisplay';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { findMessageByInvestmentUserId } from '../../../utils/messageUtils';
import { useInvestibleVoters } from '../../../utils/votingUtils';
import { Edit } from '@material-ui/icons';
import { invalidEditEvent } from '../../../utils/windowUtils';
import { useHistory } from 'react-router';
import clsx from 'clsx';
import GravatarAndName from '../../../components/Avatars/GravatarAndName';
import TooltipIconButton from '../../../components/Buttons/TooltipIconButton';
import { formWizardLink, navigate, preventDefaultAndProp } from '../../../utils/marketIdPathFunctions';
import { APPROVAL_WIZARD_TYPE } from '../../../constants/markets';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { removeInvestment } from '../../../api/marketInvestibles';
import { commonQuick } from '../../../components/AddNewWizards/Approval/ApprovalWizard';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { useCommentStyles } from '../../../components/Comments/Comment';
import { editorEmpty } from '../../../components/TextEditors/Utilities/CoreUtils';
import { stripHTML } from '../../../utils/stringFunctions';
import NotificationDeletion from '../../Home/YourWork/NotificationDeletion';

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
    yourPresence, market, isInbox, groupId, useCompression=false, toggleCompression=() => {}} = props;
  const history = useHistory();
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('xs'));
  const midLayout = useMediaQuery(theme.breakpoints.down('md'));
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const [, marketPresencesDispatch] = useContext(MarketPresencesContext);
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const [operationRunning, setOperationRunning] = useContext(OperationInProgressContext);
  const classes = useVoteStyles();
  const commentClasses = useCommentStyles();
  const voters = useInvestibleVoters(marketPresences, investibleId, market.id);
  const sortedVoters = _.sortBy(voters, 'quantity', 'updatedAt');

  function remove(event) {
    preventDefaultAndProp(event);
    setOperationRunning(true);
    return removeInvestment(market.id, investibleId).then(result => {
      commonQuick(result, commentsDispatch, market.id, commentsState, marketPresencesDispatch, messagesState,
        messagesDispatch, setOperationRunning);
      setOperationRunning(false);
    });
  }

  if (!yourPresence || _.isEmpty(sortedVoters)) {
    return React.Fragment;
  }

  return (
    <div>
        {sortedVoters.map((voter, index) => {
          const { name, email, id: userId, quantity, commentId, updatedAt } = voter;
          const isYourVote = userId === yourPresence.id;
          const myMessage = findMessageByInvestmentUserId(userId, investibleId, messagesState);
          const reason = investmentReasons.find((comment) => comment.id === commentId);
          const voteId = `cv${userId}`;

          function setBeingEdited(value, event) {
            if (!invalidEditEvent(event, history)) {
              navigate(history, formWizardLink(APPROVAL_WIZARD_TYPE, market.id, investibleId, groupId));
            }
          }
          const isEditable = isYourVote && votingAllowed;
          const hasContent = !editorEmpty(reason?.body);
          return (
            <div className={myMessage && classes.highlighted}
                 style={{width: hasContent || midLayout ? undefined : '50%'}} key={index}>
              <Card
                key={userId}
                className={clsx(index % 2 === 1 ? classes.cardPadded : classes.card,
                  isEditable ? classes.editable : classes.notEditable)}
                id={voteId}
                elevation={3}
                style={{paddingBottom: hasContent ? undefined : '1rem'}}
                onClick={(event) => {
                  if (isEditable) {
                    setBeingEdited(true, event);
                  }
                }}
              >
                <div style={{display: 'flex'}}>
                  <CardType compact={!midLayout} compressed={!hasContent}
                    className={classes.cardType}
                    type={`certainty${Math.abs(quantity)}`}
                    gravatar={<GravatarAndName email={email}
                                       name={name} typographyVariant="caption"
                                       typographyClassName={classes.createdBy}
                                       avatarClassName={classes.smallGravatar}
                              />}
                  />
                  <div style={{flexGrow: 1}}/>
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
                    <div style={{marginRight: '2rem', paddingTop: '5px'}}>
                      <ExpiresDisplay
                        createdAt={new Date(updatedAt)}
                        expirationMinutes={expirationMinutes}
                      />
                    </div>
                  )}
                  {isEditable && (
                    <div style={{marginRight: '2rem'}}>
                      <TooltipIconButton
                        disabled={operationRunning !== false}
                        onClick={remove}
                        icon={<NotificationDeletion isRed />}
                        size={mobileLayout ? 'small' : undefined}
                        translationId="commentRemoveLabel"
                      />
                    </div>
                  )}
                </div>
                {hasContent && (
                  <CardContent className={classes.cardContent} onClick={toggleCompression}>
                    {!useCompression &&
                      <ReadOnlyQuillEditor value={reason.body} isEditable={isEditable}
                                           id={isInbox ? `inboxReason${reason.id}` : reason.id}
                                           setBeingEdited={(event) => setBeingEdited(true, event)}
                      />}
                    {useCompression && (
                      <div className={commentClasses.compressedComment}>
                        {stripHTML(reason.body)}</div>
                    )}
                  </CardContent>
                )}
              </Card>
            </div>
          );
        })}
      </div>
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
