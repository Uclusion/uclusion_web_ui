import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import Typography from '@material-ui/core/Typography';
import ItemList from '../Lists/ItemList';
import InvestibleListCategory from './InvestibleListCategory';
import { getActiveInvestibleSearches } from '../../store/ActiveSearches/reducer';

class InvestibleList extends React.PureComponent {
  constructor(props) {
    super(props);
    this.mapInvestiblesToCategories = this.mapInvestiblesToCategories.bind(this);
    this.createCategoryLists = this.createCategoryLists.bind(this);
  }

  mapInvestiblesToCategories = (investibles) => {
    const categoryMap = new Map();
    investibles.forEach((element) => {
      const cats = element.category_list ? element.category_list : [];
      cats.forEach((category) => {
        const contents = categoryMap.get(category) || [];
        contents.push(element);
        categoryMap.set(category, contents);
      });
    });
    return categoryMap;
  };

  createCategoryLists = (categoryNames, categoryMap, marketId, teamId, user) => {
    const { marketSearches, location } = this.props;
    const hasSearchActive = marketSearches[marketId] && marketSearches[marketId].query !== '';
    const sortedNames = categoryNames.sort(); // put categories in alpha sorted order for now
    const searchFiltered = sortedNames.filter(name => !hasSearchActive || categoryMap.has(name));

    return searchFiltered.map((name) => {
      const categoryInvestibles = categoryMap.has(name) ? categoryMap.get(name) : [];
      return (
        <InvestibleListCategory
          key={name}
          category={name}
          investibles={categoryInvestibles}
          user={user}
          teamId={teamId}
          marketId={marketId}
          location={location}
        />
      );
    });
  };

  render() {
    const {
      intl, investibles, categories, user, teamId, marketId,
    } = this.props;
    if (!categories || categories.length === 0) {
      return (
        <Typography variant="h4">
          {intl.formatMessage({ id: 'warning_404_categories' })}
        </Typography>
      );
    }
    const defaultCategoryName = intl.formatMessage({ id: 'defaultCategoryName' });
    const categoryMap = this.mapInvestiblesToCategories(investibles, defaultCategoryName);
    const categoryNames = categories.map(category => category.name);
    const categoryLists = this.createCategoryLists(categoryNames,
      categoryMap, marketId, teamId, user);

    return (
      <ItemList
        categoryLists={categoryLists}
        headerActions={[]}
      />
    );
  }
}
const mapStateToProps = state => ({
  marketSearches: getActiveInvestibleSearches(state.activeSearches),
});

InvestibleList.propTypes = {
  intl: PropTypes.object.isRequired, //eslint-disable-line
  investibles: PropTypes.arrayOf(PropTypes.object).isRequired,
  categories: PropTypes.arrayOf(PropTypes.object), //eslint-disable-line
  teamId: PropTypes.string.isRequired,
  user: PropTypes.object.isRequired, //eslint-disable-line
  marketSearches: PropTypes.object.isRequired, //eslint-disable-line
  marketId: PropTypes.string.isRequired,
  location: PropTypes.object.isRequired, //eslint-disable-line
};

export default connect(mapStateToProps)(injectIntl(InvestibleList));
