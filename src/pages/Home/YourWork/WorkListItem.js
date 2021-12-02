import React, { useContext, useEffect } from 'react'
import cx from "clsx";
import styled from "styled-components";
import { Box, IconButton, makeStyles, useMediaQuery, useTheme } from '@material-ui/core'
import Checkbox from "@material-ui/icons/CheckBox";
import CheckBoxOutlineBlank from "@material-ui/icons/CheckBoxOutlineBlank";
import { useSizedIconButtonStyles } from "@mui-treasury/styles/iconButton/sized";
import { useRowGutterStyles } from "@mui-treasury/styles/gutter/row";
import PropTypes from 'prop-types'
import { preventDefaultAndProp } from '../../../utils/marketIdPathFunctions'
import { DeleteForever } from '@material-ui/icons'
import { getMarketClient } from '../../../api/uclusionClient'
import { dehighlightMessage, removeMessage } from '../../../contexts/NotificationsContext/notificationsContextReducer'
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext'
import ArchiveIcon from '@material-ui/icons/Archive'
import _ from 'lodash'
import GravatarGroup from '../../../components/Avatars/GravatarGroup'

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
  font-size: 14px;
  color: #5f6368;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-grow: 1;
`;

const TextB = styled(Text)`
  color: rgba(0, 0, 0, 0.87);
  font-weight: bold;
`;

const Title = styled(Text)`
  flex-basis: 215px;
  flex-shrink: 0;
  flex-grow: 0;
  & > *:not(:first-child) {
    font-size: 12px;
    margin-left: 4px;
  }
`;

const TitleB = styled(Title)`
  color: rgba(0, 0, 0, 0.87);
  font-weight: bold;
`;

const DateLabel = styled(Text)`
  font-size: 12px;
  flex-basis: 100px;
  flex-shrink: 0;
  padding-right: 16px;
  text-align: right;
`;

const DateLabelB = styled(DateLabel)`
  color: rgba(0, 0, 0, 0.87);
  font-weight: bold;
`;

const useStyles = makeStyles(() => {
  return {
    gravatarStyle: {
      paddingRight: '1rem',
    },
  };
});

function WorkListItem(props) {
  const {
    read,
    icon = (<div />),
    isDeletable,
    investible = '',
    comment = '',
    title = (<div />),
    people,
    message,
    date,
    useSelect = true,
    checkedDefault = false,
    setDeterminate,
    determinate,
    id
  } = props;
  const classes = useStyles();
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const [, messagesDispatch] = useContext(NotificationsContext);
  const actionStyles = useSizedIconButtonStyles({ childSize: 20, padding: 10 });
  const gutterStyles = useRowGutterStyles({ size: -10, before: -8 });
  const [checked, setChecked] = React.useState(checkedDefault);

  useEffect(() => {
    setChecked(checkedDefault);
  }, [checkedDefault])

  let fullText = investible;
  if (fullText && comment) {
    fullText += ` / ${comment}`;
  } else if (comment) {
    fullText = comment;
  }
  const deleteActionButtonOnclick = (event) => {
    preventDefaultAndProp(event);
    const { market_id: marketId, type_object_id: typeObjectId } = message;
    messagesDispatch(removeMessage(message));
    return getMarketClient(marketId).then((client) => client.users.removeNotifications([typeObjectId]));
  };
  const archiveActionButtonOnclick = (event) => {
    preventDefaultAndProp(event);
    const { market_id: marketId, type_object_id: typeObjectId } = message;
    messagesDispatch(dehighlightMessage(message));
    return getMarketClient(marketId).then((client) => client.users.removeNotifications([typeObjectId]));
  };
  return (
    <Div
      key={`workListItem${id}`}
      className={cx(read && 'MailListItem-read')}
    >
      <Box flexShrink={0} className={gutterStyles.parent}>
        {useSelect && (
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
        {!mobileLayout && useSelect && (
          <StyledIconButton
            classes={actionStyles}
            onClick={isDeletable ? deleteActionButtonOnclick : (read ? undefined : archiveActionButtonOnclick)}
          >
            { isDeletable ? <DeleteForever /> : (read ? <div /> : <ArchiveIcon />) }
          </StyledIconButton>
        )}
        {!mobileLayout && (
          <StyledIconButton
            classes={actionStyles}
            style={{marginLeft: !useSelect ? '0.25rem' : undefined}}
          >
            { icon }
          </StyledIconButton>
        )}
      </Box>
      {mobileLayout ? React.Fragment : (read ?
        (<Title style={{flexBasis: useSelect ? undefined : '160px'}}>{title}</Title>) :
        (<TitleB style={{flexBasis: useSelect ? undefined : '160px'}}>{title}</TitleB>))}
      {mobileLayout || !people ? React.Fragment : <GravatarGroup users={people} className={classes.gravatarStyle}/> }
      {read ? (<Text>{fullText}</Text>) : (<TextB>{fullText}</TextB>)}
      {mobileLayout ? React.Fragment : (read ? (<DateLabel>{date}</DateLabel>) : (<DateLabelB>{date}</DateLabelB>))}
    </Div>
  );
}

WorkListItem.propTypes = {
  read: PropTypes.bool,
  icon: PropTypes.node,
  market: PropTypes.node,
  investible: PropTypes.node,
  comment: PropTypes.node,
  title: PropTypes.node,
  description: PropTypes.node,
  date: PropTypes.string
};

export default WorkListItem;