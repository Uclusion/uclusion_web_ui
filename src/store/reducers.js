import { combineReducers } from 'redux'
import initState from './init'
import { appReducers } from 'uclusion-shell/lib/store/reducers'
import rootReducer from 'uclusion-shell/lib/store/rootReducer'
import investiblesReducer from './MarketInvestibles/reducer'
import marketsReducer from './Markets/reducer'
import usersReducer from './Users/reducer'
import teamsReducer from './Teams/reducer'

const appReducer = combineReducers({
  ...appReducers, investiblesReducer, marketsReducer, usersReducer, teamsReducer
})

export default (state, action) => rootReducer(appReducer, initState, state, action)
