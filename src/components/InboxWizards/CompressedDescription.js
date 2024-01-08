import React, { useState } from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import { preventDefaultAndProp } from '../../utils/marketIdPathFunctions';
import RaisedCard from '../../components/Cards/RaisedCard';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { stripHTML } from '../../utils/stringFunctions';
import { ExpandLess } from '@material-ui/icons';
import { FormattedMessage } from 'react-intl';
import SpinningIconLabelButton from '../Buttons/SpinningIconLabelButton';

const Div = styled("div")`
  height: 40px;
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
  flex-basis: 1000px;
  min-width: 13vw;
  color: black;
  white-space: nowrap;
  overflow: hidden;
  padding-left: 1rem;
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

const DateLabel = styled(Text)`
  font-size: 14px;
  flex-basis: 100px;
  flex-shrink: 0;
  padding-right: 2rem;
  text-align: right;
`;

const DateLabelHovered = styled(DateLabel)`
    display: none;
`;

const DateLabelNotHovered = styled(DateLabel)`

`;

const Item = styled("div")`
  margin-bottom: 1px;
  &:hover ${DateLabelNotHovered} {
      display: none;
  }
  &:hover ${DateLabelHovered} {
      display: block;
  }
`

function CompressedDescription(props) {
  const {
    description = '',
    expansionPanel
  } = props;
  const [expansionOpen, setExpansionOpen] = useState(false);
  const title = stripHTML(description);
  return (
    <>
      <Item style={{display: expansionOpen ? 'none' : undefined, minWidth: '80vw'}}>
        <RaisedCard elevation={3} rowStyle>
          <div style={{ width: '100%', cursor: 'pointer' }}
               onClick={
            (event) => {
              preventDefaultAndProp(event);
              setExpansionOpen(true);
            }
          }>
            <Div>
              <Title>{title}</Title>
              <ExpandMoreIcon style={{color: 'black', marginLeft: '1rem', marginRight: '1rem'}} />
            </Div>
          </div>
        </RaisedCard>
      </Item>
      <div style={{display: expansionOpen ? 'block' : 'none',
        paddingBottom: '0.5rem'}} draggable={false}>
        {expansionPanel || <React.Fragment />}
        <SpinningIconLabelButton
          icon={ExpandLess}
          doSpin={false}
          onClick={(event) => {
            preventDefaultAndProp(event);
            setExpansionOpen(false);
          }}
        >
          <FormattedMessage
            id="commentCloseThreadLabel"
          />
        </SpinningIconLabelButton>
      </div>
    </>
  );
}

CompressedDescription.propTypes = {
  expansionPanel: PropTypes.object.isRequired,
  description: PropTypes.string.isRequired
};

export default CompressedDescription;