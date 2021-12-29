/**
 * A message passing based quill editor
 */

import React, { useContext, useEffect, useRef, useState } from 'react';
import LoadingOverlay from 'react-loading-overlay';
import { useIntl } from 'react-intl'
import { makeStyles, useMediaQuery, useTheme } from '@material-ui/core'
import { pushMessage, registerListener } from '../../utils/MessageBusUtils'
import _ from 'lodash';
import ReactDOMServer from 'react-dom/server';
import MentionListItem from './CustomUI/MentionListItem';
import { getUclusionLocalStorageItem, setUclusionLocalStorageItem } from '../localStorageUtils';
import VideoDialog from './CustomUI/VideoDialog';
import { embeddifyVideoLink } from './Utilities/VideoUtils';
import LinkDialog from './CustomUI/LinkDialog';
import Quill from 'quill';
import CustomQuillClipboard from './CustomQuillClipboard';
import NoOpUploader from './NoOpUploader';
import QuillTableUI from 'quill-table-ui';
import QuillS3ImageUploader from './QuillS3ImageUploader';
import ImageResize from 'quill-image-resize-module-withfix';
import QuillMention from 'quill-mention-uclusion';
import CustomCodeBlock from './CustomCodeBlock';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext';
import PropTypes from 'prop-types';
import { getNameForUrl } from '../../utils/marketIdPathFunctions'
import ImageBlot from './ImageBlot'
import { editorRecreate, getControlPlaneName } from './quillHooks'

Quill.debug('error')
// install our filtering paste module, and disable the uploader
Quill.register('modules/clipboard', CustomQuillClipboard, true);
Quill.register('modules/uploader', NoOpUploader, true);
Quill.register(ImageBlot);
Quill.register('modules/tableUI', QuillTableUI);
Quill.register('modules/s3Upload', QuillS3ImageUploader);
Quill.register('modules/imageResize', ImageResize);
Quill.register('modules/mention', QuillMention);
Quill.register(CustomCodeBlock, true);

// static helper funcs

function editorEmpty (contents) {
  return (contents.length === 0 || contents === '<p></p>' || contents === '<p><br></p>')
}

function disableToolbarTabs (editorNode) {
  if (editorNode && editorNode.querySelectorAll) {
    const toolbarButtons = editorNode.querySelectorAll('.ql-toolbar *')
    toolbarButtons.forEach((button) => {
      button.tabIndex = -1
    });
  }
}

function removeToolbarTabs (editorNode) {
  if (editorNode && editorNode.querySelectorAll) {
    const toolbarButtons = editorNode.querySelectorAll('.ql-toolbar *')
    toolbarButtons.forEach((button) => {
      button.style.display = 'none'
      button.parentElement.style.display = 'none'
    });
  }
}

function setTooltip (toolbar, selector, title, title2) {
  if (toolbar) {
    if ((title2 && toolbar.querySelectorAll) || (!title2 && toolbar.querySelector)) {
      const selected = title2 ? toolbar.querySelectorAll(selector) : toolbar.querySelector(selector)
      if (selected) {
        if (title2) {
          selected[0] && selected[0].setAttribute('title', title)
          selected[1] && selected[1].setAttribute('title', title2)
        } else {
          selected.setAttribute('title', title)
        }
      }
    }
  }
}

/** Adds the tooltips
 * to the items in the toolbar.
 */
function addToolTips (toolbar) {
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

/** Returns the initial state of the editor,
 * preferring the known state over the stored state
 * and the disk state over the placeholder
 * @param id
 * @param knownState
 * @param placeHolder
 */
function getInitialState (id, knownState, placeHolder) {
  const storedState = getUclusionLocalStorageItem(`editor-${id}`);
  if (storedState != null) {
    return storedState;
  }
  if (knownState != null) {
    return knownState;
  }
  return placeHolder;
}

const OUR_CLOUDFRONT_FILE_PATTERN = /https:\/\/\w+.cloudfront.net\/(\w{8}(-\w{4}){3}-\w{12})\/\w{8}(-\w{4}){3}-\w{12}.*/i;
const OUR_CND_DOMAIN_ENDING = 'imagecdn.uclusion.com';

function storeState (id, state) {
  if (_.isEmpty(state)) {
    setUclusionLocalStorageItem(`editor-${id}`, state);
  } else {
    //Remove tokens here that were added in ImageBlot Quill format
    const regexp = /img src\s*=\s*"(.+?)"/g;
    const newStr = state.replace(regexp, (match, p1) => {
      const cloudfrontMatch = p1.match(OUR_CLOUDFRONT_FILE_PATTERN);
      const cdnMatch = p1.includes(OUR_CND_DOMAIN_ENDING);
      if (!cloudfrontMatch && !cdnMatch) {
        return `img src="${p1}"`;
      }
      const url = new URL(p1);
      const params = new URLSearchParams(url.search);
      params.delete('authorization');
      url.search = params.toString();
      return `img src="${url.toString()}"`;
    });
    setUclusionLocalStorageItem(`editor-${id}`, newStr);
  }
}

export function getQuillStoredState(id) {
  return getUclusionLocalStorageItem(`editor-${id}`);
}

const useStyles = makeStyles(
  theme => {
    return {
      root: {
        '& .ql-container.ql-snow': {
          fontFamily: theme.typography.fontFamily,
          fontSize: 15,
          border: 0
        },
        '& .ql-editor': {
          paddingLeft: 0
        },
      },
      nothing: {},
      bottomSpacer: {
        display: 'none',
        [theme.breakpoints.between(0, 601)]: {
          display: 'block',
          height: '50px'
        }
      }
    };
  },
  { name: "ReadOnlyQuillEditor" }
);

function QuillEditor2 (props) {

  const {
    id,
    cssId,
    value,
    marketId,
    placeholder,
    uploadDisabled,
    noToolbar,
    simple,
    participants,
    mentionsAllowed
  } = props;
  const classes = useStyles();
  const containerRef = useRef();
  const boxRef = useRef();
  const [uploadInProgress, setUploadInProgress] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false)
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  //TODO presumably this is a performance optimization but could get the same by handling dependencies better
  const [editor, setEditor] = useState(null)
  const [currentId, setCurrentId] = useState(id)
  const intl = useIntl()
  const theme = useTheme()
  const [, setOperationInProgress] = useContext(OperationInProgressContext)
  const boundsId = `editorBox-${id || marketId}`
  const initialContents = getInitialState(id, value, placeholder)
  const mobileLayout = useMediaQuery(theme.breakpoints.down('md'))
  const [currentLayout, setCurrentLayout] = useState(mobileLayout)

  function focusEditor (editor) {
    if (!_.isEmpty(boxRef?.current?.children)) {
      boxRef.current.children[0].click()
    }
    editor.focus()
  }

  function resetHandler (contents) {
    if (id) {
      storeState(id, null);
      createEditor(id, contents); // recreate the editor, because we need to get brand new state
    }
  }

  function replaceEditorContents(contents, editor) {
    editor.setContents({insert: contents});
    storeState(id, contents);
  }

  function beginListening(editor, listenId) {
    registerListener(`editor-${listenId}-control-plane`, id, (message) => {
      const {
        type,
        contents,
        newId,
        myLayout
      } = message.payload;
      switch (type) {
        case 'recreate':
          return createEditor(newId, contents, myLayout)
        case 'reset':
          return resetHandler(contents);
        case 'update':
          return replaceEditorContents(contents, editor);
        case 'focus':
          return focusEditor(editor);
        default:
        // do nothing;
      }
    })
  }

  /**
   * The UI for videos is quite poor, so we need
   * to replace it with ours
   */
  function createVideoUi () {
    return (
      <VideoDialog
        open={videoDialogOpen}
        onClose={() => setVideoDialogOpen(false)}
        onSave={(link) => {
          const embedded = embeddifyVideoLink(link);
          editor.format('video', embedded);
        }}
      />
    );
  }

  /**
   * The UI for links is also quite poor, so we need
   * to replace it with ours
   */
  function createLinkUi () {
    return (
      <LinkDialog
        open={linkDialogOpen}
        onClose={() => setLinkDialogOpen(false)}
        onSave={(link) => {
          // if they haven't got anything selected, just get the current
          // position and insert the url as the text,
          // otherwise just format the current selection as a link
          const selected = editor.getSelection(true);
          // console.error(selected);
          //do we have nothing selected i.e. a zero length selection?
          if (selected.length === 0) {
            const index = selected ? selected.index : 0; // no position? do it at the front
            // if so, the selection is just the cursor position, so insert our new text there
            const name = getNameForUrl(link);
            editor.insertText(index, _.isEmpty(name) ? link : name, 'link', link, 'user');
            //refocus the editor because for some reason it moves to the top during insert
          } else {
            //  console.error('adding link' + link);
            editor.format('link', link);
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
  function generateEditorOptions (layout) {
    if (noToolbar) {
      return {
        modules: {
          toolbar: false
        },
        readOnly: true,
        theme: 'snow'
      }
    }
    // CSS id of the container from which scroll and bounds checks operate
    const defaultModules = {
      toolbar: {
        handlers: {
          'video': () => {
            setVideoDialogOpen(true);
          },
          'link': (value) => {
            if (value) {
              setLinkDialogOpen(true);
            } else {
              //TODO editor doesn't exist yet so how are we using it here?
              editor.format('link', false);
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
        onS3Upload,
        onUploadStart: () => {
          setUploadInProgress(true);
          setOperationInProgress(true);
        },
        onUploadStop: () => {
          setUploadInProgress(false);
          setOperationInProgress(false);
        },
      },

      table: true,
      tableUI: true,
      keyboard: {
        bindings: {
          'tab': {
            key: 9,
            handler: function (range, context) {
              return true;
            }
          }
        }
      }
    };
    const modules = { ...defaultModules };
    if (simple) {
      modules.toolbar.container = [
        ['bold', 'italic', 'underline', 'strike'],
        ['link', 'code-block'],
        ['clean'],
      ];
      modules.s3Upload = false;
      modules.imageResize = false;
    }
    if (uploadDisabled && !simple) {
      modules.toolbar.container = [
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
      modules.s3Upload = false;
      modules.imageResize = false;
    }

    if (layout) {
      modules.toolbar.container = [
        ['bold', 'italic', 'link', 'image', 'video', 'clean'],
      ]
    }

    if (!_.isEmpty(participants) && mentionsAllowed) {
      /* Note, due to lifecycles if they edit a comment begin creating a mention
        and hit save before selecting one (or clicking off to not do so), then
        the mention menu will stick open. Fixing this would require fairly
        invasive surgery to the mention module and some way in this code to know you've
        exited edit mode. Hence we're not fixing it as of 01/20/21
       */
      modules.mention = {
        isolateCharacter: true,
        dataAttributes: ['id', 'value', 'denotationChar', 'link', 'target', 'externalId'],
        positioningStrategy: 'fixed',
        renderItem: function (item) {
          // we want an html string here which gets slammed into inner html, so we have to do some trickery
          // to let react render the result
          return ReactDOMServer.renderToString(<MentionListItem mentionResult={item}/>);
        },
        source: function (searchTerm, renderList) {
          if (searchTerm.length === 0) {
            renderList(participants.map((presence) => {
              const { name, id, email, external_id } = presence;
              return { id, value: name, email, externalId: external_id };
            }), searchTerm);
          } else {
            const matches = [];
            participants.forEach((presence) => {
              const { name, id, email, external_id } = presence;
              if (name.toLowerCase().includes(searchTerm.toLowerCase())) {
                matches.push({ id, value: name, email, externalId: external_id });
              }
            });
            renderList(matches, searchTerm);
          }
        }
      };
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

  function onS3Upload (metadatas) {
    const newUploads = [...uploadedFiles, ...metadatas]
    setUploadedFiles(newUploads)
    pushMessage(`editor-${id}`, { type: 'uploads', newUploads })
  }

  function isWhitespace (ch) {
    return (ch === ' ') || (ch === '\t') || (ch === '\n')
  }

  function createEditor (editorId, initializeContents, myLayout) {
    const layout = myLayout || mobileLayout
    // we only set the contents if different from the placeholder
    // otherwise the placeholder functionality of the editor won't work
    if (boxRef.current) {
      boxRef.current.innerHTML = ''
      if (initializeContents !== undefined) {
        boxRef.current.innerHTML = initializeContents
      } else if (!(placeholder === initialContents) && initialContents) {
        boxRef.current.innerHTML = initialContents
      }
    }

    //Removing old toolbar in case changes
    removeToolbarTabs(containerRef.current)
    const editorOptions = generateEditorOptions(layout)
    const editor = new Quill(boxRef.current, editorOptions)
    if (!noToolbar) {
      if (editor.container) {
        addToolTips(editor.container.previousSibling)
      }
      disableToolbarTabs(containerRef.current)
    }
    const debouncedOnChange = _.debounce((delta) => {
      // URL stuff from https://github.com/quilljs/quill/issues/109
      const regex = /https?:\/\/[^\s]+$/
      if (delta.ops.length === 2 && delta.ops[0].retain && isWhitespace(delta.ops[1].insert)) {
        const endRetain = delta.ops[0].retain;
        const text = editor.getText().substr(0, endRetain);
        const match = text.match(regex);

        if (match !== null) {
          const url = match[0];

          const ops = [];
          if(endRetain > url.length) {
            ops.push({ retain: endRetain - url.length });
          }

          const retOps = ops.concat([
            { delete: url.length },
            { insert: url, attributes: { link: url } }
          ]);

          editor.updateContents({
            ops: retOps
          });
        }
      }
      const contents = editor.root.innerHTML;
      if (editorEmpty(contents)) {
        storeState(editorId, '');
      } else {
        storeState(editorId, contents);
      }
    }, 50);
    editor.on('text-change', debouncedOnChange);
    setEditor(editor);
    setCurrentId(editorId)
    setCurrentLayout(layout)
    beginListening(editor, editorId)
  }

  // bridge our fonts in from the theme;
  const editorStyle = {
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.fontSize,
    overflowX: 'hidden',
  };

  const containerStyle = {
    maxWidth: '100%',
    zIndex: '2',
    borderTop: '1px solid lightgrey'
  }

  const containerReadOnlyStyle = {
    maxWidth: '100%',
    zIndex: '2'
  }

  useEffect(() => {
    if (currentId && mobileLayout !== currentLayout) {
      pushMessage(getControlPlaneName(currentId), editorRecreate(currentId, getQuillStoredState(currentId),
        mobileLayout))
    }
    return () => {}
  }, [currentId, mobileLayout, currentLayout])

  useEffect(() => {
    if (id && currentId !== id) {
      //If id changes have to reset
      pushMessage(getControlPlaneName(currentId), editorRecreate(id, getQuillStoredState(id)))
    }
    return () => {}
  }, [currentId, id])

  useEffect(() => {
    // Without this read only won't update
    if (editor && noToolbar) {
      editor.root.innerHTML = '';
      editor.clipboard.dangerouslyPasteHTML(0, value);
    }
  }, [editor, value, noToolbar]);

  useEffect(() => {
    //TODO this makes no sense since no dependencies will only run on creation
    //TODO and editor.scrollingContainer.id !== boundsId happens if namespace changes - having to call reset from parent
    if(!editor && (id || noToolbar)) {
      createEditor(id);
    }
  });

  return (
    <div>
      {createVideoUi()}
      {createLinkUi()}
      <div
        ref={containerRef}
        className={noToolbar ? classes.root : classes.nothing}
        style={noToolbar ? containerReadOnlyStyle: containerStyle}
        id={cssId}
      >
        {noToolbar && (
          <div ref={boxRef} id={boundsId} style={editorStyle}/>
        )}
        {!noToolbar && (
          <LoadingOverlay
            active={uploadInProgress}
            spinner
            className="editor-wrapper"
            text={intl.formatMessage({ id: 'quillEditorUploadInProgress' })}
          >
            <div ref={boxRef} id={boundsId} style={editorStyle}/>
          </LoadingOverlay>
        )}
      </div>
      <div className={classes.bottomSpacer}>&nbsp;</div>
    </div>
  );
}

QuillEditor2.propTypes = {
  marketId: PropTypes.string,
  value: PropTypes.string,
  onStoreChange: PropTypes.func,
  placeholder: PropTypes.string,
  uploadDisabled: PropTypes.bool,
  noToolbar: PropTypes.bool,
  setOperationInProgress: PropTypes.func,
  id: PropTypes.string,
  simple: PropTypes.bool,
  participants: PropTypes.arrayOf(PropTypes.object),
  mentionsAllowed: PropTypes.bool,
  dontManageState: PropTypes.bool
};

QuillEditor2.defaultProps = {
  value: '',
  placeholder: '',
  marketId: undefined,
  dontManageState: false,
  uploadDisabled: false,
  noToolbar: false,
  id: undefined,
  simple: false,
  participants: [],
  mentionsAllowed: true,
};

export default QuillEditor2;