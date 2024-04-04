import React, { useContext } from 'react';
import cx from 'clsx';
import styled from 'styled-components';
import { Box, IconButton, makeStyles, useMediaQuery, useTheme } from '@material-ui/core';
import Checkbox from '@material-ui/icons/CheckBox';
import CheckBoxOutlineBlank from '@material-ui/icons/CheckBoxOutlineBlank';
import { useSizedIconButtonStyles } from '@mui-treasury/styles/iconButton/sized';
import { useRowGutterStyles } from '@mui-treasury/styles/gutter/row';
import PropTypes from 'prop-types';
import { formInboxItemLink, navigate, preventDefaultAndProp } from '../../../utils/marketIdPathFunctions';
import GravatarGroup from '../../../components/Avatars/GravatarGroup';
import RaisedCard from '../../../components/Cards/RaisedCard';
import { pushMessage } from '../../../utils/MessageBusUtils';
import {
  DEHIGHLIGHT_EVENT,
  DELETE_EVENT,
  MODIFY_NOTIFICATIONS_CHANNEL
} from '../../../contexts/NotificationsContext/notificationsContextMessages';
import { ExpandLess } from '@material-ui/icons';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import NotificationDeletion from './NotificationDeletion';
import {
  dehighlightMessages, quickRemoveMessages,
  removeMessages
} from '../../../contexts/NotificationsContext/notificationsContextReducer';
import { useHistory } from 'react-router';
import { getInboxTarget } from '../../../contexts/NotificationsContext/notificationsContextHelper';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { UNASSIGNED_TYPE } from '../../../constants/notifications';

const Div = styled("div")`
  height: 40px;
  display: flex;
  align-items: center;
  box-shadow: inset 0 -1px 0 0 rgba(100, 121, 143, 0.122);
  &.MailListItem-read {
    background-color: rgba(60, 64, 67, 0.3);
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
  flex-basis: 225px;
  min-width: 13vw;
  flex-shrink: 0;
  flex-grow: 0;
  color: black;
  & > *:not(:first-child) {
    font-size: 12px;
    margin-left: 4px;
  };
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

const DateLabelHovered = styled(DateLabel)`
    display: none;
`;

const DateLabelNotHovered = styled(DateLabel)`

`;

const DateLabelBNotHovered = styled(DateLabelNotHovered)`
  color: rgba(0, 0, 0, 0.87);
  font-weight: bold;
`;

const Item = styled("div")`
  margin-bottom: 1px;
  min-width: 80vw;
  overflow-x: hidden;
  &:hover ${DateLabelNotHovered} {
      display: none;
  }
  &:hover ${DateLabelHovered} {
      display: block;
  }
`

const workListStyles = makeStyles(() => {
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
      messagesDispatch(dehighlightMessages([typeObjectId]));
    }
  } else {
    pushMessage(MODIFY_NOTIFICATIONS_CHANNEL, { event, message: typeObjectId });
  }
}

export function removeWorkListItem(message, messagesDispatch, history) {
  const { type_object_id: typeObjectId } = message;
  const event = typeObjectId.startsWith('UNREAD') ? DELETE_EVENT : DEHIGHLIGHT_EVENT;
  modifyNotifications(event, typeObjectId, messagesDispatch);
  if (history) {
    navigate(history, getInboxTarget());
  }
}

export function dismissWorkListItem(message, messagesDispatch, history) {
  const { type_object_id: typeObjectId } = message;
  messagesDispatch(quickRemoveMessages([typeObjectId]))
  if (history) {
    navigate(history, getInboxTarget());
  }
}

function WorkListItem(props) {
  const {
    read,
    icon = (<div />),
    investible = '',
    market= '',
    comment = '',
    title = (<div />),
    people,
    message,
    date,
    checked = false,
    determinateDispatch,
    id,
    expansionPanel,
    expansionOpen,
    isDeletable = false,
    useSelect,
    isNotSynced = false
  } = props;
  const history = useHistory();
  const classes = workListStyles();
  const theme = useTheme();
  const [, messagesDispatch] = useContext(NotificationsContext);
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const actionStyles = useSizedIconButtonStyles({ childSize: 22, padding: 10 });
  const gutterStyles = useRowGutterStyles({ size: -10, before: -8 });
  const { link_type: linkType, type: messageType, is_highlighted: isHighlighted } = message || {};
  let fullText =  comment || investible || market;
  if (['UNREAD_REVIEWABLE', 'REVIEW_REQUIRED'].includes(messageType) && linkType === 'INVESTIBLE_REVIEW') {
    fullText = investible;
  }

  if (expansionOpen) {
    return (
      <div id={`workListItem${id}`} style={{visibility: expansionOpen ? 'visible' : 'hidden',
        height: expansionOpen ? undefined : 0}}>
        {expansionPanel || <React.Fragment />}
      </div>
    );
  }

  return (
    <Item key={`workListItem${id}`} id={`workListItem${id}`}>
      <RaisedCard elevation={3} rowStyle key={`raised${id}`}>
        <div style={{ width: '100%', cursor: isNotSynced ? undefined : 'pointer' }}
             id={`${isNotSynced ? 'grey' : 'link'}${id}`} key={`link${id}`}
             onClick={
          (event) => {
            if (isNotSynced) {
              console.info('Clicked when not synced.')
              return;
            }
            preventDefaultAndProp(event);
            // UNASSIGNED_TYPE only dehighlights when everything inside it has
            if (isHighlighted && messageType !== UNASSIGNED_TYPE) {
              messagesDispatch(dehighlightMessages([message.type_object_id]));
            }
            navigate(history, formInboxItemLink(id));
          }
        }>
          <Div key={`actions${id}`} className={isNotSynced ? 'MailListItem-read' : undefined}>
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
            <Text>{fullText}</Text>
            {mobileLayout || !date ? React.Fragment : (read ? (<DateLabelNotHovered>{date}</DateLabelNotHovered>) :
              (<DateLabelBNotHovered>{date}</DateLabelBNotHovered>))}
            {!isNotSynced && (
              <DateLabelHovered>
                {isDeletable && !mobileLayout && (
                  <NotificationDeletion message={message} />
                )}
                {expansionOpen ? <ExpandLess style={{color: 'black', marginRight: '1rem', marginLeft: '1rem'}} />
                  : <ExpandMoreIcon style={{color: 'black', marginRight: '1rem', marginLeft: '1rem'}} />}
              </DateLabelHovered>
            )}
          </Div>
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