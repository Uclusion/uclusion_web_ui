/** A simple wrapper around the quill editor that passes props
 through, and sets up some of the options we'll always want
 **/
import React from 'react';
import PropTypes from 'prop-types';
import Quill from 'quill';
import LoadingOverlay from 'react-loading-overlay';
import ImageResize from 'quill-image-resize-module-withfix';
import QuillS3ImageUploader from './QuillS3ImageUploader';
import NoOpUploader from './NoOpUploader';
import CustomQuillClipboard from './CustomQuillClipboard';
import CustomCodeBlock from './CustomCodeBlock';
import QuillTableUI from 'quill-table-ui';
import 'quill/dist/quill.snow.css';
import 'quill-table-ui/dist/index.css';
import './editorStyles.css';

import { injectIntl } from 'react-intl';
import { withTheme } from '@material-ui/core';
import _ from 'lodash';

// install our filtering paste module, and disable the uploader
Quill.register('modules/clipboard', CustomQuillClipboard, true);
Quill.register('modules/uploader', NoOpUploader, true);

Quill.register('modules/tableUI', QuillTableUI);
Quill.register('modules/s3Upload', QuillS3ImageUploader);
Quill.register('modules/imageResize', ImageResize);
Quill.register(CustomCodeBlock, true);

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
        ['link', 'code-block', 'image'],
        ['table'],
        ['clean'],
      ],
      imageResize: {
        modules: ['Resize', 'DisplaySize'],
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
      this.modules.toolbar = false;
    }

    this.options = {
      modules: this.modules,
      placeholder,
      readOnly: false,
      theme: 'snow',
      bounds: '#editorbox'
    }
  }

  addLinkFixer() {
    const Link = Quill.import('formats/link');
    var builtinSanitizer = Link.sanitize;
    Link.sanitize = function (linkValue) {
      // do nothing, since this implies user's already using a custom protocol
      if (/^\w+:/.test(linkValue)) {
        return builtinSanitizer.call(this, linkValue);
      }
      return builtinSanitizer.call(this, 'https://' + linkValue);
    }
  }

  componentDidMount() {
    const { defaultValue, onChange, onStoreChange, setEditorClearFunc, setEditorFocusFunc } = this.props;
    this.editorBox.current.innerHTML = defaultValue;
    
    if(window.outerWidth < 600){
      this.options.modules.toolbar = false
    }
    this.editor = new Quill(this.editorBox.current, this.options);
    this.addLinkFixer();
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
    // see https://stackoverflow.com/questions/55621212/is-it-possible-to-react-usestate-in-react
    const editorClearFunc = () => (newPlaceHolder) => {
      // this might not really work, zo C-Z will undo the clear, but it's still better than nothing
      this.editor.history.clear();
      this.editor.root.innerHTML='';
      if (newPlaceHolder) {
        const el = this.editorBox.current.firstChild;
        el.setAttribute('data-placeholder', newPlaceHolder);
      }
    };
    setEditorClearFunc(editorClearFunc);
    const editorFocusFunc = () => () => {
      this.editor.focus();
    };
    setEditorFocusFunc(editorFocusFunc);
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
    const { children, theme, intl, id } = this.props;
    const { uploadInProgress } = this.state;
    const editorStyle = {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize,
    };

    return (
      <div ref={this.editorContainer} id={id}>

        <LoadingOverlay
          active={uploadInProgress}
          spinner
          text={intl.formatMessage({ id: 'quillEditorUploadInProgress' })}
        >
          <div ref={this.editorBox} id='editorbox' style={editorStyle} />
        </LoadingOverlay>
        {children}
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
  id: PropTypes.string,
  setEditorClearFunc: PropTypes.func,
  setEditorFocusFunc: PropTypes.func,
  simple: PropTypes.bool,
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
  setEditorClearFunc: () => {
  },
  setEditorFocusFunc: () => {
  },
  defaultValue: '',
  placeholder: '',
  marketId: undefined,
  uploadDisabled: false,
  noToolbar: false,
  id: undefined,
  simple: false,
};


export default withTheme(injectIntl(QuillEditor));
