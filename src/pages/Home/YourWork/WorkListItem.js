import React, { useContext } from 'react'
import cx from "clsx";
import styled from "styled-components";
import { Box, IconButton, makeStyles, useMediaQuery, useTheme } from '@material-ui/core'
import Checkbox from "@material-ui/icons/CheckBox";
import CheckBoxOutlineBlank from "@material-ui/icons/CheckBoxOutlineBlank";
import { useSizedIconButtonStyles } from "@mui-treasury/styles/iconButton/sized";
import { useRowGutterStyles } from "@mui-treasury/styles/gutter/row";
import PropTypes from 'prop-types'
import { navigate, preventDefaultAndProp } from '../../../utils/marketIdPathFunctions'
import { DeleteForever, ExpandLess } from '@material-ui/icons'
import { removeMessage } from '../../../contexts/NotificationsContext/notificationsContextReducer'
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext'
import ArchiveIcon from '@material-ui/icons/Archive'
import GravatarGroup from '../../../components/Avatars/GravatarGroup'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import { Link } from '@material-ui/core'
import { useHistory } from 'react-router'
import RaisedCard from '../../../components/Cards/RaisedCard'
import { deleteOrDehilightMessages } from '../../../api/users'
import { pushMessage } from '../../../utils/MessageBusUtils'
import {
  DEHIGHLIGHT_EVENT,
  MODIFY_NOTIFICATIONS_CHANNEL
} from '../../../contexts/NotificationsContext/notificationsContextMessages'

const Item = styled("div")`
  margin-bottom: 20px;
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
  min-width: 15vw;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-grow: 1;
  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

const Description = styled(Text)`
  &:hover {
    font-weight: bold;
  }
`;

const Title = styled(Text)`
  flex-basis: 280px;
  flex-shrink: 0;
  flex-grow: 0;
  & > *:not(:first-child) {
    font-size: 12px;
    margin-left: 4px;
  };
  @media (max-width: 768px) {
    flex-basis: 100px;
  }
`;

const TitleB = styled(Title)`
  color: rgba(0, 0, 0, 0.87);
  font-weight: bold;
`;

const DateLabel = styled(Text)`
  font-size: 14px;
  flex-basis: 100px;
  flex-shrink: 0;
  padding-right: 16px;
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

export function removeWorkListItem(message, removeClass, messagesDispatch) {
  const { type_object_id: typeObjectId } = message;
  const item = document.getElementById(`workListItem${typeObjectId}`);
  if (item) {
    item.addEventListener("transitionend",() => {
      messagesDispatch(removeMessage(message));
    });
    item.classList.add(removeClass);
  } else {
    messagesDispatch(removeMessage(message));
  }
}

function WorkListItem(props) {
  const {
    read,
    icon = (<div />),
    isDeletable,
    investible = '',
    market= '',
    comment = '',
    title = (<div />),
    people,
    message,
    date,
    useSelect = true,
    checked = false,
    determinateDispatch,
    expansionDispatch,
    id,
    expansionPanel,
    expansionOpen,
    isMultiple
  } = props;
  const history = useHistory();
  const classes = workListStyles();
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const actionStyles = useSizedIconButtonStyles({ childSize: 22, padding: 10 });
  const gutterStyles = useRowGutterStyles({ size: -10, before: -8 });
  const { link, link_multiple: linkMultiple } = message;

  const fullText = comment || investible || market;

  function getAllMessages() {
    const messages = [];
    if (linkMultiple) {
      const { messages: messagesUnsafe } = messagesState;
      (messagesUnsafe || []).forEach((msg) => {
        const { link_multiple: myLinkMultiple } = msg;
        if (myLinkMultiple === linkMultiple) {
          messages.push(msg);
        }
      });
    } else {
      messages.push(message);
    }
    return messages;
  }

  const deleteActionButtonOnclick = (event) => {
    preventDefaultAndProp(event);
    return deleteOrDehilightMessages(getAllMessages(), messagesDispatch, classes.removed);
  };
  const useLink = isMultiple ? linkMultiple : link;
  return (
    <Item key={`workListItem${id}`} id={`workListItem${id}`}>
      <RaisedCard elevation={3} noPadding>
        <Link underline='none' href={useLink} style={{ width: '100%' }} key={`link${id}`} onClick={
          (event) => {
            preventDefaultAndProp(event);
            expansionDispatch({ id });
            if (useSelect && !read) {
              pushMessage(MODIFY_NOTIFICATIONS_CHANNEL, { event: DEHIGHLIGHT_EVENT,
                messages: getAllMessages() });
            }
          }
        }>
          <Div className={cx(read && 'MailListItem-read')}>
            <Box flexShrink={0} className={gutterStyles.parent}>
              {!mobileLayout && useSelect && (
                <StyledIconButton
                  className={cx(checked && "MailListItem-checked")}
                  classes={actionStyles}
                  onClick={(event) => {
                    preventDefaultAndProp(event);
                    // We need to record when you unset when check all is on or set when check all is off
                    determinateDispatch({id});
                  }}
                >
                  {read ? <div /> : (checked ? <Checkbox color="secondary" /> : <CheckBoxOutlineBlank />)}
                </StyledIconButton>
              )}
              {useSelect && (
                <StyledIconButton
                  classes={actionStyles}
                  onClick={isDeletable ? deleteActionButtonOnclick : undefined}
                >
                  { isDeletable ? <DeleteForever /> : (read ? <div /> : <ArchiveIcon />) }
                </StyledIconButton>
              )}
              <StyledIconButton
                classes={actionStyles}
                style={{marginLeft: useSelect ? undefined : '0.5rem'}}
              >
                { expansionOpen ? <ExpandLess /> : <ExpandMoreIcon /> }
              </StyledIconButton>
              {(!useSelect || !mobileLayout) && (
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
            <Link underline='always' href={useLink} style={{ width: '100%' }} key={`linkThrough${id}`} onClick={
              (event) => {
                preventDefaultAndProp(event);
                if (useSelect && !read) {
                  pushMessage(MODIFY_NOTIFICATIONS_CHANNEL, { event: DEHIGHLIGHT_EVENT,
                    messages: getAllMessages() });
                }
                return navigate(history, useLink);
              }
            }>
              <Description>{fullText}</Description>
            </Link>
            {mobileLayout ||!date ? React.Fragment : (read ? (<DateLabel>{date}</DateLabel>) : (<DateLabelB>{date}</DateLabelB>))}
          </Div>
        </Link>
        <div style={{overflowY: 'auto', maxHeight: '50rem',
          visibility: expansionOpen ? 'visible' : 'hidden', height: expansionOpen ? undefined : 0}}>
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