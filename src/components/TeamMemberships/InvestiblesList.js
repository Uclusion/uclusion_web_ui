import React from 'react';
import PropTypes from 'prop-types';
import InvestiblesListItem from './InvestiblesListItem';

function InvestiblesList(props) {
  const { investibles, onClickInvestible } = props;
  return (
    investibles && investibles.map(investible => (
      <InvestiblesListItem
        key={investible.id}
        investible={investible}
        onClickInvestible={() => onClickInvestible(investible)}
      />
    ))
  );
}

InvestiblesList.propTypes = {
  investibles: PropTypes.arrayOf(PropTypes.object),
  onClickInvestible: PropTypes.func,
};

export default InvestiblesList;
