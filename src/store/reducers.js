import { combineReducers } from 'redux-loop'
import initState from './init'
import rootReducer from './rootReducer'
import investiblesReducer from './MarketInvestibles/reducer'
import marketsReducer from './Markets/reducer'
import usersReducer from './Users/reducer'
import teamsReducer from './Teams/reducer'
import filterReducer from 'material-ui-filter/lib/store/reducer'
import locale from './locale/reducer'
import persistentValues from './persistentValues/reducer'
import simpleValues from './simpleValues/reducer'
import themeSource from './themeSource/reducer'
import drawer from './drawer/reducer'


export const appReducers = {
  filters: filterReducer,
  locale,
  persistentValues,
  simpleValues,
  drawer,
  themeSource
}


const appReducer = combineReducers({
  ...appReducers, investiblesReducer, marketsReducer, usersReducer, teamsReducer
})


export default (state, action) => rootReducer(appReducer, initState, state, action)
