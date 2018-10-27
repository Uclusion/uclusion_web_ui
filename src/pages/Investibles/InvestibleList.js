import React from 'react'
import InvestibleListCategory from './InvestibleListCategory'
import ItemList from '../../components/ItemList'
import { injectIntl } from 'react-intl'
import PropTypes from 'prop-types'
class InvestibleList extends React.Component {

  constructor (props) {
    super(props)
    this.mapInvestiblesToCategories = this.mapInvestiblesToCategories.bind(this);
    this.createCategoryLists = this.createCategoryLists.bind(this);
  }

  mapInvestiblesToCategories = (investibles, defaultCategoryName) => {
    let categoryMap = new Map();
    investibles.forEach((element) => {
      const cats = element.category_list;
      cats.forEach((category) => {
        let contents = categoryMap.get(category) || [];
        contents.push(element);
        categoryMap.set(category, contents);
      })
    })
    return categoryMap;
  }

  createCategoryLists = (categoryMap, marketId, teamId, user) => {
    let categoryNames = Array.from(categoryMap.keys());
    console.log(categoryNames)
    const sortedNames = categoryNames.sort(); //put categories in alpha sorted order for now
    let categoryLists = sortedNames.map((name) => {
      const categoryInvestibles = categoryMap.get(name);
      return <InvestibleListCategory key={name} category={name} investibles={categoryInvestibles} user={user} teamId={teamId} marketId={marketId}/>
    });
    return categoryLists;
  }

  render () {
    const { intl, investibles, user, teamId, marketId } = this.props;
    const defaultCategoryName = intl.formatMessage({id: 'defaultCategoryName'});
    const categoryMap = this.mapInvestiblesToCategories(investibles, defaultCategoryName);
    const categoryLists = this.createCategoryLists(categoryMap, marketId, teamId, user);
    return (
      <ItemList categoryLists={categoryLists} headerActions={[]}/>
    )
  }
}


InvestibleList.propTypes = {
  investibles: PropTypes.arrayOf(PropTypes.object).isRequired,
  teamId: PropTypes.string.isRequired,
  user: PropTypes.object.isRequired,
  marketId: PropTypes.string.isRequired
};

export default injectIntl(InvestibleList);