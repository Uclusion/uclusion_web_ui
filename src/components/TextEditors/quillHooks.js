import React from 'react';
import { registerListener } from '../../utils/MessageBusUtils';
import QuillEditor2 from './QuillEditor2';
import { resetEditor } from './Utilities/CoreUtils'

export function editorUpload (metadatas) {
  return {
    type: 'upload',
    metadatas,
  };
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


  function resetBinder (id) {
      return (contents, configOverrides) => {
        resetEditor(id, contents, configOverrides);
      }
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
  return [editor, resetBinder(name)];
}