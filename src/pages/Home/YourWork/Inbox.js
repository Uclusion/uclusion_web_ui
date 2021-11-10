import WorkListItem from './WorkListItem'
import { Typography } from '@material-ui/core'
import React, { useContext } from 'react'
import styled from "styled-components";
import { useIntl } from 'react-intl'
import { Link } from '@material-ui/core'
import { MoveToInbox } from '@material-ui/icons'
import WarningIcon from '@material-ui/icons/Warning'
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext'
import HourglassFullIcon from '@material-ui/icons/HourglassFull'
import NotesIcon from '@material-ui/icons/Notes'
import { navigate, preventDefaultAndProp } from '../../../utils/marketIdPathFunctions'
import { dehighlightMessage } from '../../../contexts/NotificationsContext/notificationsContextReducer'
import { getMarketClient } from '../../../api/uclusionClient'
import { useHistory } from 'react-router'

const SectionTitle = styled("div")`
  width: auto;
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
`;

function getPriorityIcon(level) {
  switch (level) {
    case 'RED':
      return <WarningIcon style={{fontSize: 24, color: '#E85757',}}/>;
    case 'YELLOW':
      return <HourglassFullIcon style={{fontSize: 24, color: '#e6e969',}}/>;
    case 'BLUE':
      return <NotesIcon style={{fontSize: 24, color: '#2D9CDB',}}/>;
    default:
      return undefined;
  }
}

function Inbox(props) {
  const { isSectionOpen } = props;
  const intl = useIntl();
  const history = useHistory();
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const { messages: messagesUnsafe } = messagesState;
  const messages = messagesUnsafe || [];

  const rows = messages.map((message, i) => {
    const { level, market_name: market, investible_name: investible, updated_at: updatedAt,
      is_highlighted: isHighlighted, name, text, link, market_id: marketId, type_object_id: typeObjectId} = message;
    const item = {
      title: name,
      description: text,
      priorityIcon: getPriorityIcon(level),
      market, investible,
      read: isHighlighted,
      date: intl.formatDate(updatedAt)
    }
    return <Link href={link} style={{ width: '100%' }} onClick={
      (event) => {
        preventDefaultAndProp(event);
        if (isHighlighted && marketId) {
          messagesDispatch(dehighlightMessage(message));
          // TODO need API to just dehighlight
          return getMarketClient(marketId).then((client) => client.users.removeNotifications([typeObjectId]))
            .then(() => navigate(history, link));
        }
        navigate(history, link);
      }
    }><WorkListItem key={i} {...item} /></Link>
  })

  return (
    <div id="inbox" style={{ display: isSectionOpen('inbox') ? 'block' : 'none', paddingBottom: '3rem' }}>
      <SectionTitle>
        {<MoveToInbox htmlColor="#333333"/>}
        <Typography style={{marginLeft: '1rem'}} variant="h6">
          {intl.formatMessage({ id: 'inbox' })}
        </Typography>
      </SectionTitle>
      { rows }
    </div>
  );
}

export default Inbox;