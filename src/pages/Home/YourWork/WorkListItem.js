import React, { useState } from 'react'
import cx from "clsx";
import styled from "styled-components";
import { Box, IconButton, makeStyles, useMediaQuery, useTheme } from '@material-ui/core'
import Checkbox from "@material-ui/icons/CheckBox";
import CheckBoxOutlineBlank from "@material-ui/icons/CheckBoxOutlineBlank";
import { useSizedIconButtonStyles } from "@mui-treasury/styles/iconButton/sized";
import { useRowGutterStyles } from "@mui-treasury/styles/gutter/row";
import PropTypes from 'prop-types'
import { navigate, preventDefaultAndProp } from '../../../utils/marketIdPathFunctions'
import GravatarGroup from '../../../components/Avatars/GravatarGroup'
import { useHistory } from 'react-router'
import RaisedCard from '../../../components/Cards/RaisedCard'
import { pushMessage } from '../../../utils/MessageBusUtils'
import {
  DEHIGHLIGHT_EVENT, DELETE_EVENT,
  MODIFY_NOTIFICATIONS_CHANNEL
} from '../../../contexts/NotificationsContext/notificationsContextMessages';
import { ExpandLess } from '@material-ui/icons'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import { usesExpansion } from './InboxExpansionPanel'
import NotificationDeletion from './NotificationDeletion'
import { expandOrContract } from './InboxContext'
import {
  dehighlightMessages,
  removeMessages
} from '../../../contexts/NotificationsContext/notificationsContextReducer';
import { scrollToElement } from '../../../contexts/ScrollContext';
import { CLOSE_PANEL_CHANNEL } from './InboxFull';

const Item = styled("div")`
  margin-bottom: 10px;
  min-width: 40vw;
`

const Div = styled("div")`
  height: 40px;
  display: flex;
  align-items: center;
  box-shadow: inset 0 -1px 0 0 rgba(100, 121, 143, 0.122);
  &.MailListItem-read {
    background-color: rgba(242,245,245,0.5);
  }
  &:hover {
    box-shadow: inset 1px 0 0 #dadce0, inset -1px 0 0 #dadce0,
      0 1px 2px 0 rgba(60, 64, 67, 0.3), 0 1px 3px 1px rgba(60, 64, 67, 0.15);
    z-index: 1;
  }
`;

const StyledIconButton = styled(IconButton)`
  color: rgba(0, 0, 0, 0.2);
  &:hover {
    color: rgba(0, 0, 0, 0.87);
  }
  &.MailListItem-checked {
    color: rgba(0, 0, 0, 0.87);
  }
`;

const Text = styled("div")`
  -webkit-font-smoothing: antialiased;
  font-size: 18px;
  color: #5f6368;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-grow: 1;
  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

const Title = styled(Text)`
  flex-basis: 180px;
  min-width: 13vw;
  flex-shrink: 0;
  flex-grow: 0;
  & > *:not(:first-child) {
    font-size: 12px;
    margin-left: 4px;
  };
  @media (max-width: 768px) {
    flex-basis: 100px;
  }
  @media (max-width: 1000px) {
    margin-left: 8px;
  }
`;

const TitleB = styled(Title)`
  color: rgba(0, 0, 0, 0.87);
  font-weight: bold;
`;

const DateLabel = styled(Text)`
  font-size: 14px;
  min-width: 10vw;
  flex-basis: 100px;
  flex-shrink: 0;
  padding-right: 2rem;
  text-align: right;
`;

const DateLabelB = styled(DateLabel)`
  color: rgba(0, 0, 0, 0.87);
  font-weight: bold;
`;

export const workListStyles = makeStyles(() => {
  return {
    gravatarStyle: {
      paddingRight: '1rem',
    },
    removed: {
      transform: 'translateX(100vw)',
      transitionDuration: '2s'
    }
  };
});

export function modifyNotifications (event, typeObjectId, messagesDispatch) {
  if (messagesDispatch) {
    if (DELETE_EVENT === event) {
      messagesDispatch(removeMessages([typeObjectId]));
    } else {
      pushMessage(CLOSE_PANEL_CHANNEL, { id: typeObjectId });
      messagesDispatch(dehighlightMessages([typeObjectId]));
    }
  } else {
    pushMessage(MODIFY_NOTIFICATIONS_CHANNEL, { event, message: typeObjectId });
  }
}

export function removeWorkListItem(message, removeClass, messagesDispatch) {
  const { type_object_id: typeObjectId } = message;
  const event = typeObjectId.startsWith('UNREAD') ? DELETE_EVENT : DEHIGHLIGHT_EVENT;
  const item = document.getElementById(`workListItem${typeObjectId}`);
  if (item) {
    const itemExpansion = document.getElementById(`workListItemExpansion${typeObjectId}`);
    if (itemExpansion) {
      // Close expansion first, or it takes up too much area to transition nicely
      itemExpansion.style.display = "none";
    }
    item.addEventListener("transitionend",() => {
      item.style.display = "none";
      modifyNotifications(event, typeObjectId, messagesDispatch);
    });
    item.classList.add(removeClass);
  }
  // If event listener fails make sure to remove after 2s no matter what
  setTimeout(function () {
    modifyNotifications(event, typeObjectId, messagesDispatch);
    if (item) {
      item.style.display = "none";
    }
  }, 2000);
}

function WorkListItem(props) {
  const {
    read,
    icon = (<div />),
    investible = '',
    market= '',
    comment = '',
    moreDescription = '',
    title = (<div />),
    people,
    message,
    date,
    checked = false,
    determinateDispatch,
    inboxDispatch,
    id,
    expansionPanel,
    expansionOpen,
    isDeletable = false,
    useSelect
  } = props;
  const history = useHistory();
  const classes = workListStyles();
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const actionStyles = useSizedIconButtonStyles({ childSize: 22, padding: 10 });
  const gutterStyles = useRowGutterStyles({ size: -10, before: -8 });
  const [isHovered, setIsHovered] = useState(false);
  const { link } = message;
  let fullText =  investible || comment || market;
  if (!moreDescription && investible && comment) {
    fullText += ' - ' + comment;
  }
  const isUsingExpansion = usesExpansion(props);
  const showExpansion = isUsingExpansion && isHovered;
  const expansionPanelVisible = isUsingExpansion && expansionOpen;
  return (
    <Item key={`workListItem${id}`} id={`workListItem${id}`} style={{minWidth: useSelect ? undefined : '80vw'}}>
      <RaisedCard elevation={3} rowStyle key={`raised${id}`}>
        <div style={{ width: '100%', cursor: 'pointer' }} id={`link${id}`} key={`link${id}`} onClick={
          (event) => {
            preventDefaultAndProp(event);
            if (!isUsingExpansion && !read) {
              let event = DEHIGHLIGHT_EVENT;
              if (message.type_object_id.startsWith('UNREAD')) {
                event = DELETE_EVENT;
              }
              pushMessage(MODIFY_NOTIFICATIONS_CHANNEL, { event, message: id });
            }
            if (isUsingExpansion) {
              inboxDispatch(expandOrContract(id));
              if (!expansionPanelVisible) {
                const item = document.getElementById(`workListItem${id}`);
                if (item) {
                  scrollToElement(item);
                }
              }
            } else {
              // Do not remember what row on if not using expansion
              return navigate(history, link);
            }
          }
        } onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
          <Div key={`actions${id}`}>
            <Box flexShrink={0} className={gutterStyles.parent} key={`box${id}`}>
              {!mobileLayout && (
                <StyledIconButton
                  className={cx(checked && "MailListItem-checked")}
                  style={{marginLeft: '0.15rem', visibility: useSelect ? 'visible' : 'hidden'}}
                  classes={actionStyles}
                  onClick={(event) => {
                    preventDefaultAndProp(event);
                    // We need to record when you unset when check all is on or set when check all is off
                    determinateDispatch({id});
                  }}
                >
                  {checked ? <Checkbox color="secondary" /> : <CheckBoxOutlineBlank />}
                </StyledIconButton>
              )}
              {!mobileLayout && (
                <StyledIconButton
                  disabled
                  classes={actionStyles}
                >
                  { icon }
                </StyledIconButton>
              )}
            </Box>
            {read ? (<Title>{title}</Title>) : (<TitleB>{title}</TitleB>)}
            {mobileLayout || !people ? React.Fragment : <GravatarGroup users={people} className={classes.gravatarStyle}/> }
            {moreDescription && (
              <Text style={{ maxWidth: '55vw' }}>{fullText} - {moreDescription}</Text>
            )}
            {!moreDescription && (
              <Text style={{ maxWidth: '55vw' }}>{fullText}</Text>
            )}
            {showExpansion || mobileLayout || !date ? React.Fragment : (read ? (<DateLabel>{date}</DateLabel>) :
              (<DateLabelB>{date}</DateLabelB>))}
            {showExpansion && (
              <DateLabel>
                {isDeletable && (
                  <NotificationDeletion message={message} fromRow />
                )}
                {expansionOpen ? <ExpandLess style={{color: 'black', marginRight: '1rem'}} />
                  : <ExpandMoreIcon style={{color: 'black', marginRight: '1rem'}} />}
              </DateLabel>
            )}
          </Div>
        </div>
        <div id={`workListItemExpansion${id}`} style={{visibility: expansionPanelVisible ? 'visible' : 'hidden',
          height: expansionPanelVisible ? undefined : 0}}>
          {expansionPanel || <React.Fragment />}
        </div>
      </RaisedCard>
    </Item>
  );
}

WorkListItem.propTypes = {
  id: PropTypes.string.isRequired,
  read: PropTypes.bool,
  icon: PropTypes.node,
  market: PropTypes.node,
  investible: PropTypes.node,
  comment: PropTypes.node,
  title: PropTypes.node,
  date: PropTypes.string
};

export default WorkListItem;