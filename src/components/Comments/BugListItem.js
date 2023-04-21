import React, { useState } from 'react';
import cx from 'clsx';
import styled from 'styled-components';
import { Box, IconButton, Tooltip, useMediaQuery, useTheme } from '@material-ui/core';
import Checkbox from '@material-ui/icons/CheckBox';
import CheckBoxOutlineBlank from '@material-ui/icons/CheckBoxOutlineBlank';
import { useSizedIconButtonStyles } from '@mui-treasury/styles/iconButton/sized';
import { useRowGutterStyles } from '@mui-treasury/styles/gutter/row';
import PropTypes from 'prop-types';
import { preventDefaultAndProp } from '../../utils/marketIdPathFunctions';
import RaisedCard from '../../components/Cards/RaisedCard';
import { pushMessage } from '../../utils/MessageBusUtils';
import {
  DEHIGHLIGHT_EVENT,
  DELETE_EVENT,
  MODIFY_NOTIFICATIONS_CHANNEL
} from '../../contexts/NotificationsContext/notificationsContextMessages';
import { ExpandLess } from '@material-ui/icons';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { scrollToElement } from '../../contexts/ScrollContext';
import { expandOrContract } from './BugListContext';
import Chip from '@material-ui/core/Chip';
import { useIntl } from 'react-intl';

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
  flex-basis: 1000px;
  min-width: 13vw;
  flex-shrink: 0;
  flex-grow: 0;
  & > *:not(:first-child) {
    font-size: 12px;
    margin-left: 4px;
  };
  @media (max-width: 768px) {
    flex-basis: 300px;
  }
  @media (max-width: 1000px) {
    margin-left: 8px;
  }
`;

const TitleB
  = styled(Title)`
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

function BugListItem(props) {
  const {
    read,
    replyNum,
    title = '',
    message,
    date,
    checked = false,
    determinateDispatch,
    bugListDispatch,
    id,
    expansionPanel,
    expansionOpen,
    useSelect,
    notificationType
  } = props;
  const theme = useTheme();
  const intl = useIntl();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const actionStyles = useSizedIconButtonStyles({ childSize: 22, padding: 10 });
  const gutterStyles = useRowGutterStyles({ size: -10, before: -8 });
  const [isHovered, setIsHovered] = useState(false);

  function onDragStart(event) {
    const dragImage = document.getElementById(`dragImage${event.target.id}`);
    event.dataTransfer.setDragImage(dragImage, 100, 0);
    event.dataTransfer.setData('text', event.target.id);
    event.dataTransfer.setData('notificationType', notificationType);
  }

  function onDragEnd(event) {
    const dragImage = document.getElementById(`dragImage${event.target.id}`);
    dragImage.style.display = 'none';
  }

  return (
    <>
      <Item key={`bugListItem${id}`} id={id} style={{minWidth: useSelect ? undefined : '80vw'}}
            onDragStart={onDragStart} onDragEnd={onDragEnd} draggable>
        <RaisedCard elevation={3} rowStyle key={`raised${id}`}>
          <div style={{ width: '100%', cursor: 'pointer' }} id={`link${id}`} key={`link${id}`}
               onClick={
            (event) => {
              preventDefaultAndProp(event);
              if (!read) {
                let event = DEHIGHLIGHT_EVENT;
                if (message.type_object_id.startsWith('UNREAD')) {
                  event = DELETE_EVENT;
                }
                pushMessage(MODIFY_NOTIFICATIONS_CHANNEL, { event, message: message.type_object_id });
              }
              bugListDispatch(expandOrContract(id));
              if (!expansionOpen) {
                const item = document.getElementById(`bugListItem${id}`);
                if (item) {
                  scrollToElement(item);
                }
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
              </Box>
              {replyNum > 0 ? <Tooltip key={`tipreplies${id}`}
                                       title={intl.formatMessage({ id: 'numRepliesExplanation' })}>
                <Chip label={`${replyNum}`} size="small" style={{ marginLeft: '5px',
                marginRight: '15px', backgroundColor: 'white', border: '0.5px solid grey' }}/>
              </Tooltip>: React.Fragment}
              {read ? (<Title>{title}</Title>) : (<TitleB>{title}</TitleB>)}
              {isHovered || mobileLayout || !date ? React.Fragment : (read ? (<DateLabel>{date}</DateLabel>) :
                (<DateLabelB>{date}</DateLabelB>))}
              {isHovered && (
                <DateLabel>
                  {expansionOpen ? <ExpandLess style={{color: 'black', marginRight: '1rem'}} />
                    : <ExpandMoreIcon style={{color: 'black', marginRight: '1rem'}} />}
                </DateLabel>
              )}
            </Div>
          </div>
          <div id={`bugListItemExpansion${id}`} style={{visibility: expansionOpen ? 'visible' : 'hidden',
            height: expansionOpen ? undefined : 0}}>
            {expansionPanel || <React.Fragment />}
          </div>
        </RaisedCard>
      </Item>
      <div id={`dragImage${id}`} style={{display: 'block', minWidth: '10rem', width: '10rem',
        position: 'absolute', top: -10, right: -10, zIndex: 2}}>
        <Title>{title}</Title>
      </div>
    </>
  );
}

BugListItem.propTypes = {
  id: PropTypes.string.isRequired,
  read: PropTypes.bool,
  title: PropTypes.node,
  date: PropTypes.string
};

export default BugListItem;