import { deleteOrDehilightMessages, shouldRemoveMessage } from './users';
import { getMarketClient } from './marketLogin';
import { removeWorkListItem } from '../pages/Home/YourWork/WorkListItem';

jest.mock('./marketLogin', () => ({ getMarketClient: jest.fn() }));
jest.mock('../pages/Home/YourWork/WorkListItem', () => ({ removeWorkListItem: jest.fn() }));

describe('shouldRemoveMessage', () => {
  it('removes ordinary unread notifications', () => {
    expect(shouldRemoveMessage({ type_object_id: 'UNREAD_REPLY_comment-id' })).toBe(true);
  });

  it('removes AI-generated persistent notifications only for a job sweep', () => {
    const message = {
      type_object_id: 'REVIEW_REQUIRED_job-id',
      alert_type: 'AI_GENERATED',
    };

    expect(shouldRemoveMessage(message)).toBe(false);
    expect(shouldRemoveMessage(message, false, true)).toBe(true);
  });

  it('keeps human-originated persistent notifications protected during a job sweep', () => {
    const message = {
      type_object_id: 'REVIEW_REQUIRED_job-id',
      alert_type: 'REQUIRED_APPROVER',
    };

    expect(shouldRemoveMessage(message, false, true)).toBe(false);
  });

  it('only dehighlights when highlight-only behavior is requested', () => {
    const message = {
      type_object_id: 'UNREAD_REPLY_comment-id',
      alert_type: 'AI_GENERATED',
    };

    expect(shouldRemoveMessage(message, true, true)).toBe(false);
  });

  it('passes the scoped dismissal intent while optimistically removing eligible rows', async () => {
    const removeNotifications = jest.fn().mockResolvedValue(true);
    getMarketClient.mockResolvedValue({ users: { removeNotifications } });
    const message = {
      market_id: 'planning-market',
      type_object_id: 'REVIEW_REQUIRED_job-id',
      alert_type: 'AI_GENERATED',
    };

    await deleteOrDehilightMessages([message], jest.fn(), true, false, true);

    expect(removeWorkListItem).toHaveBeenCalledWith(message, expect.any(Function), undefined, true);
    expect(removeNotifications).toHaveBeenCalledWith(['REVIEW_REQUIRED_job-id'], true);
  });
});
