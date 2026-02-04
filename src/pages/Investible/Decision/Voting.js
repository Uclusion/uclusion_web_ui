import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { CardContent, Typography, useMediaQuery, useTheme } from '@material-ui/core';
import ReadOnlyQuillEditor from '../../../components/TextEditors/ReadOnlyQuillEditor';
import { makeStyles } from '@material-ui/styles';
import CardType from '../../../components/CardType';
import ExpiresDisplay from '../../../components/Expiration/ExpiresDisplay';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { findMessageByInvestmentUserId } from '../../../utils/messageUtils';
import { useInvestibleVoters } from '../../../utils/votingUtils';
import { Edit, ExpandLess } from '@material-ui/icons';
import { invalidEditEvent } from '../../../utils/windowUtils';
import { useHistory } from 'react-router';
import clsx from 'clsx';
import GravatarAndName from '../../../components/Avatars/GravatarAndName';
import TooltipIconButton from '../../../components/Buttons/TooltipIconButton';
import { formInboxItemLink, formWizardLink, navigate, preventDefaultAndProp } from '../../../utils/marketIdPathFunctions';
import { APPROVAL_WIZARD_TYPE } from '../../../constants/markets';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { removeInvestment } from '../../../api/marketInvestibles';
import { commonQuick } from '../../../components/AddNewWizards/Approval/ApprovalWizard';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { editorEmpty } from '../../../components/TextEditors/Utilities/CoreUtils';
import { isLargeDisplay, stripHTML } from '../../../utils/stringFunctions';
import NotificationDeletion from '../../Home/YourWork/NotificationDeletion';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import SpinningIconLabelButton from '../../../components/Buttons/SpinningIconLabelButton';
import { useIntl } from 'react-intl';
import { dehighlightMessage } from '../../../contexts/NotificationsContext/notificationsContextHelper';
import { DARK_TEXT_BACKGROUND_COLOR } from '../../../components/Buttons/ButtonConstants';
import { ThemeModeContext } from '../../../contexts/ThemeModeContext';

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
        '&:last-child': {
          paddingBottom: '18px'
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
        whiteSpace: 'nowrap',
        paddingRight: '0.5rem'
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
  const { marketPresences = [], investibleId, investmentReasons = [], showExpiration, expirationMinutes, yourPresence, market, showDeleted,
    isInbox, groupId, useCompression, showEmptyText, toggleCompression=() => {}} = props;
  const history = useHistory();
  const [themeMode] = React.useContext(ThemeModeContext);
  const isDark = themeMode === 'dark';
  const theme = useTheme();
  const intl = useIntl();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('xs'));
  const midLayout = useMediaQuery(theme.breakpoints.down('md'));
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const [, marketPresencesDispatch] = useContext(MarketPresencesContext);
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const [operationRunning, setOperationRunning] = useContext(OperationInProgressContext);
  const classes = useVoteStyles();
  const voters = useInvestibleVoters(marketPresences, investibleId, market.id, showDeleted);
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

  if (!yourPresence) {
    return React.Fragment;
  }

  if (_.isEmpty(sortedVoters)) {
    if (showEmptyText) {
      return (
        <Typography style={{marginTop: '1rem'}} variant="body1">
          No approvals.
        </Typography>
      );
    }
    return React.Fragment;
  }

  return (
    <div>
      {useCompression === false && (
        <SpinningIconLabelButton
          icon={ExpandLess}
          doSpin={false}
          onClick={(event) => {
            preventDefaultAndProp(event);
            toggleCompression();
          }}
          style={{marginTop: '1rem'}}
        >
          {intl.formatMessage({ id: 'commentCloseThreadLabel'})}
        </SpinningIconLabelButton>
      )}
        {sortedVoters.map((voter) => {
          const { name, email, id: userId, quantity, commentId, updatedAt } = voter;
          const isYourVote = userId === yourPresence.id;
          const myMessage = findMessageByInvestmentUserId(userId, investibleId, messagesState);
          const notificationFunc = !isInbox && myMessage?.type_object_id ? () => {
            dehighlightMessage(myMessage, messagesDispatch)
            navigate(history, formInboxItemLink(myMessage));
          } : undefined;
          const reason = investmentReasons.find((comment) => comment.id === commentId);
          const voteId = `cv${userId}`;

          function setBeingEdited(event) {
            if (!invalidEditEvent(event, history)) {
              navigate(history, formWizardLink(APPROVAL_WIZARD_TYPE, market.id, investibleId, groupId));
            }
          }
          const myUseCompression = useCompression && isLargeDisplay(reason?.body);
          const isEditable = isYourVote && !myUseCompression;
          const hasContent = !editorEmpty(reason?.body);
          return (
            <div style={{width: 'fit-content', cursor: myUseCompression ? 'pointer' : undefined,
                   maxWidth: myUseCompression ? '98%' : undefined}} key={userId}>
              <div
                key={userId}
                className={clsx(classes.cardPadded, isEditable ? classes.editable : classes.notEditable)}
                id={voteId}
                style={{paddingBottom: hasContent && !myUseCompression ? undefined : '1rem'}}
                onClick={(event) => {
                  if (isEditable) {
                    setBeingEdited(true, event);
                  } else {
                    toggleCompression();
                  }
                }}
              >
                <div style={{display: 'flex'}}>
                  <CardType compact={!midLayout} compressed={!hasContent || myUseCompression}
                    className={classes.cardType}
                    type={`certainty${Math.abs(quantity)}`}
                    notificationFunc={notificationFunc}
                    notificationIsHighlighted={myMessage?.is_highlighted}
                    gravatar={<GravatarAndName email={email}
                                       name={name} typographyVariant="caption"
                                       typographyClassName={classes.createdBy}
                                       avatarClassName={classes.smallGravatar}
                              />}
                  />
                  {!myUseCompression && (
                    <div style={{ flexGrow: 1 }}/>
                  )}
                  {isEditable && mobileLayout && (
                    <div className={classes.editVoteDisplay}>
                      <TooltipIconButton
                        onClick={() => navigate(history, formWizardLink(APPROVAL_WIZARD_TYPE, market.id,
                          investibleId, groupId))}
                        icon={<Edit fontSize='small' />}
                        translationId="edit"
                      />
                    </div>
                  )}
                  {myUseCompression && (
                    <div style={{marginLeft: '1rem', marginRight: '1rem', paddingTop: '5px', textOverflow: 'ellipsis',
                      overflow: 'hidden', whiteSpace: 'nowrap'}}>
                      {hasContent && stripHTML(reason.body)}
                    </div>
                  )}
                  {myUseCompression && (
                    <div style={{ flexGrow: 1 }}/>
                  )}
                  {showExpiration && !mobileLayout && (
                    <div style={{marginRight: '1rem', paddingTop: '5px', marginLeft: notificationFunc ? '1rem' : undefined}}>
                      <ExpiresDisplay
                        createdAt={new Date(updatedAt)}
                        expirationMinutes={expirationMinutes}
                      />
                    </div>
                  )}
                  {myUseCompression && (
                    <div style={{ marginRight: '1rem' }}>
                      <TooltipIconButton
                        icon={<ExpandMoreIcon />}
                        size="small"
                        noPadding
                        translationId="rowExpand"
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
                {hasContent && !myUseCompression && (
                  <CardContent className={classes.cardContent}>
                    <ReadOnlyQuillEditor value={reason.body} isEditable={isEditable} isWhiteText={isDark}
                                         id={isInbox ? `inboxReason${reason.id}` : reason.id}
                                         setBeingEdited={setBeingEdited}
                    />
                  </CardContent>
                )}
              </div>
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

export default Voting;
