import React from 'react'
import PropTypes from 'prop-types'
import { Link, Card } from '@material-ui/core'
import { navigate } from '../../utils/marketIdPathFunctions'
import { useHistory } from 'react-router'
import Typography from '@material-ui/core/Typography';
import { DECISION_TYPE, PLANNING_TYPE } from '../../constants/markets'

function getNameLocation(message) {
  const { link_type: linkType, market_type: marketType } = message;
  switch (linkType) {
    case 'INLINE_STORY_COMMENT':
    case 'INLINE_STORY_INITIATIVE':
    case 'INLINE_STORY_INVESTIBLE':
    case 'INLINE_STORY_VOTE':
      return 'In story';
    case 'INLINE_WORKSPACE_INITIATIVE':
    case 'INLINE_WORKSPACE_INVESTIBLE':
    case 'INLINE_WORKSPACE_VOTE':
    case 'INLINE_WORKSPACE_COMMENT':
    case 'MARKET_COMMENT':
      return 'In workspace';
    case 'INITIATIVE_VOTE':
    case 'INITIATIVE_COMMENT':
      return 'In initiative';
    case 'INVESTIBLE_VOTE':
    case 'INVESTIBLE':
    case 'INVESTIBLE_COMMENT':
      return marketType === PLANNING_TYPE ? 'In story' : marketType === DECISION_TYPE ? 'In option' :
        'In initiative';
    case 'MARKET':
      return marketType === PLANNING_TYPE ? 'In workspace' : marketType === DECISION_TYPE
        ? 'In dialog' : 'In initiative';
    default:
      return 'In unknown';
  }
}

function NotificationMessageDisplay(props) {
  const {
    message
  } = props;
  const { link, level, name, text,
    investible_name: investibleName,
    market_name: marketName
  } = message;
  const history = useHistory();
  const color = level === 'RED' ? '#E85757' : level === 'YELLOW' ? '#e6e969' : '#2D9CDB';
  const containerName = investibleName || marketName;
  return (
    <Link href={link} style={{ width: '100%' }}  onClick={
      (event) => {
        event.stopPropagation();
        event.preventDefault();
        navigate(history, link);
      }
    }>
      <Card style={{ border: '1px solid'}}>
        <Typography style={{fontWeight: 'bold', paddingTop: '1rem', paddingRight: '1rem', paddingLeft: '1rem'}}>
          {getNameLocation(message)}</Typography>
        {name !== containerName && (
          <>
            <Typography style={{paddingRight: '1rem', paddingLeft: '1rem', fontStyle: 'italic'}}>
              {containerName}</Typography>
            <Typography style={{paddingRight: '1rem', paddingLeft: '1rem'}}>
              {name}</Typography>
          </>
        )}
        {name === containerName && (
          <Typography style={{paddingRight: '1rem', paddingLeft: '1rem', fontStyle: 'italic'}}>
            {name}</Typography>
        )}
        <Typography style={{backgroundColor: color, padding: '1rem'}}>{text}</Typography>
      </Card>
    </Link>
  );

}

NotificationMessageDisplay.propTypes = {
  message: PropTypes.object.isRequired,
};

export default NotificationMessageDisplay;

