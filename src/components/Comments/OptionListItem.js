import React, { useState } from 'react';
import styled from 'styled-components';
import { IconButton, useMediaQuery, useTheme } from '@material-ui/core';
import PropTypes from 'prop-types';
import { preventDefaultAndProp } from '../../utils/marketIdPathFunctions';
import GravatarGroup from '../../components/Avatars/GravatarGroup';
import RaisedCard from '../../components/Cards/RaisedCard';
import { ExpandLess } from '@material-ui/icons';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import ThumbUpIcon from '@material-ui/icons/ThumbUp';
import _ from 'lodash';
import DragImage from '../Dialogs/DragImage';
import TooltipIconButton from '../Buttons/TooltipIconButton';
import OptionMenu from '../../pages/Dialog/Decision/OptionMenu';

const Div = styled("div")`
  height: 45px;
  display: flex;
  align-items: center;
  box-shadow: inset 0 -1px 0 0 rgba(100, 121, 143, 0.122);
  &:hover {
    box-shadow: inset 1px 0 0 #dadce0, inset -1px 0 0 #dadce0,
      0 1px 2px 0 rgba(60, 64, 67, 0.3), 0 1px 3px 1px rgba(60, 64, 67, 0.15);
    z-index: 1;
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
  /* The title takes the room it needs and the secondary description yields the
     remainder (flex-shrink:0). On strict mobile there is no description, so the
     title element gets flex-grow/shrink/min-width:0 inline instead, to fill the
     row and ellipsize at the kebab (C-all-998). */
  flex-shrink: 0;
  flex-grow: 0;
  margin-left: 0.5rem;
  & > *:not(:first-child) {
    font-size: 12px;
  };
`;

const TitleB = styled(Title)`
  font-weight: bold;
  opacity: 0.87;
`;

const DateLabel = styled("div")`
  font-size: 14px;
  padding-left: 1rem;
  padding-right: 1rem;
  text-align: right;
`;

const Item = styled("div")`
  margin-bottom: 1px;
`

function OptionListItem(props) {
  const {
    isNew,
    description = '',
    title = '',
    people,
    expandOrContract,
    id,
    expansionPanel,
    expansionOpen,
    questionResolved,
    isInVoting,
    isAdmin,
    marketId,
    removeActions,
    inArchives,
    marketPresences,
    parentInvestibleId,
    highlightList=[]
  } = props;
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  // Use the kebab "more" menu for the option actions not just on phones but
  // through mid widths too - the inline icon toolbar needs a wide row, and at
  // mid sizes it squeezes the title (or loses buttons). Only full desktop keeps
  // the inline toolbar (C-all-996 / C-all-998).
  const useMoreMenu = useMediaQuery(theme.breakpoints.down('md'));
  const [anchorEl, setAnchorEl] = useState(null);
  const [mouseX, setMouseX] = useState();
  const [mouseY, setMouseY] = useState();
  const indexOfTitle = description.indexOf(title);
  let useDescription;
  if (indexOfTitle >= 0) {
    if (description.length > title.length) {
      useDescription = description.substring(title.length);
    } else {
      useDescription = '';
    }
  } else {
    useDescription = description?.startsWith('...') ? description.substring(3) : description;
  }

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
  }

  return (
    <>
      {/* B-all-485: a resolved question no longer hides the option actions outright - the menu
          stays reachable so Make task (the only action still valid then) remains available.
          When resolved and there is no parent job to make a task on, the menu would be empty,
          so only then does it disappear. Real archives still remove everything. */}
      <Item key={`optionListItem${id}`} id={id} onDragStart={onDragStart}
        draggable={!questionResolved && !inArchives && isAdmin}
        onContextMenu={((questionResolved && !parentInvestibleId) || removeActions || inArchives) ? undefined :
          recordPositionToggle}>
        {anchorEl && (
          <OptionMenu anchorEl={anchorEl} recordPositionToggle={recordPositionToggle} openForInvestment={isInVoting}
            mouseX={mouseX} mouseY={mouseY} marketId={marketId} investibleId={id} isAdmin={isAdmin}
            marketPresences={marketPresences} questionResolved={questionResolved} />
        )}
        <RaisedCard elevation={3} rowStyle key={`raised${id}`}>
          <div style={{ width: '100%', cursor: 'pointer' }} id={`link${id}`} key={`link${id}`}
               onClick={
            (event) => {
              if (!expandOrContract) {
                return;
              }
              preventDefaultAndProp(event);
              expandOrContract();
            }
          }>
            <Div key={`actions${id}`}>
              {!mobileLayout || _.isEmpty(people) ? React.Fragment :
                <>
                  <ThumbUpIcon style={{ fontSize: 16, color: '#2D9CDB', marginLeft: '0.25rem' }} />
                  <GravatarGroup users={people} highlightList={highlightList} />
                </>
              }
              {isNew ? (<TitleB style={{ color: theme.palette.type === 'dark' ? 'white' : 'black',
                ...(mobileLayout ? { flexGrow: 1, flexShrink: 1, minWidth: 0 } : {}) }}>{title}</TitleB>) :
              (<Title style={{ color: theme.palette.type === 'dark' ? 'white' : 'black',
                ...(mobileLayout ? { flexGrow: 1, flexShrink: 1, minWidth: 0 } : {}) }}>{title}</Title>)}
              {!mobileLayout && (
                <Text style={{ maxWidth: '55vw', marginLeft: '1rem' }}>{useDescription}</Text>
              )}
              {!mobileLayout && (
                <div style={{flexGrow: 1}}/>
              )}
              {mobileLayout || _.isEmpty(people) ? React.Fragment :
                <>
                  {/* T-all-2300: avatars on an option row mean votes - make that unmistakable */}
                  <ThumbUpIcon style={{ fontSize: 16, color: '#2D9CDB', marginRight: '0.25rem' }} />
                  <GravatarGroup users={people} highlightList={highlightList} />
                </>
              }
              {expandOrContract && mobileLayout && (
                <div style={{paddingLeft: '0.5rem', paddingRight: '0.5rem'}}>
                  <IconButton size="small" noPadding>
                    {expansionOpen ? <ExpandLess htmlColor='black' /> : <ExpandMoreIcon htmlColor='black' />}
                  </IconButton>
                </div>
              )}
              {expandOrContract && !mobileLayout && (
                <DateLabel>
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
                </DateLabel>
              )}
              {!expandOrContract && (
                <div style={{marginRight: '1rem'}} />
              )}
              {expansionOpen && !removeActions && !inArchives && (!questionResolved || parentInvestibleId) && (
                useMoreMenu ? (
                  // C-all-996 (Q-all-139, O-1) + C-all-998: the inline action toolbar
                  // needs a wide row, so on phones AND mid widths collapse it to a kebab
                  // that opens the same labeled action menu already rendered above for
                  // right-click. Only full desktop keeps the inline toolbar.
                  <TooltipIconButton translationId="more" onClick={recordPositionToggle} size="small" noPadding
                    icon={<MoreVertIcon htmlColor={theme.palette.type === 'dark' ? '#b0b0b0' : '#5f6368'} />} />
                ) : (
                  <OptionMenu openForInvestment={isInVoting} marketId={marketId} investibleId={id} isAdmin={isAdmin}
                    marketPresences={marketPresences} questionResolved={questionResolved} />
                )
              )}
            </Div>
          </div>
        </RaisedCard>
      </Item>
      <div id={`optionListItemExpansion${id}`} style={{visibility: expansionOpen ? 'visible' : 'hidden',
        height: expansionOpen ? undefined : 0}} draggable={false}>
        {expansionPanel || <React.Fragment />}
      </div>
      {!mobileLayout && (
        <DragImage id={id} name={title} />
      )}
    </>
  );
}

OptionListItem.propTypes = {
  id: PropTypes.string.isRequired,
  read: PropTypes.bool,
  icon: PropTypes.node,
  market: PropTypes.node,
  investible: PropTypes.node,
  comment: PropTypes.node,
  title: PropTypes.node,
  date: PropTypes.string
};

export default OptionListItem;