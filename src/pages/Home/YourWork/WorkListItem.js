import React, { useContext, useEffect } from 'react'
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
import { getMarketClient } from '../../../api/uclusionClient'
import { dehighlightMessage, removeMessage } from '../../../contexts/NotificationsContext/notificationsContextReducer'
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext'
import ArchiveIcon from '@material-ui/icons/Archive'
import _ from 'lodash'
import GravatarGroup from '../../../components/Avatars/GravatarGroup'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import { Link } from '@material-ui/core'
import { getPageReducerPage } from '../../../components/PageState/pageStateHooks'
import { useHistory } from 'react-router'
import RaisedCard from '../../../components/Cards/RaisedCard'
import { pushMessage } from '../../../utils/MessageBusUtils'
import {
  DELETE_EVENT,
  DELETE_NOTIFICATIONS_CHANNEL
} from '../../../contexts/NotificationsContext/notificationsContextMessages'

const Item = styled("div")`
  margin-bottom: 20px;
`

const Div = styled("div")`
  height: 40px;
  display: flex;
  align-items: center;
  box-shadow: inset 0 -1px 0 0 rgba(100, 121, 143, 0.122);
  &.MailListItem-read {
    background-color: rgba(242,245,245,0.8);
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

const TextB = styled(Text)`
  color: rgba(0, 0, 0, 0.87);
  font-weight: bold;
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
    checkedDefault = false,
    setDeterminate,
    determinate,
    id,
    expansionPanel,
    workListItemFull, workListItemDispatch,
    expansionOpenDefault,
    isMultiple
  } = props;
  const [workListItemState, updateWorkListItemState, workListItemReset] =
    getPageReducerPage(workListItemFull, workListItemDispatch, id);
  const {
    expansionOpen
  } = workListItemState;
  const history = useHistory();
  const classes = workListStyles();
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const [, messagesDispatch] = useContext(NotificationsContext);
  const actionStyles = useSizedIconButtonStyles({ childSize: 22, padding: 10 });
  const gutterStyles = useRowGutterStyles({ size: -10, before: -8 });
  const [checked, setChecked] = React.useState(checkedDefault);
  const [expandedByGlobal, setExpandedByGlobal] = React.useState(undefined);
  const { market_id: marketId, type_object_id: typeObjectId, link, link_multiple: linkMultiple } = message;
  const useExpansionOpen = expandedByGlobal !== undefined ? expandedByGlobal :
    (expansionOpen === undefined ? false : expansionOpen);

  useEffect(() => {
    setChecked(checkedDefault);
  }, [checkedDefault])

  useEffect(() => {
    if (expansionOpenDefault !== undefined) {
      setExpandedByGlobal(expansionOpenDefault);
    }
  }, [expansionOpenDefault])

  const fullText = comment || investible || market;
  const deleteActionButtonOnclick = (event) => {
    preventDefaultAndProp(event);
    workListItemReset();
    removeWorkListItem(message, classes.removed, messagesDispatch);
    return getMarketClient(marketId).then((client) => client.users.removeNotifications([typeObjectId]));
  };
  const archiveActionButtonOnclick = (event) => {
    preventDefaultAndProp(event);
    messagesDispatch(dehighlightMessage(message));
    return getMarketClient(marketId).then((client) => client.users.removeNotifications([typeObjectId]));
  };
  const useLink = isMultiple ? linkMultiple : link;
  return (
    <Item key={`workListItem${id}`} id={`workListItem${id}`}>
      <RaisedCard elevation={3} noPadding>
        <Link href={useLink} style={{ width: '100%' }} key={`link${id}`} onClick={
          (event) => {
            preventDefaultAndProp(event);
            if (isDeletable) {
              pushMessage(DELETE_NOTIFICATIONS_CHANNEL, { event: DELETE_EVENT, marketId, message });
              messagesDispatch(removeMessage(message));
            } else if (!read && useSelect) {
              pushMessage(DELETE_NOTIFICATIONS_CHANNEL, { event: DELETE_EVENT, marketId, message });
              messagesDispatch(dehighlightMessage(message));
            }
            return navigate(history, useLink);
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
                    if (checked === checkedDefault) {
                      setDeterminate({...determinate, [id]: true});
                    } else {
                      setDeterminate(_.omit(determinate, id));
                    }
                    setChecked(!checked);
                  }}
                >
                  {read ? <div /> : (checked ? <Checkbox color="secondary" /> : <CheckBoxOutlineBlank />)}
                </StyledIconButton>
              )}
              {useSelect && (
                <StyledIconButton
                  classes={actionStyles}
                  onClick={isDeletable ? deleteActionButtonOnclick : (read ? undefined : archiveActionButtonOnclick)}
                >
                  { isDeletable ? <DeleteForever /> : (read ? <div /> : <ArchiveIcon />) }
                </StyledIconButton>
              )}
              <StyledIconButton
                classes={actionStyles}
                style={{marginLeft: useSelect ? undefined : '0.5rem'}}
                onClick={(event) => {
                  preventDefaultAndProp(event);
                  updateWorkListItemState({expansionOpen: !useExpansionOpen});
                  setExpandedByGlobal(undefined);
                }}
              >
                { expansionPanel ? (useExpansionOpen ? <ExpandLess /> : <ExpandMoreIcon />) : <div /> }
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
            {read ? (<Text>{fullText}</Text>) : (<TextB>{fullText}</TextB>)}
            {mobileLayout ||!date ? React.Fragment : (read ? (<DateLabel>{date}</DateLabel>) : (<DateLabelB>{date}</DateLabelB>))}
          </Div>
        </Link>
        <div style={{overflowY: 'auto', maxHeight: '50rem',
          visibility: useExpansionOpen ? 'visible' : 'hidden', height: useExpansionOpen ? undefined : 0}}>
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