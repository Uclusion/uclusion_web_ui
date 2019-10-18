/** A simple wrapper around the quill editor that passes props
 through, and sets up some of the options we'll always want
 **/
import React from 'react';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { getS3FileUrl, uploadFileToS3 } from '../../api/files';
import Delta from 'quill-delta';

function QuillEditor(props) {

  const { marketId, readOnly } = props;

/*  const uploadHandler = (range, files) => {
    const uploadPromises = files.forEach((file ) => {
      return uploadFileToS3(marketId, file)
        .then((metadata) => {
          return getS3FileUrl(metadata);
        })
    });
    Promise.all(uploadPromises).then(images => {
      const update = images.reduce((delta, image) => {
        return delta.insert({ image });
      }, new Delta().retain(range.index).delete(range.length));
      this.quill.updateContents(update, Quill.sources.USER);
      this.quill.setSelection(
        range.index + images.length,
        Quill.sources.SILENT,
      );
    });
  }; */

  const modules = {
    toolbar: [
      [{ font: [] }],
      [{ header: [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike', { script: 'sub' }, { script: 'super' }],
      [{ color: [] }, { background: [] }],
      [ { align: []}],
      [{ list: 'ordered'}, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
      ['link', 'code-block', 'image', 'video', 'formula'],
      ['clean'],
    ],
 //   uploader: {
 //     handler: uploadHandler,
 //   }
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
    <ReactQuill { ...passedProps } />
  );
}

export default QuillEditor;