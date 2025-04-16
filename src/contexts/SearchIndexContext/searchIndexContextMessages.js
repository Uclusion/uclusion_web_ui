import { registerListener } from '../../utils/MessageBusUtils';
import { addToIndex } from './searchIndexContextHelper';
import { stripHTML } from '../../utils/stringFunctions';

export const SEARCH_INDEX_CHANNEL = 'SEARCH_INDEX_CHANNEL';
export const INDEX_UPDATE = 'INDEX_UPDATE';
export const INDEX_COMMENT_TYPE = 'COMMENT';
export const INDEX_INVESTIBLE_TYPE = 'INVESTIBLE';

function getBody(itemType, item) {
  // This stripHTML uses DOM - if it ends up being too heavy replace with regex
  switch (itemType) {
    case INDEX_COMMENT_TYPE:
      return stripHTML(item.body);
    case INDEX_INVESTIBLE_TYPE:
      return stripHTML(item.description);
    default:
      return ""
  }
}

export function transformItemsToIndexable(itemType, items){
  return items.map((item) => {
    const { id: itemId, market_id: itemMarketId, group_id: itemGroupId, deleted: itemDeleted } = item;
    let marketId = itemMarketId;
    let groupId = itemGroupId;
    let useItem = item;
    let id = itemId;
    let deleted = itemDeleted;
    if (itemType === INDEX_INVESTIBLE_TYPE) {
      const { market_infos: marketInfos, investible } = item;
      marketInfos.forEach((info) => {
        const { market_id: aMarketId, deleted: infoDeleted, group_id: aGroupId } = info;
        // Cheat and use last until multiple supported
        marketId = aMarketId;
        groupId = aGroupId;
        deleted = infoDeleted;
      });
      useItem = investible;
      id = investible.id;
    }
    if (deleted) {
      return {
        id,
        type: 'DELETED',
      }
    }
    const document = {
      type: itemType,
      body: getBody(itemType, useItem),
      id,
      marketId,
      groupId
    };
    if (useItem.name) {
      document.title = useItem.name;
    }
    return document;
  });
}

export function beginListening(index) {
  registerListener(SEARCH_INDEX_CHANNEL, 'indexUpdater', (data) => {
    const { payload: { event, itemType, items }} = data;
    switch (event){
      case INDEX_UPDATE:
        addToIndex(index, itemType, items);
        break;
      default:
        //do nothing
    }
  });
}