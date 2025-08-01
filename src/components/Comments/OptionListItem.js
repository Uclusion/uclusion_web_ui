import React from 'react';
import styled from 'styled-components';
import { IconButton, useMediaQuery, useTheme } from '@material-ui/core';
import PropTypes from 'prop-types';
import { preventDefaultAndProp } from '../../utils/marketIdPathFunctions';
import GravatarGroup from '../../components/Avatars/GravatarGroup';
import RaisedCard from '../../components/Cards/RaisedCard';
import { ExpandLess } from '@material-ui/icons';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import _ from 'lodash';
import DragImage from '../Dialogs/DragImage';
import TooltipIconButton from '../Buttons/TooltipIconButton';

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
  flex-shrink: 0;
  flex-grow: 0;
  color: black;
  margin-left: 0.5rem;
  & > *:not(:first-child) {
    font-size: 12px;
  };
  @media (max-width: 768px) {
    max-width: 200px;
  }
`;

const TitleB = styled(Title)`
  color: rgba(0, 0, 0, 0.87);
  font-weight: bold;
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
    isAdmin,
    highlightList=[]
  } = props;
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));

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
  function onDragStart(event) {
    const dragImage = document.getElementById(`dragImage${event.target.id}`);
    if (dragImage) {
      event.dataTransfer.setDragImage(dragImage, 100, 0);
    }
    event.dataTransfer.setData('text', event.target.id);
  }

  return (
    <>
      <Item key={`optionListItem${id}`} id={id} onDragStart={onDragStart} draggable={!questionResolved && isAdmin}>
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
                <GravatarGroup users={people} highlightList={highlightList} />
              }
              {isNew ? (<TitleB>{title}</TitleB>) : (<Title>{title}</Title>)}
              {!mobileLayout && (
                <Text style={{ maxWidth: '55vw', marginLeft: '1rem' }}>{useDescription}</Text>
              )}
              {!mobileLayout && (
                <div style={{flexGrow: 1}}/>
              )}
              {mobileLayout || _.isEmpty(people) ? React.Fragment :
                <GravatarGroup users={people} highlightList={highlightList} />
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