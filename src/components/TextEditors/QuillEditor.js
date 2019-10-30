/** A simple wrapper around the quill editor that passes props
 through, and sets up some of the options we'll always want
 **/
import React from 'react';
import PropTypes from 'prop-types';
import Quill from 'quill';
import ImageResize from 'quill-image-resize-module-withfix';
import QuillS3ImageUploader from './QuillS3ImageUploader';
import 'quill/dist/quill.snow.css';
import { withTheme } from '@material-ui/core';
import _ from 'lodash';
Quill.register('modules/s3Upload', QuillS3ImageUploader);
Quill.register('modules/imageResize', ImageResize);

// code derived from https://github.com/quilljs/quill/issues/1447
class QuillEditor extends React.PureComponent {

  editor;

  constructor(props){
    super(props);
    this.state = { uploads: [] };
    this.editorRef = React.createRef();
    const { marketId, readOnly, placeholder } = props;
    const defaultModules = {
      toolbar: [
        [{ font: [] }],
        [{ header: [1, 2, false] }],
        ['bold', 'italic', 'underline', 'strike', { script: 'sub' }, { script: 'super' }],
        [{ color: [] }, { background: [] }],
        [{ align: [] }],
        [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
        ['link', 'code-block', 'image', 'video'],
        ['clean'],
      ],
      imageResize: {
        modules: ['Resize', 'DisplaySize', 'Toolbar'],
      },
      s3Upload: {
        marketId,
        onS3Upload: this.statefulUpload.bind(this),
      },
    };
    this.modules = { ...defaultModules };
    // wipe the toolbar if read only
    if (readOnly) {
      this.modules.toolbar = false;
      this.modules.s3Upload = false;
      this.modules.imageResize = false;
    }
    this.options = {
      modules: this.modules,
      placeholder,
      readOnly,
      theme: 'snow',
    };

  }

  componentDidMount() {
    const { defaultValue, onChange, value } = this.props;
    this.editor = new Quill(this.editorRef.current, this.options);
    this.editor.root.innerHTML = value || defaultValue;
    const debouncedOnChange = _.debounce((delta) => {
      const contents = this.editor.root.innerHTML;
      onChange(contents, delta);
    }, 50);
    this.editor.on('text-change', debouncedOnChange);
  }

  statefulUpload(metadatas) {
    const { uploads } = this.state;
    const newUploads = [...uploads, ...metadatas];
    this.setState({uploads: newUploads});
    const { onS3Upload } = this.props;
    if (onS3Upload) {
      onS3Upload(newUploads);
    }
  }

  render() {
    const { readOnly, value, defaultValue, theme } = this.props;
    if (this.editor && (readOnly || value)) {
      this.editor.root.innerHTML = value || defaultValue;
    }
    const myStyle = {
        fontSize: theme.typography.fontSize,
    };
    return (
        <div ref={this.editorRef} style={myStyle}/>
    );
  }
}

QuillEditor.propTypes = {
  marketId: PropTypes.string,
  readOnly: PropTypes.bool,
  onS3Upload: PropTypes.func,
  defaultValue: PropTypes.string,
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  value: PropTypes.string,
};

QuillEditor.defaultProps = {
  readOnly: false,
  onS3Upload: () => {},
  onChange: () => {},
  defaultValue: '',
  placeholder: '',
  marketId: undefined,
};

export default withTheme(QuillEditor);
