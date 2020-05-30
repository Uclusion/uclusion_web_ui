import { IconButton, makeStyles, Tooltip, Typography } from '@material-ui/core'
import React from 'react'
import { formMarketManageLink, navigate } from '../../utils/marketIdPathFunctions'
import PersonAddIcon from '@material-ui/icons/PersonAdd'
import { FormattedMessage } from 'react-intl'
import { ACTION_BUTTON_COLOR } from '../../components/Buttons/ButtonConstants'

const useStyles = makeStyles( () => ({
    archived: {
      color: '#ffffc4',
      fontSize: 14,
    },
    normal: {
      fontSize: 14,
    },
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
  const marketPresences = unfilteredPresences.filter((presence) => !presence.market_banned);
  marketPresences.sort(function(a, b) {
    if (a.id === authorId) return -1;
    return 0;
  });
  return (
    <span className={classes.assignmentFlexRow}>
      <ul>
        {authorDisplay && (
          <Typography key={marketPresences[0].id} component="li">
            {marketPresences[0].name}
          </Typography>
        )}
        {!authorDisplay && marketPresences.map(presence => {
          const { id: presenceId, name, following } = presence;
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
            <Typography key={presenceId} component="li" className={myClassName}>
              {name}
            </Typography>
          );
        })}
        </ul>
        <div className={classes.flex1}>
          {!authorDisplay && (
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
          )}
        </div>
    </span>
  );
}

export default Collaborators;