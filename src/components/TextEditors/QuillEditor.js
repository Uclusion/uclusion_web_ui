/** A simple wrapper around the quill editor that passes props
 through, and sets up some of the options we'll always want
 **/
import React from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { uploadFileToS3 } from '../../api/files';

function QuillEditor(props) {

  const { marketId } = props;

  const uploadHandler = (range, files) => {
    const uploadPromises = files.forEach((file ) => {
      return uploadFileToS3(marketId, file)
        .then((metadata) => {

        })
    })
  };

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
    uploader: {
      handler:
    }

  };

  return (
    <ReactQuill modules={modules} {...props} />
  );
}

export default QuillEditor;