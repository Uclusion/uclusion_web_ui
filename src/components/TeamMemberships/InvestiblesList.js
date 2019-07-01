import React from 'react';
import PropTypes from 'prop-types';
import InvestiblesListItem from '../Investibles/InvestibleListItem';

function InvestiblesList(props) {
  const { investibles } = props;
  return (
    investibles && investibles.map(investible => (
      <InvestiblesListItem
        key={investible.id}
        investible={investible}
      />
    ))
  );
}

InvestiblesList.propTypes = {
  investibles: PropTypes.arrayOf(PropTypes.object),
};

export default InvestiblesList;
