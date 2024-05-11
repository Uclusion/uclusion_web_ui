/**
 Wrapper to allow easily setting and clearing a marker for syncing a market after a quick add is performed.
 The quick add itself is trusted by there could be async side effects. The audit created by a side effect would
 be in a race condition with the original operation and so the market might not get marked for sync and the side
 effect would be lost until the next operation.
 * */

export let syncMarketList = [];
