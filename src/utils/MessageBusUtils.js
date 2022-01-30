import { Hub } from '@aws-amplify/core';
const busListeners = {};

/** Adds a listener to under the UNIQUE name, to the channel
 * If a listener with the name already exists, it will be removed
 * before this one is added
 * @param channel
 * @param name
 * @param callback
 */
export function registerListener(channel, name, callback) {
  const previousListener = busListeners[name];
  if (!!previousListener) {
    Hub.remove(channel, previousListener);
  }
  busListeners[name] = callback;
  Hub.listen(channel, busListeners[name]);
}

export function hasListener(channel, name){
  const previousListener = busListeners[name];
  return !!previousListener;
}

/**
 * Removes a listener with the UNIQUE name, from the channel.
 * @param channel
 * @param name
 */
export function removeListener(channel, name) {
  const listener = busListeners[name];
  if (!!listener) {
    Hub.remove(channel, listener);
  }
}

/**
 * Pushes a message out ot the listeners of the channel
 * @param channel
 * @param message
 */
export function pushMessage(channel, message) {
  Hub.dispatch(channel, message);
}