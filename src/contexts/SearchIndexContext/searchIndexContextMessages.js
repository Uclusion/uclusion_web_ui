import { registerListener } from '../../utils/MessageBusUtils';

export const SEARCH_INDEX_CHANNEL = 'SEARCH_INDEX_CHANNEL';
export const INDEX_UPDATE = 'INDEX_UPDATE';
export const INDEX_COMMENT_TYPE = 'COMMENT';
export const INDEX_INVESTIBLE_TYPE = 'INVESTIBLE';
export const INDEX_GROUP_TYPE = 'GROUP';

function getBody(itemType, item) {
  switch (itemType) {
    case INDEX_COMMENT_TYPE:
      return item.body;
    case INDEX_INVESTIBLE_TYPE:
    case INDEX_GROUP_TYPE:
      // add the name and description into the tokenization
      return item.description + " " + item.name;
    default:
      return ""
  }
}

function transformItemsToIndexable(itemType, items){
  return items.map((item) => {
    const { id: itemId, market_id: itemMarketId, deleted: itemDeleted } = item;
    let marketId = itemMarketId;
    let useItem = item;
    let id = itemId;
    let deleted = itemDeleted;
    if (itemType === INDEX_INVESTIBLE_TYPE) {
      const { market_infos: marketInfos, investible } = item;
      marketInfos.forEach((info) => {
        const { market_id: aMarketId, deleted: infoDeleted } = info;
        // Cheat and use last until multiple supported
        marketId = aMarketId;
        deleted = infoDeleted;
      });
      useItem = investible;
      id = investible.id;
    }
    if (deleted) {
      return {
        type: 'DELETED',
      }
    }
    return {
      type: itemType,
      body: getBody(itemType, useItem),
      id,
      marketId,
    }
  });
}

export function beginListening(index) {
  registerListener(SEARCH_INDEX_CHANNEL, 'indexUpdater', (data) => {
    const { payload: { event, itemType, items }} = data;
    switch (event){
      case INDEX_UPDATE:
        const indexable = transformItemsToIndexable(itemType, items);
        index.addDocuments(indexable.filter((item) => item.type !== 'DELETED'));
        break;
      default:
        //do nothing
    }
  });
}