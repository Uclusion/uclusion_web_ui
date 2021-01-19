import { filterMessagesToLevel } from '../../utils/messageUtils';

export function levelMessages(state, level) {
  const { messages } = state;
  return filterMessagesToLevel(level, messages);
}
