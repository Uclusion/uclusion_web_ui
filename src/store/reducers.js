import { combineReducers } from 'redux'
import initState from './init'
import { appReducers } from 'uclusion-shell/lib/store/reducers'
import rootReducer from 'uclusion-shell/lib/store/rootReducer'
import investiblesReducer from '../containers/Investibles/reducer'
import marketsReducer from '../containers/Markets/reducer'

const appReducer = combineReducers({
  ...appReducers, investiblesReducer, marketsReducer
})

export default (state, action) => rootReducer(appReducer, initState, state, action)
