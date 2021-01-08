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
import { addQuillLinkFixer } from './Utilities/LinkUtils';
import VideoDialog from './CustomUI/VideoDialog';
import { embeddifyVideoLink } from './Utilities/VideoUtils';
import LinkDialog from './CustomUI/LinkDialog';
import QuillMention from 'quill-mention-uclusion';

// install our filtering paste module, and disable the uploader
Quill.register('modules/clipboard', CustomQuillClipboard, true);
Quill.register('modules/uploader', NoOpUploader, true);

Quill.register('modules/tableUI', QuillTableUI);
Quill.register('modules/s3Upload', QuillS3ImageUploader);
Quill.register('modules/imageResize', ImageResize);
Quill.register('modules/mention', QuillMention);
Quill.register(CustomCodeBlock, true);

function editorEmpty (contents) {
  return (contents.length === 0 || contents === '<p></p>' || contents === '<p><br></p>');
}

function setTooltip (toolbar, selector, title, title2) {
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
    this.state = { uploads: [], uploadInProgress: false};
    this.editorBox = React.createRef();
    this.editorContainer = React.createRef();
  }


  /**
   * The UI for videos is quite poor, so we need
   * to replace it with ours
   */
  createVideoUi () {
    return (
      <VideoDialog
        open={this.state.videoDialogOpen}
        onClose={() => this.setState({ videoDialogOpen: false })}
        onSave={(link) => {
          const embedded = embeddifyVideoLink(link);
          this.editor.format('video', embedded);
        }}
      />
    );
  }

  /**
   * The UI for links is also quite poor, so we need
   * to replace it with ours
   */
  createLinkUi () {
    return (
      <LinkDialog
        open={this.state.linkDialogOpen}
        onClose={() => this.setState({ linkDialogOpen: false})}
        onSave={(link) => {
          console.error(link);
          // if they haven't got anything selected, just get the current
          // position and insert the url as the text,
          // otherwise just format the current selection as a link
          const selected = this.editor.getSelection(true);
         // console.error(selected);
          //do we have nothing selected i.e. a zero length selection?
          if (selected.length === 0) {
            const index = selected? selected.index : 0; // no position? do it at the front
            // if so, the selection is just the cursor position, so insert our new text there
            this.editor.insertText(index, link, 'link', link, 'user');
            //refocus the editor because for some reason it moves to the top during insert
          }else {
          //  console.error('adding link' + link);
            this.editor.format('link', link);
          }
        }}
      />
    );
  }

  /**
   * Takes our properties and generates a quill options object
   * that configures the editor to what the properties imply.
   * @returns the quill options for the editor
   * */
  generateEditorOptions () {
    const {
      marketId,
      placeholder,
      uploadDisabled,
      noToolbar,
      simple,
      setOperationInProgress,
      participants,
    } = this.props;
    // CSS id of the container from which scroll and bounds checks operate
    const boundsId = this.getBoundsId();
    const defaultModules = {
      mention: {
        source: function (searchTerm, renderList) {
          console.error(`Search term ${searchTerm}`);
          if (searchTerm.length === 0) {
            renderList(participants, searchTerm);
          } else {
            const matches = [];
            participants.forEach((participant) => {
              console.error(participant);
              const { name, id } = participant;
              if (name.toLowerCase().includes(searchTerm.toLowerCase())) {
                matches.push({id, value: name});
              }
            });
            renderList(matches, searchTerm);
          }
        }
      },
      toolbar: {
        handlers : {
          'video': () => {
            this.setState({videoDialogOpen: true})
          },
          'link': (value) => {
            console.error(value);
            if (value){
              this.setState({linkDialogOpen: true});
            }else{
              this.editor.format('link', false);
            }
          }
        },
        //for various reasons, the array form is stored in the container property when you're
        // passing in an object for the toolbar
        container: [
          [{ font: [] }],
          [{ header: [1, 2, false] }],
          ['bold', 'italic', 'underline', 'strike', { script: 'sub' }, { script: 'super' }],
          [{ color: [] }, { background: [] }],
          [{ align: [] }],
          [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
          ['link', 'code-block', 'image', 'video'],
          ['table'],
          ['clean'],
        ]
      },
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
      keyboard: {
        bindings: {
          'tab': {
            key: 9,
            handler: function(range, context) {
              return true;
            }
          }
        }
      }
    };
    const modules = { ...defaultModules };
    if (simple) {
      modules.toolbar = this.simplifiedToolBar;
      modules.s3Upload = false;
      modules.imageResize = false;
    }
    if (uploadDisabled && !simple) {
      modules.toolbar = this.uploadLessToolbar;
      modules.s3Upload = false;
      modules.imageResize = false;
    }

    if (isTinyWindow()) {
      modules.toolbar = this.tinyToolBar;
    }

    if (noToolbar) {
      modules.toolbar = false;
    }

    return {
      modules,
      placeholder,
      readOnly: false,
      theme: 'snow',
      bounds: `#${boundsId}`,
      // sets the element responsible for scroll
      scrollingContainer: `#${boundsId}`,
    };
  }

  getBoundsId() {
    const { id, marketId } = this.props;
    // quill will constrain ui elements to the boundaries
    // of the element specified in the bounds parameter
    // which in our case is a css id
    const boundsId = `editorBox-${id || marketId}`;
    return boundsId;
  }

  /**
   * Configures the load and store
   * from our browser stores and memory,
   * so that the editor
   * picks up where it left off it you
   * reload or come back to the page,
   * and upstream objects get the updates
   * via onchange
   */
  setupStoreAndChangeSyncing () {
    const {
      onChange,
      onStoreChange
    } = this.props;
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
    this.editor.on('text-change', both);
  }

  /** Adds the tooltips
   * to the items in the toolbar.
   */
  addToolTips () {
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

  /** Quill and react state updates
   * don't really play nice with each other.
   * This code bridges between the two worlds
   */
  bridgeReactAndQuillState () {
    const {
      setEditorClearFunc,
      setEditorFocusFunc,
      setEditorDefaultFunc,
    } = this.props;
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
  }

  createEditor () {
    const {
      getUrlName,
    } = this.props;
    const editorOptions = this.generateEditorOptions();
    this.editor = new Quill(this.editorBox.current, editorOptions);
    this.editor.getUrlName = getUrlName;
    addQuillLinkFixer();
    this.setupStoreAndChangeSyncing();
    this.disableToolbarTabs(this.editorContainer.current);
    this.bridgeReactAndQuillState();
  }

  /**
   * Mostly a guard to redo the editor if we rerender the components
   * @param prevProps
   * @param prevState
   * @param snapshot
   */
  componentDidUpdate (prevProps, prevState, snapshot) {
    const marketChanged = prevProps.marketId !== this.props.marketId;
    const storageIdChanged = prevProps.editorStorageId !== this.props.editorStorageId;
    const needsUpdate = marketChanged || storageIdChanged;
    if (needsUpdate) {
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
    // quill will constrain ui elements to the boundaries
    // of the element specified in the bounds parameter
    // which in our case is a css id
    const boundsId = this.getBoundsId();
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
        {this.createVideoUi()}
        {this.createLinkUi()}
        <div ref={this.editorContainer} style={{ maxWidth: '100%', zIndex: '2', borderTop: '1px solid lightgrey' }} id={id}>
          <LoadingOverlay
            active={uploadInProgress}
            spinner
            className="editor-wrapper"
            text={intl.formatMessage({ id: 'quillEditorUploadInProgress' })}
          >
            <div ref={this.editorBox} id={boundsId} style={editorStyle}/>
          </LoadingOverlay>
        </div>
        {isTinyWindow() && <div style={{ height: '40px' }}>&nbsp;</div>}
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
  participants: PropTypes.arrayOf(PropTypes.object),
  editorStorageId: PropTypes.string,
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
  participants: [],
  editorStorageId:'',
};

export default withTheme(injectIntl(QuillEditor));
