import React, { useState } from 'react';
import cx from 'clsx';
import styled from 'styled-components';
import { Box, IconButton, Tooltip, useMediaQuery, useTheme } from '@material-ui/core';
import { ISSUE_TYPE, QUESTION_TYPE, REPORT_TYPE, SUGGEST_CHANGE_TYPE, TODO_TYPE } from '../../constants/comments';
import { DARK_TEXT_BACKGROUND_COLOR } from '../Buttons/ButtonConstants';
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
    showChecked = true,
    activeInvestibles,
    maxWidth,
    isResolved = false,
    commentType
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
    if (isResolved) {
      event.dataTransfer.setData('resolved', 'true');
    }
  }
  // A comment whose body is just an image strips down to an empty title, which would render a blank row.
  // Fall back to a "Picture" placeholder so the row stays readable.
  const displayTitle = _.isEmpty(title) ? intl.formatMessage({ id: 'pictureBugPlaceholder' }) : title;
  // C-all-982: in the compact job-card variant (smallFont), give each item a
  // clean white box with a border and a colored left edge indicating its type,
  // plus dark readable text - instead of the muted teal box with grey text.
  const isDarkMode = theme.palette.type === 'dark';
  const typeAccent = {
    [ISSUE_TYPE]: '#E85757',          // blocker
    [SUGGEST_CHANGE_TYPE]: '#F29100', // suggestion
    [QUESTION_TYPE]: '#2F80ED',       // question
    [TODO_TYPE]: '#43A047',           // in progress
    [REPORT_TYPE]: '#00897B',         // review
  }[commentType] || '#8f8f8f';
  // A light box in both modes (white in light, the #C7CBCA "paper" used by the
  // comment cards in dark) with dark text, so the item reads as a clearly
  // defined box in dark mode too - not a near-invisible dark slate.
  // Use per-side longhand (not the `border` shorthand) together with the
  // colored left edge: mixing the `border` shorthand with `borderLeft` in an
  // inline style makes React clobber the accent when the style object updates
  // on a light/dark switch (C-all-982 followup).
  const edge = `1px solid rgba(0, 0, 0, ${isDarkMode ? 0.25 : 0.12})`;
  const cardStyle = smallFont ? {
    backgroundColor: isDarkMode ? DARK_TEXT_BACKGROUND_COLOR : '#ffffff',
    borderTop: edge,
    borderRight: edge,
    borderBottom: edge,
    borderLeft: `4px solid ${typeAccent}`,
  } : undefined;
  const titleStyle = {
    fontSize: smallFont ? '12px' : undefined,
    color: smallFont ? '#1c2b2e' : undefined,
    // B-all-465: a caller-constrained row (maxWidth) can be narrower than the
    // 13vw the Title otherwise insists on, which pushes the text past the
    // Card's hidden overflow and clips it before the ellipsis can render.
    minWidth: maxWidth ? 0 : undefined,
  };
  const titleWithHelp = toolTipId ? <Tooltip key={`inProgressRowKey${id}`} placement='top'
                                             title={<FormattedMessage id={toolTipId} />}>
      <Title style={titleStyle}>{displayTitle}</Title></Tooltip> :
    <Title style={titleStyle}>{displayTitle}</Title>;
  return (
    <div key={`fragBugListItem${id}`} onContextMenu={recordPositionToggle}>
      {anchorEl && marketId && (
        <BugMenu anchorEl={anchorEl} recordPositionToggle={recordPositionToggle} marketId={marketId} groupId={groupId}
                 commentId={id} notificationType={notificationType} mouseX={mouseX} mouseY={mouseY}
                 activeInvestibles={activeInvestibles} isResolved={isResolved} />
      )}
      {!hideRow && (
        <Item key={`listItem${id}`} id={id} style={{maxWidth, minWidth: (useSelect || !useMinWidth) ? undefined : '80vw'}}
              onDragStart={onDragStart} draggable>
          <RaisedCard elevation={smallFont ? 1 : 3} rowStyle key={`raised${id}`} cardStyle={cardStyle}>
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
                  {!mobileLayout && showChecked && (
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
                  {(mobileLayout || !showChecked) && (
                    <div style={{marginLeft: '0.5rem'}} />
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
                {isNew ? (<TitleB style={{ color: theme.palette.type === 'dark' ? 'white' : 'black',
                  minWidth: maxWidth ? 0 : undefined }}>{displayTitle}</TitleB>) : titleWithHelp}
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
                        lightSurface={smallFont}
                        icon={<ExpandLess />}
                        size="small"
                        noPadding
                        translationId="rowCollapse"
                      />
                      : <TooltipIconButton
                        lightSurface={smallFont}
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
        <DragImage id={id} name={displayTitle} />
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