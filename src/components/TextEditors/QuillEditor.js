/** A simple wrapper around the quill editor that passes props
 through, and sets up some of the options we'll always want
 **/
import React from 'react';
import PropTypes from 'prop-types';
import ReactQuill, { Quill } from 'react-quill';
import ImageResize from 'quill-image-resize-module-withfix';
import QuillS3ImageUploader from './QuillS3ImageUploader';
import 'react-quill/dist/quill.snow.css';
Quill.register('modules/s3Upload', QuillS3ImageUploader);
Quill.register('modules/imageResize', ImageResize);


function QuillEditor(props) {

  const { marketId, readOnly, onS3Upload, defaultValue, onChange, placeholder } = props;
  console.log(props);
  // neccesary in order to make quill happy to have multiple editors open
  const randToolbarNum = Math.floor(Math.random() * Math.floor(200000));
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
    imageResize: {
      modules: ['Resize', 'DisplaySize', 'Toolbar'],
    },
    s3Upload: {
      marketId,
      onS3Upload,
    },

  };
  const usedModules = { ...modules };

  // wipe the toolbar if read only
  if (readOnly) {
    usedModules.toolbar = false;
    usedModules.s3Upload = false;
    usedModules.imageResize = false;
  }
  return (
    <ReactQuill modules={usedModules}
                placeholder={placeholder}
                defaultValue={defaultValue}
                onChange={onChange}
                readOnly={readOnly}
    />
  );
}

QuillEditor.propTypes = {
  marketId: PropTypes.string.isRequired,
  readOnly: PropTypes.bool,
  onS3Upload: PropTypes.func,
  defaultValue: PropTypes.string,
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
};

QuillEditor.defaultProps = {
  readOnly: true,
  onS3Upload: () => {},
  onChange: () => {},
  defaultValue: '',
  placeholder: '',
};

export default QuillEditor;
