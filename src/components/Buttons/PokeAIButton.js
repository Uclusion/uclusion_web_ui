import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import TouchApp from '@material-ui/icons/TouchApp';
import { useIntl } from 'react-intl';
import { WebSocketContext } from '../../contexts/WebSocketContext';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext';
import { preventDefaultAndProp } from '../../utils/marketIdPathFunctions';
import { toastError } from '../../utils/userMessage';
import { ACTION_BUTTON_COLOR, DARK_ACTION_BUTTON_COLOR } from './ButtonConstants';
import SpinningIconLabelButton from './SpinningIconLabelButton';
import TooltipIconButton from './TooltipIconButton';
import {
  ISSUE_TYPE,
  QUESTION_TYPE,
  SUGGEST_CHANGE_TYPE,
  TODO_TYPE,
} from '../../constants/comments';

export function isPokeAICommentType(commentType) {
  return [ISSUE_TYPE, TODO_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE].includes(commentType);
}

export function getPokeAIMessage(ticketCode) {
  if (!ticketCode) {
    return undefined;
  }
  let decodedTicketCode = ticketCode;
  try {
    decodedTicketCode = decodeURI(ticketCode);
  } catch {
    // Preserve a malformed code rather than making the action disappear.
  }
  return `Start ${decodedTicketCode}`;
}

function PokeAIButton(props) {
  const {
    marketId,
    ticketCode,
    id,
    iconOnly = false,
    lightSurface = false,
    noAlign = false,
    useDark = false,
  } = props;
  const intl = useIntl();
  const { pokeAI } = useContext(WebSocketContext);
  const [operationRunning, setOperationRunning] = useContext(OperationInProgressContext);
  const message = getPokeAIMessage(ticketCode);
  if (!marketId || !message) {
    return null;
  }
  const jobTooltip = intl.formatMessage({ id: 'pokeAIJobTooltip' }, { command: message });
  const operationId = id || `pokeAI${ticketCode}`;

  function handlePoke(event) {
    preventDefaultAndProp(event);
    setOperationRunning(operationId);
    return Promise.resolve(pokeAI(marketId, message))
      .catch((error) => toastError(error, 'errorPokeAIFailed'))
      .finally(() => setOperationRunning(false));
  }

  if (iconOnly) {
    return (
      <TooltipIconButton
        id={operationId}
        lightSurface={lightSurface}
        disabled={operationRunning !== false}
        onClick={handlePoke}
        icon={<TouchApp fontSize="small" htmlColor={ACTION_BUTTON_COLOR} />}
        size="small"
        translationId="pokeAI"
        doFloatRight
        noAlign={noAlign}
      />
    );
  }

  return (
    <SpinningIconLabelButton
      aria-label={jobTooltip}
      id={operationId}
      icon={TouchApp}
      iconColor={useDark ? DARK_ACTION_BUTTON_COLOR : 'black'}
      doSpin={false}
      onClick={handlePoke}
      toolTipTitle={jobTooltip}
      useDark={useDark}
    >
      {intl.formatMessage({ id: 'pokeAI' })}
    </SpinningIconLabelButton>
  );
}

PokeAIButton.propTypes = {
  marketId: PropTypes.string.isRequired,
  ticketCode: PropTypes.string,
  id: PropTypes.string,
  iconOnly: PropTypes.bool,
  lightSurface: PropTypes.bool,
  noAlign: PropTypes.bool,
  useDark: PropTypes.bool,
};

export default PokeAIButton;
