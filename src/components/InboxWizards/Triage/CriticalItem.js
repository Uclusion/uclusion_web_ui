import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import RaisedCard from '../../Cards/RaisedCard';
import { navigate, preventDefaultAndProp } from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import GravatarGroup from '../../Avatars/GravatarGroup';
import UsefulRelativeTime from '../../TextFields/UseRelativeTime';
import { workListStyles } from '../../Cards/BacklogListItem';

const Item = styled("div")`
  margin-bottom: 1px;
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
  flex-basis: 1000px;
  min-width: 13vw;
  color: black;
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
  color: rgba(0, 0, 0, 0.87);
  padding-left: 1rem;
  font-weight: bold;
`;

const DateLabel = styled(Text)`
  font-size: 14px;
  flex-basis: 100px;
  flex-shrink: 0;
  padding-right: 2rem;
  text-align: right;
`;

const DateLabelB = styled(DateLabel)`
  color: rgba(0, 0, 0, 0.87);
  font-weight: bold;
`;

function CriticalItem(props) {
  const {
    title = '',
    date,
    id,
    link,
    people,
    isRead
  } = props;
  const history = useHistory();
  const classes = workListStyles();

  return (
    <>
      <Item key={`criticalItem${id}`} id={`criticalItem${id}`} style={{minWidth: '80vw'}}>
        <RaisedCard elevation={3} rowStyle key={`raised${id}`}>
          <div style={{ width: '100%', cursor: 'pointer' }} id={`link${id}`} key={`link${id}`}
               onClick={
            (event) => {
              preventDefaultAndProp(event);
              navigate(history, link);
            }
          }>
            <Div key={`actions${id}`}>
              <GravatarGroup users={people} className={classes.gravatarStyle}/>
              {!isRead && (
                <TitleB>{title}</TitleB>
              )}
              {isRead && (
                <Title>{title}</Title>
              )}
              {!isRead && (
                <DateLabelB>Updated <UsefulRelativeTime value={date}/></DateLabelB>
              )}
              {isRead && (
                <DateLabel>Updated <UsefulRelativeTime value={date}/></DateLabel>
              )}
            </Div>
          </div>
        </RaisedCard>
      </Item>
    </>
  );
}

CriticalItem.propTypes = {
  id: PropTypes.string.isRequired,
  read: PropTypes.bool,
  title: PropTypes.node,
  date: PropTypes.object
};

export default CriticalItem;