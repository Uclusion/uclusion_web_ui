/**
 Wrapper to stick in the I18n tree to capture the react-intl prop and expose it to javascript
 code that is NOT a react component and hence cant use injectIntl
 * */

import { useContext } from 'react';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext';

export let setOperationInProgress = null;

function OperationInProgressGlobalProvider(props) {
  const { children } = props;
  const [, setOpInProgress] = useContext(OperationInProgressContext);
  setOperationInProgress = setOpInProgress;
  return children;
}

export default OperationInProgressGlobalProvider;