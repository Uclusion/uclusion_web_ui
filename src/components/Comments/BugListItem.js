import React, { useState } from 'react';
import cx from 'clsx';
import styled from 'styled-components';
import { Box, IconButton, Tooltip, useMediaQuery, useTheme } from '@material-ui/core';
import Checkbox from '@material-ui/icons/CheckBox';
import CheckBoxOutlineBlank from '@material-ui/icons/CheckBoxOutlineBlank';
import { useSizedIconButtonStyles } from '@mui-treasury/styles/iconButton/sized';
import { useRowGutterStyles } from '@mui-treasury/styles/gutter/row';
import PropTypes from 'prop-types';
import { navigate, preventDefaultAndProp } from '../../utils/marketIdPathFunctions';
import RaisedCard from '../../components/Cards/RaisedCard';
import { ExpandLess, ReportOutlined } from '@material-ui/icons';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { expandOrContract } from './BugListContext';
import Chip from '@material-ui/core/Chip';
import { FormattedMessage, useIntl } from 'react-intl';
import DragImage from '../Dialogs/DragImage';
import { POKED } from '../../constants/notifications';
import _ from 'lodash';
import TooltipIconButton from '../Buttons/TooltipIconButton';
import { useHistory } from 'react-router';
import BugMenu from './BugMenu';

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
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-grow: 1;
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
  opacity: 0.87;
  font-weight: bold;
`;

const DateLabel = styled(Text)`
  font-size: 14px;
  flex-basis: 120px;
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
  opacity: 0.87;
  font-weight: bold;
`;

const Item = styled("div")`
    margin-bottom: 1px;
    &:hover ${DateLabelNotHovered} {
        display: none;
    }
    &:hover ${DateLabelHovered} {
        display: block;
    }
    @media (max-width: 768px) {
        max-width: 98%;
    }
`

function BugListItem(props) {
  const {
    newMessages,
    replyNum,
    title = '',
    date,
    checked = false,
    determinateDispatch,
    bugListDispatch,
    id,
    marketId,
    groupId,
    expansionPanel,
    expansionOpen,
    useSelect,
    notificationType,
    useMinWidth = true,
    useMobileLayout = false,
    smallFont = false,
    hideRow = false,
    link,
    toolTipId,
    activeInvestibles,
    maxWidth
  } = props;
  const [anchorEl, setAnchorEl] = useState(null);
  const [mouseX, setMouseX] = useState();
  const [mouseY, setMouseY] = useState();
  const theme = useTheme();
  const intl = useIntl();
  const history = useHistory();
  const mediaMobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const mobileLayout = mediaMobileLayout || useMobileLayout;
  const actionStyles = useSizedIconButtonStyles({ childSize: 22, padding: 10 });
  const gutterStyles = useRowGutterStyles({ size: -10, before: -8 });
  const isNew = !_.isEmpty(newMessages);
  const poked = !_.isEmpty(newMessages?.find((msg) => {
    const { alert_type: alertType, poked_list: pokedList } = msg || {};
    return !_.isEmpty(pokedList) ? pokedList.includes(id) : alertType === POKED;
  }));

  const recordPositionToggle = (event) => {
    if (anchorEl === null) {
      preventDefaultAndProp(event);
      setAnchorEl(event.currentTarget);
      setMouseX(event.clientX);
      setMouseY(event.clientY);
    } else {
      setAnchorEl(null);
    }
  };

  function onDragStart(event) {
    const dragImage = document.getElementById(`dragImage${event.target.id}`);
    if (dragImage) {
      event.dataTransfer.setDragImage(dragImage, 100, 0);
    }
    event.dataTransfer.setData('text', event.target.id);
    event.dataTransfer.setData('notificationType', notificationType);
  }
  const titleWithHelp = toolTipId ? <Tooltip key={`inProgressRowKey${id}`} placement='top'
                                             title={<FormattedMessage id={toolTipId} />}>
      <Title style={{fontSize: smallFont ? '12px' : undefined}}>{title}</Title></Tooltip> :
    <Title style={{fontSize: smallFont ? '12px' : undefined}}>{title}</Title>;
  return (
    <div key={`fragBugListItem${id}`} onContextMenu={recordPositionToggle}>
      {anchorEl && marketId && (
        <BugMenu anchorEl={anchorEl} recordPositionToggle={recordPositionToggle} marketId={marketId} groupId={groupId}
                 commentId={id} notificationType={notificationType} mouseX={mouseX} mouseY={mouseY}
                 activeInvestibles={activeInvestibles} />
      )}
      {!hideRow && (
        <Item key={`listItem${id}`} id={id} style={{maxWidth, minWidth: (useSelect || !useMinWidth) ? undefined : '80vw'}}
              onDragStart={onDragStart} draggable>
          <RaisedCard elevation={smallFont ? 1 : 3} rowStyle key={`raised${id}`}>
            <div style={{ width: '100%', cursor: 'pointer' }} id={`link${id}`} key={`link${id}`}
                 onClick={
              (event) => {
                preventDefaultAndProp(event);
                if (bugListDispatch) {
                  bugListDispatch(expandOrContract(id));
                } else {
                  navigate(history, link);
                }
              }
            }>
              <Div key={`actions${id}`}>
                <Box flexShrink={0} className={gutterStyles.parent} key={`box${id}`}>
                  {!mobileLayout && (
                    <StyledIconButton
                      className={cx(checked && "MailListItem-checked")}
                      style={{marginLeft: '0.15rem', color: theme.palette.type === 'dark' ? 'white' : undefined, 
                        visibility: useSelect ? 'visible' : 'hidden'}}
                      classes={actionStyles}
                      onClick={(event) => {
                        preventDefaultAndProp(event);
                        // We need to record when you unset when check all is on or set when check all is off
                        determinateDispatch({id});
                      }}
                    >
                      {checked ? <Checkbox /> : <CheckBoxOutlineBlank />}
                    </StyledIconButton>
                  )}
                  {mobileLayout && (
                    <div style={{marginLeft: '0.25rem'}} />
                  )}
                  {poked && (
                    <Tooltip key='pokedRowKey'
                             title={<FormattedMessage id='pokedBugExplanation' />}>
                      <StyledIconButton
                        classes={actionStyles}
                      >
                        <ReportOutlined style={{fontSize: 24, color: '#E85757'}}/>
                      </StyledIconButton>
                    </Tooltip>
                  )}
                </Box>
                {replyNum > 1 ? <Tooltip key={`tipreplies${id}`}
                                         title={intl.formatMessage({ id: 'numRepliesExplanation' })}>
                  <Chip label={`${replyNum}`} size="small" style={{ marginLeft: '5px', marginRight: '15px',
                    backgroundColor: theme.palette.type === 'dark' ? 'grey' : 'white' }}/>
                </Tooltip>: React.Fragment}
                {isNew ? (<TitleB style={{ color: theme.palette.type === 'dark' ? 'white' : 'black' }}>{title}</TitleB>) : titleWithHelp}
                {mobileLayout || !date ? React.Fragment : 
                (isNew ? (<DateLabelBNotHovered style={{ color: theme.palette.type === 'dark' ? 'white' : 'black' }}>{date}</DateLabelBNotHovered>) :
                  (<DateLabelNotHovered>{date}</DateLabelNotHovered>))}
                {mobileLayout && !_.isEmpty(expansionPanel) && (
                  <div style={{paddingRight: '0.25rem'}}>
                    {expansionOpen ? <ExpandLess /> : <ExpandMoreIcon /> }
                  </div>
                )}
                {!mobileLayout && (
                  <DateLabelHovered>
                    {expansionOpen ? <TooltipIconButton
                        icon={<ExpandLess />}
                        size="small"
                        noPadding
                        translationId="rowCollapse"
                      />
                      : <TooltipIconButton
                        icon={<ExpandMoreIcon />}
                        size="small"
                        noPadding
                        translationId="rowExpand"
                      />}
                  </DateLabelHovered>
                )}
              </Div>
            </div>
          </RaisedCard>
        </Item>
      )}
      <div id={`bugListItemExpansion${id}`} key={`bugListItemExpansionKey${id}`} draggable={false}
           style={{maxWidth: '96%', display: expansionOpen ? 'block' : 'none', paddingBottom: '0.5rem'}}>
        {expansionPanel || <React.Fragment />}
      </div>
      {!mobileLayout && (
        <DragImage id={id} name={title} />
      )}
    </div>
  );
}

BugListItem.propTypes = {
  id: PropTypes.string.isRequired,
  read: PropTypes.bool,
  title: PropTypes.node,
  date: PropTypes.string
};

export default BugListItem;