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
import _ from 'lodash';
import { injectIntl } from 'react-intl';
import { withTheme } from '@material-ui/core';
import { isTinyWindow } from '../../utils/windowUtils';

// install our filtering paste module, and disable the uploader
Quill.register('modules/clipboard', CustomQuillClipboard, true);
Quill.register('modules/uploader', NoOpUploader, true);

Quill.register('modules/tableUI', QuillTableUI);
Quill.register('modules/s3Upload', QuillS3ImageUploader);
Quill.register('modules/imageResize', ImageResize);
Quill.register(CustomCodeBlock, true);

function editorEmpty (contents) {
  return (contents.length === 0 || contents === '<p></p>' || contents === '<p><br></p>');
}

function setTooltip(toolbar, selector, title, title2) {
  const selected = title2 ? toolbar.querySelectorAll(selector) : toolbar.querySelector(selector);
  if (selected) {
    if (title2) {
      selected[0] && selected[0].setAttribute('title', title);
      selected[1] && selected[1].setAttribute('title', title2);
    } else {
      selected.setAttribute('title', title);
    }
  }
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

  tinyToolBar = [
    ['bold', 'italic', 'link', 'image', 'video', 'clean'],
  ];

  constructor (props) {
    super(props);
    this.state = { uploads: [], uploadInProgress: false };
    this.editorBox = React.createRef();
    this.editorContainer = React.createRef();
  }

  addLinkFixer () {
    const Link = Quill.import('formats/link');
    var builtinSanitizer = Link.sanitize;
    Link.sanitize = function (originalLinkValue) {
      let linkValue = originalLinkValue;
      if (linkValue && linkValue.includes('loom.com/share')) {
        linkValue = linkValue.replace('loom.com/share', 'loom.com/embed');
      }
      // do nothing, since this implies user's already using a custom protocol
      if (/^\w+:/.test(linkValue)) {
        return builtinSanitizer.call(this, linkValue);
      }
      return builtinSanitizer.call(this, 'https://' + linkValue);
    };
  }

  /** The default UI for links sucks, This is a new one that's better
   *
   * @param value
   */
  renderLinkUI (value) {

  }

  createEditor () {
    const {
      onChange, onStoreChange, setEditorClearFunc, setEditorFocusFunc, setEditorDefaultFunc,
      marketId,
      placeholder,
      uploadDisabled,
      noToolbar,
      simple,
      setOperationInProgress,
      getUrlName
    } = this.props;
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

    if (isTinyWindow()) {
      this.modules.toolbar = this.tinyToolBar;
    }

    if (noToolbar) {
      this.modules.toolbar = false;
    }

    this.options = {
      modules: this.modules,
      handlers: {
        link: this.renderLinkUI,
      },
      placeholder,
      readOnly: false,
      theme: 'snow',
      bounds: '#editorbox'
    };
    this.editor = new Quill(this.editorBox.current, this.options);
    this.editor.getUrlName = getUrlName;
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
      this.editor.root.innerHTML = '';
      this.editor.setContents([{ insert: '' }]);
      if (newPlaceHolder) {
        const el = this.editorBox.current.firstChild;
        el.setAttribute('data-placeholder', newPlaceHolder);
      }
      if (this.editorBox.current && !_.isEmpty(this.editorBox.current.children)) {
        this.editorBox.current.children[0].click();
      }
      this.editor.focus();
    };
    setEditorClearFunc(editorClearFunc);
    const editorDefaultFunc = () => (newDefault) => {
      this.editor.setContents([{ insert: '' }]);
      if (newDefault) {
        this.editor.clipboard.dangerouslyPasteHTML(newDefault);
      }
    };
    setEditorDefaultFunc(editorDefaultFunc);
    const editorFocusFunc = () => () => {
      this.editor.focus();
    };
    setEditorFocusFunc(editorFocusFunc);
    const toolbar = this.editor.container.previousSibling;
    setTooltip(toolbar, 'button.ql-bold', 'Bold');
    setTooltip(toolbar, 'button.ql-italic', 'Italic');
    setTooltip(toolbar, 'button.ql-link', 'Link');
    setTooltip(toolbar, 'button.ql-clean', 'Clear Formatting');
    setTooltip(toolbar, 'button.ql-image', 'Image');
    setTooltip(toolbar, 'button.ql-video', 'Video or Loom Link');
    setTooltip(toolbar, 'button.ql-underline', 'Underline');
    setTooltip(toolbar, 'button.ql-strike', 'Strike');
    setTooltip(toolbar, 'button.ql-list', 'Number List', 'Bullet List');
    setTooltip(toolbar, 'button.ql-table', 'Table');
    setTooltip(toolbar, 'span.ql-color', 'Text Color');
    setTooltip(toolbar, 'span.ql-background', 'Background Color');
    setTooltip(toolbar, 'span.ql-align', 'Text Alignment');
    setTooltip(toolbar, 'span.ql-font', 'Font Style');
    setTooltip(toolbar, 'span.ql-header', 'Font Size');
    setTooltip(toolbar, 'button.ql-code-block', 'Code Block');
    setTooltip(toolbar, 'button.ql-script', 'Subscript', 'Superscript');
    setTooltip(toolbar, 'button.ql-indent', 'Unindent', 'Indent');
  }

  componentDidUpdate (prevProps, prevState, snapshot) {
    if (prevProps.marketId !== this.props.marketId) {
      console.debug('Updating Quill');
      this.createEditor();
    }
  }

  componentDidMount () {
    const { defaultValue } = this.props;
    this.editorBox.current.innerHTML = defaultValue;

    this.createEditor();

  }

  setUploadInProgress (value) {
    this.setState({
      uploadInProgress: value,
    });
  }

  disableToolbarTabs (editorNode) {
    const toolbarButtons = editorNode.querySelectorAll('.ql-toolbar *');
    toolbarButtons.forEach((button) => {
      button.tabIndex = -1;
    });
  }

  statefulUpload (metadatas) {
    const { uploads } = this.state;
    const newUploads = [...uploads, ...metadatas];
    this.setState({ uploads: newUploads });
    const { onS3Upload } = this.props;
    if (onS3Upload) {
      onS3Upload(newUploads);
    }
  }

  render () {
    const { children, theme, intl, id } = this.props;
    const { uploadInProgress } = this.state;
    const editorStyle = {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize,
      maxHeight: '425px',
      overflow: 'scroll',
      overflowX: 'hidden',
    };

    return (
      <div>
        <div ref={this.editorContainer} style={{ maxWidth: '100%', zIndex: '2'}} id={id}>
          <LoadingOverlay
            active={uploadInProgress}
            spinner
            className="editor-wrapper"
            text={intl.formatMessage({ id: 'quillEditorUploadInProgress' })}
          >
            <div ref={this.editorBox} id='editorbox' style={editorStyle}/>
          </LoadingOverlay>
        </div>
        {isTinyWindow() && <div style={{height: "40px"}}>&nbsp;</div>}
        <div>
        {children}
        </div>
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
  getUrlName: PropTypes.func.isRequired,
  intl: PropTypes.object.isRequired,
  id: PropTypes.string,
  setEditorClearFunc: PropTypes.func,
  setEditorFocusFunc: PropTypes.func,
  setEditorDefaultFunc: PropTypes.func,
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
  setEditorDefaultFunc: () => {
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
