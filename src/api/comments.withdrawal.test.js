import { Investibles } from 'uclusion_sdk/src/components/investibles';
import { getMarketClient } from './marketLogin';
import { resolveComment } from './comments';

jest.mock('./marketLogin', () => ({ getMarketClient: jest.fn() }));

it.each([false, true])('sends the explicit withdrawal choice through the SDK: %s', async (withdraw) => {
  const resolved = { id: 'question', resolved: true, delegated: !withdraw };
  const doPatch = jest.fn().mockResolvedValue({ data: resolved });
  getMarketClient.mockResolvedValue({ investibles: new Investibles({ doPatch }) });

  await expect(resolveComment('workspace', 'question', withdraw)).resolves.toEqual(resolved);
  expect(doPatch).toHaveBeenCalledWith('investibles', 'comment/question', undefined, {
    is_resolved: true,
    uploaded_files: [],
    ...(withdraw ? { withdraw: true } : {}),
  });
});
