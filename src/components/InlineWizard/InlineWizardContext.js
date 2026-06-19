import { createContext, useContext } from 'react';

/**
 * J-all-325: contexts for wizards that open inside their container instead of on the full-screen
 * /wizard route. Kept in a leaf module (no wizard imports) so the consumers - WizardStepButtons and
 * InlineWizardHost - don't form an import cycle.
 */

// Supplied at the screen level so launch sites (buttons, hotkeys, the job nav) can open a wizard
// without navigating. Value: { openInlineWizard(descriptor), inlineWizard }.
export const InlineWizardLaunchContext = createContext({});
// Supplied by InlineWizardHost around the active wizard only, so its button row (WizardStepButtons)
// can offer a Cancel that returns the page to its normal display (T-all-2189). Value:
// { closeInlineWizard() }.
export const InlineWizardContext = createContext({});

export function useInlineWizardLaunch() {
  return useContext(InlineWizardLaunchContext);
}
