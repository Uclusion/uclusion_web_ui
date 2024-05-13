import React from 'react';
import styled from 'styled-components';
import { makeStyles, useMediaQuery, useTheme } from '@material-ui/core';
import PropTypes from 'prop-types';
import { formInvestibleLink, navigate, preventDefaultAndProp } from '../../utils/marketIdPathFunctions';
import RaisedCard from '../../components/Cards/RaisedCard';
import { useHistory } from 'react-router';
import _ from 'lodash';
import GravatarGroup from '../Avatars/GravatarGroup';
import DragImage from '../Dialogs/DragImage';

const Item = styled("div")`
  margin-bottom: 1px;
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
    max-width: 97%;
  }
`;

const Title = styled(Text)`
  margin-left: 0.75rem;
  flex-shrink: 0;
  flex-grow: 0;
  color: black;
  & > *:not(:first-child) {
    font-size: 12px;
    margin-left: 4px;
  };
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
  @media (max-width: 768px) {
    padding-right: 1rem;
  }
`;

const DateLabelB = styled(DateLabel)`
  color: rgba(0, 0, 0, 0.87);
  font-weight: bold;
`;

export const workListStyles = makeStyles(() => {
  return {
    gravatarStyle: {
      marginLeft: '0.75rem'
    },
    removed: {
      transform: 'translateX(100vw)',
      transitionDuration: '2s'
    }
  };
});

function BacklogListItem(props) {
  const {
    isNew=false,
    title = '',
    description = '',
    date,
    id,
    marketId,
    people
  } = props;
  const history = useHistory();
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const classes = workListStyles();

  function onDragStart(event) {
    const dragImage = document.getElementById(`dragImage${event.target.id}`);
    if (dragImage) {
      event.dataTransfer.setDragImage(dragImage, 100, 0);
    }
    event.dataTransfer.setData('text', event.target.id);
  }

  const useDescription = description?.startsWith('...') ? description.substring(3) : description;

  return (
    <>
      <Item key={`backlogListItem${id}`} id={id} style={{minWidth: '80vw'}} onDragStart={onDragStart} draggable>
        <RaisedCard elevation={3} rowStyle key={`raised${id}`}>
          <div style={{ width: '100%', cursor: 'pointer' }} id={`link${id}`} key={`link${id}`}
               onClick={
            (event) => {
              preventDefaultAndProp(event);
              navigate(history, formInvestibleLink(marketId, id));
            }
          }>
            <Div key={`actions${id}`}>
              {isNew ? (<TitleB>{title}</TitleB>) : (<Title>{title}</Title>)}
              {mobileLayout || _.isEmpty(people) ? React.Fragment :
                <GravatarGroup users={people} className={classes.gravatarStyle}/> }
              {!mobileLayout && (
                <Text style={{ maxWidth: '55vw', marginLeft: '1rem' }}>{useDescription}</Text>
              )}
              {!date ? React.Fragment : (isNew ? (<DateLabelB>{date}</DateLabelB>) :
                (<DateLabel>{date}</DateLabel>))}
            </Div>
          </div>
        </RaisedCard>
      </Item>
      {!mobileLayout && (
        <DragImage id={id} name={title} />
      )}
    </>
  );
}

BacklogListItem.propTypes = {
  id: PropTypes.string.isRequired,
  read: PropTypes.bool,
  title: PropTypes.node,
  date: PropTypes.string
};

export default BacklogListItem;