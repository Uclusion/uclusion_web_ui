import { addByIdAndVersion } from './ContextUtils';

describe('addByIdAndVersion', () => {
  const openQuestion = { id: 'question-1', version: 1, resolved: false };
  const resolvedQuestion = { id: 'question-1', version: 2, resolved: true };

  it.each([
    ['old first', [openQuestion, resolvedQuestion]],
    ['new first', [resolvedQuestion, openQuestion]]
  ])('keeps the newest duplicate from a sync batch when it arrives %s', (_, batch) => {
    const result = addByIdAndVersion(batch, [openQuestion]);

    expect(result).toEqual([resolvedQuestion]);
  });

  it.each([
    ['old first', [openQuestion, resolvedQuestion]],
    ['new first', [resolvedQuestion, openQuestion]]
  ])('deduplicates a first sync batch when it arrives %s', (_, batch) => {
    const result = addByIdAndVersion(batch, []);

    expect(result).toEqual([resolvedQuestion]);
  });

  it.each([
    ['old first', [openQuestion, resolvedQuestion]],
    ['new first', [resolvedQuestion, openQuestion]]
  ])('does not regress a newer stored item when the batch arrives %s', (_, batch) => {
    const newestStored = { ...resolvedQuestion, version: 3 };
    const result = addByIdAndVersion(batch, [newestStored]);

    expect(result).toEqual([newestStored]);
  });
});
