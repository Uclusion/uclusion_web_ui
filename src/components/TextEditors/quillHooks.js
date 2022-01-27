import React from 'react';
import { pushMessage, registerListener } from '../../utils/MessageBusUtils';
import QuillEditor2 from './QuillEditor2';

export function editorReset (contents) {
  return {
    type: 'reset',
    contents
  };
}

export function editorRecreate (newId, contents, myLayout) {
  return {
    type: 'recreate',
    newId,
    contents,
    myLayout
  }
}

/**
 * Used by the editor to recieve an update, and to send to a listening reducer that an update has happened
 * @param contents
 * @returns {{contents, type: string}}
 */
export function editorUpdate (contents) {
  return {
    type: 'update',
    contents
  };
}

export function editorUpload (metadatas) {
  return {
    type: 'upload',
    metadatas,
  };
}

export function editorFocus () {
  return {
    type: 'focus'
  };
}

export function getControlPlaneName(editorName) {
  return `editor-${editorName}-control-plane`;
}

export function useEditor (name, spec) {

  const {
    cssId,
    value,
    marketId,
    onUpload,
    placeholder,
    uploadDisabled,
    participants,
    simple,
    noToolbar,
    mentionsAllowed,
    className,
  } = spec;
  const controlChannel = getControlPlaneName(name);

  registerListener(`editor-${name}`, `${name}-controller`, (message) => {
    const { type, newUploads } = message.payload;
    switch (type) {
      case 'uploads':
        if (onUpload) {
          return onUpload(newUploads);
        }
        break;
      default:
      // do nothing;
    }
  });


  function editorController (message) {
      pushMessage(controlChannel, message);
  }

  const editor = (
    <QuillEditor2
      id={name}
      cssId={cssId}
      className={className}
      marketId={marketId}
      value={value}
      placeholder={placeholder}
      participants={participants}
      mentionsAllowed={mentionsAllowed}
      uploadDisabled={uploadDisabled}
      simple={simple}
      noToolbar={noToolbar}
    />
  );
  return [editor, editorController];
}