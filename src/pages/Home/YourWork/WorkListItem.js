import React, { useState } from 'react';
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
  dehighlightMessages,
  removeMessages
} from '../../../contexts/NotificationsContext/notificationsContextReducer';
import { useHistory } from 'react-router';
import { getInboxTarget } from '../../../contexts/NotificationsContext/notificationsContextHelper';

const Item = styled("div")`
  margin-bottom: 1px;
  min-width: 80vw;
`

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
  flex-basis: 180px;
  min-width: 13vw;
  flex-shrink: 0;
  flex-grow: 0;
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

const DateLabelB = styled(DateLabel)`
  color: rgba(0, 0, 0, 0.87);
  font-weight: bold;
`;

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
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const actionStyles = useSizedIconButtonStyles({ childSize: 22, padding: 10 });
  const gutterStyles = useRowGutterStyles({ size: -10, before: -8 });
  const [isHovered, setIsHovered] = useState(false);
  let fullText =  investible || comment || market;
  if (!moreDescription && investible && comment) {
    fullText += ' - ' + comment;
  }
  const showExpansion = isHovered && !isNotSynced;
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
        <div style={{ width: '100%', cursor: isNotSynced ? undefined : 'pointer' }} id={`link${id}`} key={`link${id}`}
             onClick={
          (event) => {
            if (isNotSynced) {
              return;
            }
            preventDefaultAndProp(event);
            setIsHovered(false);
            navigate(history, formInboxItemLink(id));
          }
        } onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
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
            {moreDescription && !mobileLayout && (
              <Text style={{ maxWidth: '55vw' }}>{fullText} - {moreDescription}</Text>
            )}
            {(!moreDescription || mobileLayout) && (
              <Text style={{ maxWidth: '55vw' }}>{fullText}</Text>
            )}
            {showExpansion || mobileLayout || !date ? React.Fragment : (read ? (<DateLabel>{date}</DateLabel>) :
              (<DateLabelB>{date}</DateLabelB>))}
            {showExpansion && (
              <DateLabel>
                {isDeletable && !mobileLayout && (
                  <NotificationDeletion message={message} fromRow />
                )}
                {expansionOpen ? <ExpandLess style={{color: 'black', marginRight: '1rem'}} />
                  : <ExpandMoreIcon style={{color: 'black', marginRight: '1rem'}} />}
              </DateLabel>
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