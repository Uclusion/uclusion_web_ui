import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { EditCommentContext } from '../../../contexts/EditCommentContext/EditCommentContext';
import ReviewNoteStep from './ReviewNoteStep';

const mockJobDescription = jest.fn(() => null);
const mockWizardStepButtons = jest.fn(() => null);

jest.mock('../JobDescription', () => (props) => mockJobDescription(props));
jest.mock('../WizardStepButtons', () => (props) => mockWizardStepButtons(props));
jest.mock('../WizardStepContainer', () => (props) => props.children);
jest.mock('../WizardStylesContext', () => ({
  wizardStyles: () => ({
    introText: 'introText',
    introSubText: 'introSubText',
    borderBottom: 'borderBottom'
  })
}));

function renderReviewNote({ dispatch = jest.fn(), openEditComment = jest.fn() } = {}) {
  const note = {
    id: 'note-id',
    group_id: 'group-id',
    comment_type: 'REPORT',
    body: '<p>AI-maintained guidance</p>',
    is_sent: true
  };
  const reply = {
    id: 'reply-id',
    root_comment_id: note.id,
    reply_id: note.id,
    group_id: note.group_id,
    comment_type: 'REPLY',
    is_sent: true
  };
  const message = {
    type: 'UNREAD_COMMENT',
    type_object_id: 'UNREAD_COMMENT_note-id'
  };

  ReactDOMServer.renderToStaticMarkup(
    <IntlProvider locale="en" messages={{
      ReviewAINoteTitle: 'Review AI note?',
      ReviewAINoteExplanation: 'Review this note.'
    }}>
      <MemoryRouter>
        <CommentsContext.Provider value={[{ 'market-id': [note, reply] }, jest.fn()]}>
          <NotificationsContext.Provider value={[{}, dispatch]}>
            <EditCommentContext.Provider value={{ openEditComment }}>
              <ReviewNoteStep marketId="market-id" commentId={note.id} message={message}
                              formData={{ useCompression: true }}/>
            </EditCommentContext.Provider>
          </NotificationsContext.Provider>
        </CommentsContext.Provider>
      </MemoryRouter>
    </IntlProvider>
  );

  return { dispatch, message, note, openEditComment, reply };
}

describe('ReviewNoteStep', () => {
  beforeEach(() => {
    mockJobDescription.mockClear();
    mockWizardStepButtons.mockClear();
    window.scrollTo = jest.fn();
  });

  it('shows the note thread using the shared inbox comment navigation', () => {
    const { note, reply } = renderReviewNote();

    expect(mockJobDescription).toHaveBeenCalledWith(expect.objectContaining({
      marketId: 'market-id',
      comments: [note, reply],
      removeActions: true,
      useCompression: true,
      inboxMessageId: note.id
    }));
  });

  it('offers edit note as the primary action and dismiss as the alternative', () => {
    const result = renderReviewNote();
    const buttons = mockWizardStepButtons.mock.calls[0][0];

    expect(buttons).toEqual(expect.objectContaining({
      nextLabel: 'editNote',
      nextShowEdit: true,
      showTerminate: true,
      terminateLabel: 'notificationDismiss'
    }));

    buttons.onNext();

    expect(result.openEditComment).toHaveBeenCalledWith('market-id', 'note-id');
    expect(result.dispatch).toHaveBeenCalledWith({
      type: 'REMOVE_MESSAGES',
      messages: ['UNREAD_COMMENT_note-id']
    });
    expect(result.openEditComment.mock.invocationCallOrder[0])
      .toBeLessThan(result.dispatch.mock.invocationCallOrder[0]);
  });

  it('dismisses without opening the editor', () => {
    const result = renderReviewNote();
    const buttons = mockWizardStepButtons.mock.calls[0][0];

    buttons.onFinish();

    expect(result.openEditComment).not.toHaveBeenCalled();
    expect(result.dispatch).toHaveBeenCalledWith({
      type: 'REMOVE_MESSAGES',
      messages: ['UNREAD_COMMENT_note-id']
    });
  });
});
