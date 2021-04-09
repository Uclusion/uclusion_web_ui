import React from 'react';
import { pushMessage, registerListener } from '../../utils/MessageBusUtils';
import QuillEditor2 from './QuillEditor2';

export function editorReset () {
  return {
    type: 'reset'
  };
}

export function editorUpdate (contents) {
  return {
    type: 'update',
    contents
  };
}

export function useEditor (name, spec) {

  const {
    value,
    marketId,
    onChange,
    onUpload,
    placeholder,
    getUrlName,
    uploadDisabled,
    participants,
    simple,
    noToolbar,
    mentionsAllowed,
  } = spec;

  const controlChannel = `editor-${name}-control-plane`;

  registerListener(`editor-${name}`, `${name}-controller`, (message) => {
    const { type, newUploads, contents } = message.payload;
    switch (type) {
      case 'uploads':
        if (onUpload) {
          return onUpload(newUploads);
        }
        break;
      case 'update':
        if (onChange) {
          return onChange(contents);
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
      marketId={marketId}
      value={value}
      placeholder={placeholder}
      getUrlName={getUrlName}
      participants={participants}
      mentionsAllowed={mentionsAllowed}
      uploadDisabled={uploadDisabled}
      simple={simple}
      noToolbar={noToolbar}
      />
  );
  return [editor, editorController];
}