import { IconButton, makeStyles, Tooltip, Typography } from '@material-ui/core'
import React from 'react'
import { formMarketManageLink, navigate } from '../../utils/marketIdPathFunctions'
import PersonAddIcon from '@material-ui/icons/PersonAdd'
import { FormattedMessage } from 'react-intl'
import { ACTION_BUTTON_COLOR } from '../../components/Buttons/ButtonConstants'
import Gravatar from '../../components/Avatars/Gravatar';

const useStyles = makeStyles( () => ({
    archived: {
      color: '#ffC000',
      fontSize: 14,
    },
    normal: {
      fontSize: 14,
    },
    containerRed: {
      boxShadow: "10px 5px 5px red"
    },
    noStyle: {},
    assignmentFlexRow: {
      width: '100%',
      display: 'flex',
      alignItems: 'center'
    },
    flex1: {
      flex: 1
    },
    draftContainer: {
      flex: 1,
      textAlign: 'right',
      fontWeight: "bold"
    }
  }),
  { name: "Collaborators" }
);
export function Collaborators(props) {
  const { marketPresences: unfilteredPresences, authorId, intl, authorDisplay, history, marketId } = props;
  const classes = useStyles();
  const marketPresences = unfilteredPresences.filter((presence) => (!presence.market_banned && !presence.market_guest));
  const author = marketPresences.find((presence) => presence.id === authorId);
  const myPresence = marketPresences.find((presence) => presence.current_user);
  return (
    <span className={classes.assignmentFlexRow}>
      <ul>
        {authorDisplay && author && (
          <Typography key={author.id} component="li">
            {author.name}
          </Typography>
        )}
        {!authorDisplay && marketPresences.map(presence => {
          const { id: presenceId, name, following, email } = presence;
          const myClassName = following ? classes.normal : classes.archived;
          if (presenceId === authorId ) {
            return <React.Fragment key={presenceId}/>;
          }
          if (!following) {
            return (
              <Tooltip key={`tip${presenceId}`}
                      title={<FormattedMessage id="collaboratorNotFollowing" />}>
                <Typography key={presenceId} component="li" className={myClassName}>
                  {name}
                </Typography>
              </Tooltip>
            );
          }
          return (
            <div style={{display: 'flex', alignItems: 'center'}}>
              <Gravatar name={name} email={email}/>
              <Typography key={presenceId} component="li" className={myClassName}>
              {name}
            </Typography>
            </div>
          );
        })}
        </ul>
        <div className={classes.flex1}>
          {!authorDisplay && myPresence && myPresence.following && (
            <div className={marketPresences.length < 2 ? classes.containerRed : classes.noStyle}>
              <Tooltip
                title={intl.formatMessage({ id: 'dialogAddParticipantsLabel' })}
              >
                <IconButton
                  id="adminManageCollaborators"
                  onClick={() => navigate(history, `${formMarketManageLink(marketId)}#participation=true`)}
                >
                  <PersonAddIcon htmlColor={ACTION_BUTTON_COLOR} />
                </IconButton>
              </Tooltip>
            </div>
          )}
        </div>
    </span>
  );
}

export default Collaborators;