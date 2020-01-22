/*
An api blocking button is one that calls and sets operation in progress, but is released when the api call is done.
It does _not_ require anything to exist in our stores
 */

import { withApiLock } from './ApiBlockingHOC';
import { Button } from '@material-ui/core';

const ApiBlockingButton = withApiLock(Button);
export default ApiBlockingButton;
