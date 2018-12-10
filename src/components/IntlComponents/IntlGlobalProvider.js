/**
 Wrapper to stick in the I18n tree to capture the react-intl prop and expose it to javascript
 code that is NOT a react component and hence cant use injectIntl
 **/

import React  from 'react'
import { injectIntl } from 'react-intl'

export let intl = null

class IntlGlobalProvider extends React.Component {
  constructor (props) {
    super(props)
    intl = this.props.intl
  }

  render () {
    intl = this.props.intl
    return this.props.children
  }
}

export default injectIntl(IntlGlobalProvider)
