import { withSpinLock } from './SpinBlockingHOC';
import { Button } from '@material-ui/core';

const SpinBlockingButton = withSpinLock(Button);
export default SpinBlockingButton;

