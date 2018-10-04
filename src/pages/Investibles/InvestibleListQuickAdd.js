import React from 'react'
import ItemListQuickAdd from '../../components/ItemListQuickAdd'
import PropTypes from 'prop-types'

class InvestibleListQuickAdd extends React.Component {

  constructor (props) {
    super(props)
    this.addOnClick = this.addOnClick.bind(this);
    this.cancelOnClick = this.cancelOnClick.bind(this);
  }

  addOnClick(value){
    //fill in what to do here
  }


  render () {
    const { user, marketId, category } = this.props;
    return (
      <ItemListQuickAdd addOnClick={this.addOnClick} cancelOnClick={this.cancelOnClick}/>
    )
  };
}


InvestibleListQuickAdd.propTypes = {
  category: PropTypes.string.isRequired,
  user: PropTypes.object.isRequired,
  marketId: PropTypes.string.isRequired
}

export default InvestibleListQuickAdd;