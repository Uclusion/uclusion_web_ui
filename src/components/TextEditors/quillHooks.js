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

export function editorFocus () {
  return {
    type: 'focus'
  };
}

export function useEditor (name, spec) {

  const {
    cssId,
    value,
    marketId,
    onChange,
    onUpload,
    placeholder,
    uploadDisabled,
    participants,
    simple,
    noToolbar,
    mentionsAllowed,
    dontManageState,
    className,
    children
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
      dontManageState={dontManageState}
    >
      {children}
    </QuillEditor2>
  );
  return [editor, editorController];
}