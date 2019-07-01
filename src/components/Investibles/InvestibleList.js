import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import ItemList from '../Lists/ItemList';
import { getActiveInvestibleSearches } from '../../store/ActiveSearches/reducer';
import InvestibleListCategory from './InvestibleListCategory';

class InvestibleList extends React.PureComponent {

  render() {
    const {
      intl, investibles, location
    } = this.props;

    return (
      <InvestibleListCategory category={'Investibles'} investibles={investibles} location={location}/>
    );
  }
}
const mapStateToProps = state => ({
  marketSearches: getActiveInvestibleSearches(state.activeSearches),
});

InvestibleList.propTypes = {
  intl: PropTypes.object.isRequired, //eslint-disable-line
  investibles: PropTypes.arrayOf(PropTypes.object).isRequired,
  location: PropTypes.object.isRequired, //eslint-disable-line
};

export default connect(mapStateToProps)(injectIntl(InvestibleList));
