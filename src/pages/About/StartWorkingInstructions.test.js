import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import StartWorkingInstructions from './StartWorkingInstructions';

jest.mock('./installUtils', () => ({
  getUclusionEnvironment: () => 'stage',
}));

const previousActEnvironment = window.IS_REACT_ACT_ENVIRONMENT;

describe('StartWorkingInstructions', () => {
  let container;
  let root;

  beforeAll(() => {
    window.IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterAll(() => {
    window.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
  });

  beforeEach(() => {
    container = document.createElement('div');
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
  });

  it('explains fresh-session loading and one-time onboarding', () => {
    act(() => root.render(<StartWorkingInstructions />));
    const content = container.textContent.split(/\s+/).join(' ');

    expect(content).toContain('uclusion -e stage codex');
    expect(content).toContain('MCP reconnect alone is insufficient');
    expect(content).toContain('first AI session');
    expect(content).toContain('served only once');
    expect(content).toContain(
      'Your find work list is empty—would you like instructions for adding and working on a job?'
    );
  });
});
