import { makeStyles, Tooltip, Typography } from '@material-ui/core'
import React from 'react'
import { FormattedMessage } from 'react-intl'
import GravatarAndName from '../../components/Avatars/GravatarAndName';
import { PLACEHOLDER } from '../../constants/global'

const useStyles = makeStyles( () => ({
    archived: {
      color: '#ffC000',
      fontSize: 12,
    },
    normal: {
      fontSize: 14,
    },
    assignmentFlexRow: {
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      paddingTop: '0.5rem',
      paddingRight: '0.5rem'
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
  const { marketPresences: unfilteredPresences, authorId, authorDisplay } = props;
  const classes = useStyles();
  const marketPresences = unfilteredPresences.filter((presence) => !presence.market_banned);
  const author = marketPresences.find((presence) => presence.id === authorId);

  return (
    <span className={classes.assignmentFlexRow}>
      <ul>
        {authorDisplay && author && (
          <GravatarAndName key={author.id} name={author.name} email={author.email} typographyComponent="li"/>
        )}
        {!authorDisplay && marketPresences.map((presence, index) => {
          const { id: presenceId, following, email, placeholder_type: placeholderType } = presence;
          const showAsArchived = !following || placeholderType === PLACEHOLDER;
          const myClassName = showAsArchived ? classes.archived : classes.normal;
          const name = (presence.name || '').replace('@', ' ');
          if (presenceId === authorId) {
            return <React.Fragment key={presenceId}/>;
          }
          if (showAsArchived) {
            return (
              <div key={index}>
                {index > 0 && (<div style={{ paddingTop: '0.5rem' }}/>)}
                <Tooltip key={`tip${presenceId}`}
                         title={<FormattedMessage id="collaboratorNotFollowing"/>}>
                  <Typography key={presenceId} component="li" className={myClassName}>
                    {name}
                  </Typography>
                </Tooltip>
              </div>
            );
          }
          return (
            <div key={index}>
              {index > 0 && (<div style={{ paddingTop: '0.5rem' }}/>)}
              <GravatarAndName
                key={email}
                email={email}
                name={name}
                typographyClassName={myClassName}
                typographyComponent="li"
              />
            </div>
          );
        })}
        </ul>
    </span>
  );
}

export default Collaborators;