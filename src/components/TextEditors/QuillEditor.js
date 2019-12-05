/** A simple wrapper around the quill editor that passes props
 through, and sets up some of the options we'll always want
 **/
import React from 'react';
import PropTypes from 'prop-types';
import Quill from 'quill';
import ImageResize from 'quill-image-resize-module-withfix';
import QuillS3ImageUploader from './QuillS3ImageUploader';
import QuillTableUI from 'quill-table-ui';
import 'quill/dist/quill.snow.css';
import 'quill-table-ui/dist/index.css';

import { withTheme } from '@material-ui/core';
import _ from 'lodash';

Quill.register('modules/tableUI', QuillTableUI);
Quill.register('modules/s3Upload', QuillS3ImageUploader);
Quill.register('modules/imageResize', ImageResize);

// code derived from https://github.com/quilljs/quill/issues/1447
class QuillEditor extends React.PureComponent {

  editor;

  uploadLessToolbar = [
    [{ font: [] }],
    [{ header: [1, 2, false] }],
    ['bold', 'italic', 'underline', 'strike', { script: 'sub' }, { script: 'super' }],
    [{ color: [] }, { background: [] }],
    [{ align: [] }],
    [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
    ['link', 'code-block'],
    ['table'],
    ['clean'],
  ];

  simplifiedToolBar = [
    ['bold', 'italic', 'underline', 'strike'],
    ['link', 'code-block'],
    ['clean'],
  ];

  constructor(props) {
    super(props);
    this.state = { uploads: [] };
    this.editorBox = React.createRef();
    this.editorContainer = React.createRef();
    const { marketId, readOnly, placeholder, uploadDisabled, simple } = props;
    const defaultModules = {
      toolbar: [
        [{ font: [] }],
        [{ header: [1, 2, false] }],
        ['bold', 'italic', 'underline', 'strike', { script: 'sub' }, { script: 'super' }],
        [{ color: [] }, { background: [] }],
        [{ align: [] }],
        [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
        ['link', 'code-block', 'image', 'video'],
        ['table'],
        ['clean'],
      ],
      imageResize: {
        modules: ['Resize', 'DisplaySize', 'Toolbar'],
      },
      s3Upload: {
        marketId,
        onS3Upload: this.statefulUpload.bind(this),
      },
      table: true,
      tableUI: true,
    };
    this.modules = { ...defaultModules };
    if (simple) {
      this.modules.toolbar = this.simplifiedToolBar;
      this.modules.s3Upload = false;
      this.modules.imageResize = false;
    }
    if (uploadDisabled && !simple) {
      this.modules.toolbar = this.uploadLessToolbar;
      this.modules.s3Upload = false;
      this.modules.imageResize = false;
    }
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
    const usedValue = value || defaultValue;
    this.editorBox.current.innerHTML = usedValue;
    this.editor = new Quill(this.editorBox.current, this.options);
    const debouncedOnChange = _.debounce((delta) => {
      const contents = this.editor.root.innerHTML;
      onChange(contents, delta);
    }, 50);
    this.disableToolbarTabs(this.editorContainer.current);
    this.editor.on('text-change', debouncedOnChange);
  }

  disableToolbarTabs(editorNode) {
    const toolbarButtons = editorNode.querySelectorAll('.ql-toolbar *');
    toolbarButtons.forEach((button) => {
      button.tabIndex = -1;
    });
  }

  statefulUpload(metadatas) {
    const { uploads } = this.state;
    const newUploads = [...uploads, ...metadatas];
    this.setState({ uploads: newUploads });
    const { onS3Upload } = this.props;
    if (onS3Upload) {
      onS3Upload(newUploads);
    }
  }

  render() {
    const { theme, readOnly } = this.props;
    const editorStyle = {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize,
    };
    const readOnlyStyle = {
      ...editorStyle,
      border: 0,
    };

    return (
      <div ref={this.editorContainer}>
        <div ref={this.editorBox} style={readOnly? readOnlyStyle: editorStyle} />
      </div>
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
  uploadDisabled: PropTypes.bool,
};

QuillEditor.defaultProps = {
  readOnly: false,
  onS3Upload: () => {
  },
  onChange: () => {
  },
  defaultValue: '',
  placeholder: '',
  marketId: undefined,
  value: '',
  uploadDisabled: false,
};

export default withTheme(QuillEditor);
