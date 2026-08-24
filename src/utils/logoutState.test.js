import {
  clearSignedOut,
  getLogoutGeneration,
  isLogoutGenerationCurrent,
  isSignedOut,
  markSignedOut,
} from './logoutState';
import {
  getLoginPersistentItem,
  setLoginPersistentItem,
} from '../components/localStorageUtils';

jest.mock('../components/localStorageUtils', () => ({
  getLoginPersistentItem: jest.fn(),
  setLoginPersistentItem: jest.fn(),
}));

describe('login generation', () => {
  let generationNumber;
  let persistentState;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    generationNumber = 0;
    persistentState = {};
    getLoginPersistentItem.mockImplementation((key) => persistentState[key]);
    setLoginPersistentItem.mockImplementation((key, value) => {
      persistentState[key] = value;
    });
    Object.defineProperty(window, 'crypto', {
      configurable: true,
      value: {
        getRandomValues: jest.fn((values) => {
          generationNumber += 1;
          values.fill(generationNumber);
          return values;
        }),
      },
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('creates a fresh generation for each sign-in', () => {
    clearSignedOut();
    const firstGeneration = getLogoutGeneration();
    clearSignedOut();
    const secondGeneration = getLogoutGeneration();

    expect(firstGeneration).not.toBeNull();
    expect(secondGeneration).not.toBe(firstGeneration);
    expect(isLogoutGenerationCurrent(firstGeneration)).toBe(false);
    expect(isLogoutGenerationCurrent(secondGeneration)).toBe(true);
    expect(isSignedOut()).toBe(false);
  });

  it('keeps the signed-out marker behavior without replacing the login generation', () => {
    clearSignedOut();
    const loginGeneration = getLogoutGeneration();

    markSignedOut();

    expect(getLogoutGeneration()).toBe(loginGeneration);
    expect(isSignedOut()).toBe(true);
    expect(setLoginPersistentItem).toHaveBeenLastCalledWith('logout_marker', 'logged_out');
  });

  it('keeps a missing generation current for a restored legacy login until sign-in rotates it', () => {
    expect(getLogoutGeneration()).toBeNull();
    expect(isLogoutGenerationCurrent(null)).toBe(true);

    clearSignedOut();

    expect(getLogoutGeneration()).not.toBeNull();
    expect(isLogoutGenerationCurrent(null)).toBe(false);
  });

  it('uses a distinct fallback generation when browser crypto is unavailable', () => {
    Object.defineProperty(window, 'crypto', {
      configurable: true,
      value: undefined,
    });
    jest.spyOn(Date, 'now').mockReturnValueOnce(100).mockReturnValueOnce(101);
    jest.spyOn(Math, 'random').mockReturnValueOnce(0.25).mockReturnValueOnce(0.5);

    clearSignedOut();
    const firstGeneration = getLogoutGeneration();
    clearSignedOut();

    expect(firstGeneration).toBe('100-0.25');
    expect(getLogoutGeneration()).toBe('101-0.5');
  });
});
