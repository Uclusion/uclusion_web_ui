import { registerListener } from '../../utils/MessageBusUtils';

export const SEARCH_INDEX_CHANNEL = 'SEARCH_INDEX_CHANNEL';
export const INDEX_UPDATE = 'INDEX_UPDATE';
export const INDEX_COMMENT_TYPE = 'COMMENT';
export const INDEX_INVESTIBLE_TYPE = 'INVESTIBLE';
export const INDEX_MARKET_TYPE = 'MARKET';


function getBody(itemType, item) {
  switch (itemType) {
    case INDEX_COMMENT_TYPE:
      return item.body;
    case INDEX_INVESTIBLE_TYPE:
    case INDEX_MARKET_TYPE:
      // add the name and description into the tokenization
      return item.description + " " + item.name;
    default:
      return ""
  }
}

function transformItemsToIndexable(itemType, items){
  return items.map((item) => {
    const { id } = item;
    return {
      type: itemType,
      body: getBody(itemType, item),
      id,
    }
  });
}

export function beginListening(index) {
  registerListener(SEARCH_INDEX_CHANNEL, 'indexUpdater', (data) => {
    const { payload: { event, itemType, items }} = data;
    switch (event){
      case INDEX_UPDATE:
        const indexable = transformItemsToIndexable(itemType, items);
        index.addDocuments(indexable);
        break;
      default:
        //do nothing
    }
  });
}