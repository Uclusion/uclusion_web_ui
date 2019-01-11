import React from 'react'
import InvestibleListCategory from './InvestibleListCategory'
import ItemList from '../Lists/ItemList'
import { injectIntl } from 'react-intl'
import PropTypes from 'prop-types'
import Typography from '@material-ui/core/Typography'

class InvestibleList extends React.Component {

  constructor (props) {
    super(props)
    this.mapInvestiblesToCategories = this.mapInvestiblesToCategories.bind(this);
    this.createCategoryLists = this.createCategoryLists.bind(this);
  }

  mapInvestiblesToCategories = (investibles, defaultCategoryName) => {
    let categoryMap = new Map();
    investibles.forEach((element) => {
      const cats = element.category_list ? element.category_list : [];
      cats.forEach((category) => {
        let contents = categoryMap.get(category) || [];
        contents.push(element);
        categoryMap.set(category, contents);
      })
    })
    return categoryMap;
  }

  createCategoryLists = (categoryNames, categoryMap, marketId, teamId, user) => {
    console.log(categoryNames)
    const sortedNames = categoryNames.sort(); //put categories in alpha sorted order for now
    return sortedNames.map((name) => {
      const categoryInvestibles = categoryMap.has(name) ? categoryMap.get(name) : [];
      return <InvestibleListCategory key={name} category={name} investibles={categoryInvestibles} user={user} teamId={teamId} marketId={marketId}/>
    });
  }

  render () {
    const { intl, investibles, categories, user, teamId, marketId } = this.props;
    if (!categories || categories.length === 0) {
      return (
        <Typography variant='heading' >
          {intl.formatMessage({ id: 'warning_404_categories' })}
        </Typography>
      )
    }
    const defaultCategoryName = intl.formatMessage({id: 'defaultCategoryName'});
    const categoryMap = this.mapInvestiblesToCategories(investibles, defaultCategoryName);
    let categoryNames = categories.map(category => category.name);
    const categoryLists = this.createCategoryLists(categoryNames, categoryMap, marketId, teamId, user);
    return (
      <ItemList categoryLists={categoryLists} headerActions={[]}/>
    )
  }
}


InvestibleList.propTypes = {
  investibles: PropTypes.arrayOf(PropTypes.object).isRequired,
  categories: PropTypes.arrayOf(PropTypes.object).isRequired,
  teamId: PropTypes.string.isRequired,
  user: PropTypes.object.isRequired,
  marketId: PropTypes.string.isRequired
};

export default injectIntl(InvestibleList);