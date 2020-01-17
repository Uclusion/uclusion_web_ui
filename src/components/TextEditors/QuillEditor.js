/** A simple wrapper around the quill editor that passes props
 through, and sets up some of the options we'll always want
 **/
import React from 'react';
import PropTypes from 'prop-types';
import Quill from 'quill';
import LoadingOverlay from 'react-loading-overlay';
import ImageResize from 'quill-image-resize-module-withfix';
import QuillS3ImageUploader from './QuillS3ImageUploader';
import QuillTableUI from 'quill-table-ui';
import 'quill/dist/quill.snow.css';
import 'quill-table-ui/dist/index.css';

import { injectIntl } from 'react-intl';
import { withTheme } from '@material-ui/core';
import _ from 'lodash';

Quill.register('modules/tableUI', QuillTableUI);
Quill.register('modules/s3Upload', QuillS3ImageUploader);
Quill.register('modules/imageResize', ImageResize);

function editorEmpty(contents) {
  if (contents.length === 0) {
    return true;
  }
  if (contents === '<p></p>') {
    return true;
  }
  if (contents === '<p><br></p>') {
    return true;
  }
  return false;
}


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
    this.state = { uploads: [], uploadInProgress: false };
    this.editorBox = React.createRef();
    this.editorContainer = React.createRef();
    const {
      marketId,
      placeholder,
      uploadDisabled,
      noToolbar,
      simple,
      setOperationInProgress,
    } = props;
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
        onUploadStart: () => {
          this.setUploadInProgress(true);
          setOperationInProgress(true);
        },
        onUploadStop: () => {
          this.setUploadInProgress(false);
          setOperationInProgress(false);
        },
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
    if (noToolbar) {
      this.modules.toolbar = null;
    }
    this.options = {
      modules: this.modules,
      placeholder,
      readOnly: false,
      theme: 'snow',
    };

  }

  componentDidMount() {
    const { defaultValue, onChange, onStoreChange } = this.props;
    this.editorBox.current.innerHTML = defaultValue;
    this.editor = new Quill(this.editorBox.current, this.options);
    const debouncedOnChange = _.debounce((delta) => {
      const contents = this.editor.root.innerHTML;
      if (editorEmpty(contents)) {
        onChange('', delta);
      } else {
        onChange(contents, delta);
      }
    }, 50);
    const debouncedOnStoreChange = _.debounce((delta) => {
      const contents = this.editor.root.innerHTML;
      if (editorEmpty(contents)) {
        onStoreChange('', delta);
      } else {
        onStoreChange(contents, delta);
      }
    }, 500);
    const both = (delta) => {
      debouncedOnChange(delta);
      debouncedOnStoreChange(delta);
    };
    this.disableToolbarTabs(this.editorContainer.current);
    this.editor.on('text-change', both);
  }

  setUploadInProgress(value) {
    this.setState({
      uploadInProgress: value,
    });
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
    const { theme, intl } = this.props;
    const { uploadInProgress } = this.state;
    const editorStyle = {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize,
    };

    return (
      <div ref={this.editorContainer}>
        <LoadingOverlay
          active={uploadInProgress}
          spinner
          text={intl.formatMessage({ id: 'quillEditorUploadInProgress' })}
        >
          <div ref={this.editorBox} style={editorStyle} />
        </LoadingOverlay>
      </div>
    );
  }
}

QuillEditor.propTypes = {
  marketId: PropTypes.string,
  onS3Upload: PropTypes.func,
  defaultValue: PropTypes.string,
  onChange: PropTypes.func,
  onStoreChange: PropTypes.func,
  placeholder: PropTypes.string,
  value: PropTypes.string,
  uploadDisabled: PropTypes.bool,
  noToolbar: PropTypes.bool,
  setOperationInProgress: PropTypes.func,
  intl: PropTypes.object.isRequired,
};

QuillEditor.defaultProps = {
  onS3Upload: () => {
  },
  onChange: () => {
  },
  onStoreChange: () => {
  },
  setOperationInProgress: () => {
  },
  defaultValue: '',
  placeholder: '',
  marketId: undefined,
  uploadDisabled: false,
  noToolbar: false,
};


export default withTheme(injectIntl(QuillEditor));
