

export const DISPLAY_MESSAGE = 'DISPLAY_MESSAGE'
export const displayMessage = (intlMessage, messageType) => ({
  type: DISPLAY_MESSAGE,
  message: intlMessage,
  level
})



export const receiveMarket = market => ({
  type: RECEIVE_MARKET,
  market
})

export const showMessage = (params = {}) => (dispatch) => {
  dispatch(displayMessage(params.message, params.level))
}
