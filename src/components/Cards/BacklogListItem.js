import React from 'react';
import styled from 'styled-components';
import { useMediaQuery, useTheme } from '@material-ui/core';
import PropTypes from 'prop-types';
import { formInvestibleLink, navigate, preventDefaultAndProp } from '../../utils/marketIdPathFunctions';
import RaisedCard from '../../components/Cards/RaisedCard';
import { useHistory } from 'react-router';
import _ from 'lodash';
import GravatarGroup from '../Avatars/GravatarGroup';
import { workListStyles } from '../Comments/OptionListItem';

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
  margin-left: 0.75rem;
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

function BacklogListItem(props) {
  const {
    read=true,
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
    event.dataTransfer.setDragImage(dragImage, 100, 0);
    event.dataTransfer.setData('text', event.target.id);
  }

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
              {read ? (<Title>{title}</Title>) : (<TitleB>{title}</TitleB>)}
              {mobileLayout || _.isEmpty(people) ? React.Fragment :
                <GravatarGroup users={people} className={classes.gravatarStyle}/> }
              <Text style={{ maxWidth: '55vw', marginLeft: '1rem' }}>{description}</Text>
              {mobileLayout || !date ? React.Fragment : (read ? (<DateLabel>{date}</DateLabel>) :
                (<DateLabelB>{date}</DateLabelB>))}
            </Div>
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

BacklogListItem.propTypes = {
  id: PropTypes.string.isRequired,
  read: PropTypes.bool,
  title: PropTypes.node,
  date: PropTypes.string
};

export default BacklogListItem;