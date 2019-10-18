/** A simple wrapper around the quill editor that passes props
 through, and sets up some of the options we'll always want
 **/
import React from 'react';
import ReactQuill, { Quill } from 'react-quill';
import ImageResize from 'quill-image-resize-module-withfix';
import { ImageDrop } from 'quill-image-drop-module';
import QuillS3ImageUploader from './QuillS3ImageUploader';
import 'react-quill/dist/quill.snow.css';
Quill.register('modules/s3Upload', QuillS3ImageUploader);
Quill.register('modules/imageResize', ImageResize);
Quill.register('modules/imageDrop', ImageDrop);

function QuillEditor(props) {


  const { marketId, readOnly } = props;

  const modules = {
    toolbar: [
      [{ font: [] }],
      [{ header: [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike', { script: 'sub' }, { script: 'super' }],
      [{ color: [] }, { background: [] }],
      [{ align: [] }],
      [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
      ['link', 'code-block', 'image', 'video', 'formula'],
      ['clean'],
    ],
    s3Upload: {
      marketId,
    },
    imageResize: {
      modules: ['Resize', 'DisplaySize', 'Toolbar'],
    },
    imageDrop: true,
  };

  const passedProps = { ...props, modules };
  // wipe the toolbar if read only
  if (readOnly) {
    const { modules } = passedProps;
    const newModules = modules || {};
    newModules.toolbar = false;
    passedProps.modules = newModules;
  }
  return (
    <ReactQuill {...passedProps} />
  );
}

export default QuillEditor;
