import MiniSearch from 'minisearch';
import {
  getSearchResults,
  replaceIndexItems,
} from './searchIndexContextHelper';
import { SEARCH_INDEX_AUTO_VACUUM } from './SearchIndexContext';
import { INDEX_COMMENT_TYPE } from './searchIndexContextMessages';

function createIndex() {
  return new MiniSearch({
    fields: ['title', 'body'],
    storeFields: ['marketId', 'groupId', 'type'],
    autoVacuum: {
      minDirtCount: 1,
      minDirtFactor: 0,
      ...SEARCH_INDEX_AUTO_VACUUM,
    },
  });
}

function comment(id, body) {
  return {
    id: `${id}`,
    body: `<p>${body}</p>`,
    market_id: 'market',
    group_id: 'view',
  };
}

describe('search index replacement', () => {
  it('finishes vacuum traversal before searches can mutate its radix tree', async () => {
    const index = createIndex();
    expect(SEARCH_INDEX_AUTO_VACUUM.batchSize).toBe(Number.MAX_SAFE_INTEGER);
    const original = Array.from({ length: 100 }, (_, id) =>
      comment(id, `prefix${id} common${id} alpha${id}`));
    replaceIndexItems(index, INDEX_COMMENT_TYPE, original);

    const retained = original.slice(50).map((item, offset) => ({
      ...item,
      body: `<p>changed${offset + 50}</p>`,
    }));
    replaceIndexItems(index, INDEX_COMMENT_TYPE, retained);

    original.slice(0, 50).forEach((item) => {
      expect(getSearchResults(index, item.body)).toHaveLength(0);
    });
    await expect(index.vacuum({ batchSize: index.termCount + 1 })).resolves.toBeUndefined();
    expect(index.dirtCount).toBe(0);
    expect(getSearchResults(index, 'changed75').map(({ id }) => id)).toEqual(['75']);
  });
});
