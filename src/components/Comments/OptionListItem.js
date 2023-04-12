import React, { useState } from 'react';
import styled from 'styled-components';
import { makeStyles, useMediaQuery, useTheme } from '@material-ui/core';
import PropTypes from 'prop-types';
import { preventDefaultAndProp } from '../../utils/marketIdPathFunctions';
import GravatarGroup from '../../components/Avatars/GravatarGroup';
import RaisedCard from '../../components/Cards/RaisedCard';
import { ExpandLess } from '@material-ui/icons';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

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
  margin-left: 0.75rem;
  & > *:not(:first-child) {
    font-size: 12px;
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
  min-width: 10vw;
  flex-basis: 100px;
  flex-shrink: 0;
  padding-right: 2rem;
  text-align: right;
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

function OptionListItem(props) {
  const {
    read,
    description = '',
    title = (<div />),
    people,
    expandOrContract,
    id,
    expansionPanel,
    expansionOpen,
    useSelect,
    isNotSynced = false
  } = props;
  const classes = workListStyles();
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const [isHovered, setIsHovered] = useState(false);
  const showExpansion = isHovered && !isNotSynced;

  function onDragStart(event) {
    event.dataTransfer.setData('text', event.target.id);
  }

  return (
    <Item key={`optionListItem${id}`} id={id} onDragStart={onDragStart} draggable
          style={{minWidth: useSelect ? undefined : '80vw'}}>
      <RaisedCard elevation={3} rowStyle key={`raised${id}`}>
        <div style={{ width: '100%', cursor: isNotSynced ? undefined : 'pointer' }} id={`link${id}`} key={`link${id}`}
             onClick={
          (event) => {
            if (isNotSynced) {
              return;
            }
            preventDefaultAndProp(event);
            expandOrContract();
          }
        } onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
          <Div key={`actions${id}`} className={isNotSynced ? 'MailListItem-read' : undefined}>
            {read ? (<Title>{title}</Title>) : (<TitleB>{title}</TitleB>)}
            {mobileLayout || !people ? React.Fragment : <GravatarGroup users={people} className={classes.gravatarStyle}/> }
            {description && (
              <Text style={{ maxWidth: '55vw' }}>{description}</Text>
            )}
            {showExpansion && (
              <DateLabel>
                {expansionOpen ? <ExpandLess style={{color: 'black', marginRight: '1rem'}} />
                  : <ExpandMoreIcon style={{color: 'black', marginRight: '1rem'}} />}
              </DateLabel>
            )}
          </Div>
        </div>
        <div id={`optionListItemExpansion${id}`} style={{visibility: expansionOpen ? 'visible' : 'hidden',
          height: expansionOpen ? undefined : 0}}>
          {expansionPanel || <React.Fragment />}
        </div>
      </RaisedCard>
    </Item>
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