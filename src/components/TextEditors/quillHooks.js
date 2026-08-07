import React, { useEffect, useRef } from 'react';
import { registerListener } from '../../utils/MessageBusUtils';
import QuillEditor2 from './QuillEditor2';
import { focusEditorOnArrival, resetEditor } from './Utilities/CoreUtils';

// T-all-2448: shared instance so editor specs don't hand QuillEditor2 a fresh array
// every render, which defeats its React.memo
export const HASH_MENTION_CHARS = ['#'];

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
    mentionDenotationChars,
    className,
    onChange,
    onImageDeletion,
    buttons,
    autoFocus,
    maxHeight
  } = spec;

  useEffect(() => {
    if (autoFocus) {
      // B-all-535: retrying arrival focus - the one-shot version missed when the editor
      // registered after this effect or was recreated just after focusing
      focusEditorOnArrival(name);
    }
    return () => {};
  }, [autoFocus, name]);

  // T-all-2448: registering during render did a Hub remove/listen pair on every render while
  // typing; the ref keeps the latest handlers visible to one stable listener per editor name
  const handlersRef = useRef();
  handlersRef.current = { onUpload, onChange, onImageDeletion };
  useEffect(() => {
    registerListener(`editor-${name}`, `${name}-controller`, (message) => {
      const { type, newUploads, contents } = message.payload;
      const { onUpload, onChange, onImageDeletion } = handlersRef.current;
      switch (type) {
        case 'uploads':
          if (onUpload) {
            return onUpload(newUploads);
          }
          break;
        case 'change':
          if (onChange) {
            return onChange(contents);
          }
          break;
        case 'image-deletion':
          if (onImageDeletion) {
            return onImageDeletion(contents)
          }
          break;
        default:
        // do nothing;
      }
    });
    return () => {};
  }, [name]);


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
      mentionDenotationChars={mentionDenotationChars}
      uploadDisabled={uploadDisabled}
      simple={simple}
      noToolbar={noToolbar}
      buttons={buttons}
      maxHeight={maxHeight}
    />
  );
  return [editor, resetBinder(name)];
}