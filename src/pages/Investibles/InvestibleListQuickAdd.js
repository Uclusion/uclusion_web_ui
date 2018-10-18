import React from 'react'
import ItemListQuickAdd from '../../components/ItemListQuickAdd'
import PropTypes from 'prop-types'


class InvestibleListQuickAdd extends React.Component {

  constructor (props) {
    super(props)
    this.addOnClick = this.addOnClick.bind(this);
    this.cancelOnClick = this.cancelOnClick.bind(this);
  }

  addOnClick = (value) => {
    //fill in what to do here
  };

  cancelOnClick = (value) => {
    //do something here too
  };


  render () {
    const { user, marketId, category, visible } = this.props;
    return (
      <ItemListQuickAdd visible={visible} addOnClick={()=> alert(category)} cancelOnClick={this.cancelOnClick}/>
    )
  };
}


InvestibleListQuickAdd.propTypes = {
  category: PropTypes.string.isRequired,
  user: PropTypes.object.isRequired,
  marketId: PropTypes.string.isRequired,
  visible: PropTypes.bool.isRequired
}

export default InvestibleListQuickAdd;