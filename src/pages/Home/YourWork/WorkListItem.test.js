import { removeWorkListItem } from './WorkListItem';

describe('removeWorkListItem', () => {
  it('force-deletes a persistent notification during an authorized AI-generated sweep', () => {
    const messagesDispatch = jest.fn();

    removeWorkListItem(
      { type_object_id: 'REVIEW_REQUIRED_job-id' },
      messagesDispatch,
      undefined,
      true
    );

    expect(messagesDispatch).toHaveBeenCalledWith({
      type: 'REMOVE_MESSAGES',
      messages: ['REVIEW_REQUIRED_job-id'],
    });
  });

  it('continues to dehighlight ordinary persistent notifications', () => {
    const messagesDispatch = jest.fn();

    removeWorkListItem(
      { type_object_id: 'REVIEW_REQUIRED_job-id' },
      messagesDispatch
    );

    expect(messagesDispatch).toHaveBeenCalledWith({
      type: 'DEHIGHLIGHT_MESSAGES',
      messages: ['REVIEW_REQUIRED_job-id'],
      isPromise: false,
    });
  });
});
