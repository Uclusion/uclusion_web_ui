import { IconButton, makeStyles, Tooltip, Typography } from '@material-ui/core'
import React from 'react'
import Box from '@material-ui/core/Box'
import { formMarketManageLink, navigate } from '../../utils/marketIdPathFunctions'
import PersonAddIcon from '@material-ui/icons/PersonAdd'

const useStyles = makeStyles( () => ({
    archived: {
      color: '#ffffc4',
      fontSize: 14,
    },
    normal: {
      fontSize: 14,
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
        return (
          <Typography key={presenceId} component="li" className={myClassName}>
            {name}
          </Typography>
        );
      })}
      {!authorDisplay && marketPresences.length === 1 && (
        <Typography component="div">
          <Box color="#E85757" m={1}>
            {intl.formatMessage({ id: 'draft' })}
          </Box>
        </Typography>
      )}
      {!authorDisplay && (
        <Tooltip
          title={intl.formatMessage({ id: 'dialogAddParticipantsLabel' })}
        >
          <IconButton
            onClick={() => navigate(history, `${formMarketManageLink(marketId)}#participation=true`)}
          >
            <PersonAddIcon />
          </IconButton>
        </Tooltip>
      )}
    </ul>
  );
}

export default Collaborators;