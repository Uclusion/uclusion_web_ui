import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router';
import messages from '../../../config/locales/en';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { GroupMembersContext } from '../../../contexts/GroupMembersContext/GroupMembersContext';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import JobDescriptionStep from './JobDescriptionStep';

const mockChoicePills = jest.fn(() => null);
const mockUseHotkeys = jest.fn();
const mockUpdateFormData = jest.fn();

jest.mock('../../Buttons/ChoicePills', () => (props) => mockChoicePills(props));
jest.mock('../WizardStepButtons', () => () => null);
jest.mock('../WizardStepContainer', () => (props) => props.children);
jest.mock('../WizardStylesContext', () => {
  const React = require('react');
  return {
    WizardStylesContext: React.createContext({
      introText: 'introText',
      introSubText: 'introSubText',
      borderBottom: 'borderBottom',
    }),
  };
});
jest.mock('../../TextEditors/quillHooks', () => ({
  HASH_MENTION_CHARS: ['#'],
  useEditor: () => [null],
}));
jest.mock('../../TextEditors/Utilities/CoreUtils', () => ({
  editorEmpty: () => true,
  focusEditor: jest.fn(),
  getQuillStoredState: jest.fn(),
  resetEditor: jest.fn(),
  storeState: jest.fn(),
}));
jest.mock('../../TextFields/NamePreviewBar', () => ({
  __esModule: true,
  default: () => null,
  useNamePreview: () => ({
    name: '',
    updateName: jest.fn(),
    refreshName: jest.fn(),
  }),
}));
jest.mock('react-hotkeys-hook', () => ({
  useHotkeys: (...args) => mockUseHotkeys(...args),
}));

function renderStep(jobType, showImmediate = true) {
  const dispatch = jest.fn();
  const presences = showImmediate ? [{ id: 'me' }, { id: 'collaborator' }] : [{ id: 'me' }];
  const groupMembers = showImmediate ? [{ id: 'me' }] : [];
  const step = (
    <MemoryRouter>
      <IntlProvider locale="en" messages={messages}>
        <MarketStagesContext.Provider value={[{}, dispatch]}>
          <CommentsContext.Provider value={[{}, dispatch]}>
            <GroupMembersContext.Provider value={[{ view: groupMembers }, dispatch]}>
              <InvestiblesContext.Provider value={[{}, dispatch]}>
                <JobDescriptionStep
                  marketId="market"
                  groupId="view"
                  roots={[]}
                  formData={{}}
                  jobType={jobType}
                  updateFormData={mockUpdateFormData}
                  isSingleUser={!showImmediate}
                  myPresenceId="me"
                  presences={presences}
                />
              </InvestiblesContext.Provider>
            </GroupMembersContext.Provider>
          </CommentsContext.Provider>
        </MarketStagesContext.Provider>
      </IntlProvider>
    </MemoryRouter>
  );
  ReactDOMServer.renderToStaticMarkup(step);
  return mockChoicePills.mock.calls.at(-1)[0];
}

describe('JobDescriptionStep job type choices', () => {
  beforeEach(() => {
    mockChoicePills.mockClear();
    mockUseHotkeys.mockClear();
    mockUpdateFormData.mockClear();
  });

  it('puts Approvable first and selects it for the generic Add Job flow', () => {
    const choices = renderStep();

    expect(choices.options.map(({ value }) => value)).toEqual([
      'APPROVABLE',
      'IMMEDIATE',
      'READY',
      'NOT_READY',
    ]);
    expect(choices.value).toBe('APPROVABLE');
    expect(mockUseHotkeys.mock.calls.slice(0, 2).map(([keys]) => keys)).toEqual([
      'ctrl+alt+1',
      'ctrl+alt+2',
    ]);
    mockUseHotkeys.mock.calls[0][1]();
    expect(mockUpdateFormData).toHaveBeenLastCalledWith({ newQuantity: 'APPROVABLE' });
    mockUseHotkeys.mock.calls[1][1]();
    expect(mockUpdateFormData).toHaveBeenLastCalledWith({ newQuantity: 'IMMEDIATE' });
    expect(choices.options.slice(0, 2).map(({ tooltip }) => tooltip)).toEqual([
      'assign for approval (ctrl+alt+1)',
      'assign (ctrl+alt+2)',
    ]);
  });

  it('preserves Ready and Not Ready defaults for backlog launches', () => {
    expect(renderStep(0).value).toBe('READY');
    expect(renderStep('1').value).toBe('NOT_READY');
  });

  it('keeps shortcuts positional when Immediate is unavailable', () => {
    const choices = renderStep(undefined, false);

    expect(choices.options.map(({ value }) => value)).toEqual([
      'APPROVABLE',
      'READY',
      'NOT_READY',
    ]);
    expect(choices.options.map(({ tooltip }) => tooltip)).toEqual([
      expect.stringContaining('(ctrl+alt+1)'),
      expect.stringContaining('(ctrl+alt+2)'),
      expect.stringContaining('(ctrl+alt+3)'),
    ]);
    mockUseHotkeys.mock.calls.slice(0, 3).forEach(([, callback]) => callback());
    expect(mockUpdateFormData.mock.calls.map(([value]) => value.newQuantity)).toEqual([
      'APPROVABLE',
      'READY',
      'NOT_READY',
    ]);
    expect(mockUseHotkeys.mock.calls[3][2]).toEqual(expect.objectContaining({ enabled: false }));
    expect(mockUseHotkeys.mock.calls.map(([, , , dependencies]) => dependencies)).toEqual([
      [false],
      [false],
      [false],
      [false],
    ]);
  });
});
