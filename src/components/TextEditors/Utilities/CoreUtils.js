import _ from 'lodash';
import QuillEditorRegistry from '../QuillEditorRegistry';
import { getUclusionLocalStorageItem, setUclusionLocalStorageItem } from '../../localStorageUtils'
import ReactDOMServer from 'react-dom/server'
import MentionListItem from '../CustomUI/MentionListItem'
import React from 'react'
import Quill from 'quill'
import { convertHTMLString } from '../ImageBlot'

// static helper funcs

export function editorEmpty (originalContents) {
  const contents = originalContents.replace(/[\n\r]+/g, '').trim();
  return (contents.length === 0 || contents === '<p></p>' || contents === '<p><br></p>')
}

function disableToolbarTabs (editorNode) {
  if (editorNode && editorNode.querySelectorAll) {
    const toolbarButtons = editorNode.querySelectorAll('.ql-toolbar *')
    toolbarButtons.forEach((button) => {
      if (button.tabIndex !== -1) {
        button.tabIndex = -1;
      }
    });
  } else {
    console.warn(editorNode);
  }
}


function isWhitespace (ch) {
  return (ch === ' ') || (ch === '\t') || (ch === '\n')
}

export function generateOnChangeHandler(editorId){
  const {editor} = QuillEditorRegistry.getEditor(editorId);
  if(!editor) {
    return () => {};
  }
  return _.debounce((delta) => {
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
    } else {
      console.warn(toolbar);
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




const OUR_CLOUDFRONT_FILE_PATTERN = /https:\/\/\w+.cloudfront.net\/(\w{8}(-\w{4}){3}-\w{12})\/\w{8}(-\w{4}){3}-\w{12}.*/i;
const OUR_CND_DOMAIN_ENDING = 'imagecdn.uclusion.com';

function removeToolbarTabs (editorNode) {
  if (editorNode && editorNode.querySelectorAll) {
    const toolbarButtons = editorNode.querySelectorAll('.ql-toolbar *')
    toolbarButtons.forEach((button) => {
      button.style.display = 'none'
      button.parentElement.style.display = 'none'
    });
  } else {
    console.warn(editorNode);
  }
}


export function resetEditor(id, contents, configOverrides) {
  if (id) {
    storeState(id, null);
    if (contents || configOverrides) {
      const { editor, config } = QuillEditorRegistry.getEditor(id);
      const fullConfig = {
        ...config,
        configOverrides,
      }
      if (editor != null) {
        createEditor(id, contents, fullConfig, true); // recreate the editor, because we need brand new state
      }
    } else {
      // If you only pass an id you just want removal
      QuillEditorRegistry.remove(id);
    }
  }
}

/** Returns the initial state of the editor,
 * preferring the known state over the stored state
 * and the disk state over the placeholder
 * @param id
 * @param knownState
 * @param placeHolder
 * @param ignoreStored
 */
function getDefaultContents (id, knownState, placeHolder, ignoreStored=false) {
  if (!ignoreStored) {
    const storedState = getUclusionLocalStorageItem(`editor-${id}`);
    if (storedState != null) {
      return storedState;
    }
  }
  if (knownState != null) {
    return knownState;
  }
  return placeHolder;
}

export function createEditor (id, editorContents, config, forceCreate) {
  const { editor: oldEditor, config: oldConfig } = QuillEditorRegistry.getEditor(id);
  if (oldConfig && oldEditor) {
    let isNotAutoForce = oldConfig.simple === config.simple && oldConfig.layout === config.layout && !config.noToolbar;
    if (oldConfig.placeholder !== config.placeholder && _.isEmpty(config.value)
      && _.isEmpty(getUclusionLocalStorageItem(`editor-${id}`))) {
      isNotAutoForce = false;
    }
    // we need to rebuild the editor if we were rendered somewhere else under the same Id
    if (oldConfig.boxRef !== config.boxRef || oldConfig.containerRef !== config.containerRef) {
      isNotAutoForce = false
    }
    if (isNotAutoForce) {
      // noToolbar is read only and read only must be recreated each time or doesn't render
      if (!forceCreate) {
        return; // already made the editor
      }
    }
  }

  const {
    boxRef,
    containerRef,
    value,
    placeholder,
    noToolbar
  } = config;

  const defaultContents = getDefaultContents(id, value, placeholder, noToolbar)

  // we only set the contents if different from the placeholder
  // otherwise the placeholder functionality of the editor won't work

  if (boxRef.current) {
    if (editorContents !== undefined) {
      boxRef.current.innerHTML = convertHTMLString(editorContents);
    } else if (!(placeholder === defaultContents) && defaultContents) {
      boxRef.current.innerHTML = convertHTMLString(defaultContents);
    } else {
      boxRef.current.innerHTML = '';
    }
  } else {
    console.warn('No current editor');
    // no current == no place to create editor;
    return;
  }

  //Hiding old toolbar because otherwise it and new both display
  removeToolbarTabs(containerRef.current)

  const editorOptions = generateEditorOptions(id, config);
  const editor = new Quill(boxRef.current, editorOptions);
  QuillEditorRegistry.setEditor(id, editor, config);
  if (!noToolbar) {
    if (editor.container) {
      addToolTips(editor.container.previousSibling)
    }
    disableToolbarTabs(containerRef.current)
  }
  const onChange = generateOnChangeHandler(id);
  editor.on('text-change', onChange);
}

export function storeState (id, state) {
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

export function getBoundsId(id){
  return `editorBox-${id}`;
}

export function focusEditor (id) {
  const boundsId = getBoundsId(id);
  const container = document.getElementById(boundsId);
  if (!_.isEmpty(container?.children)) {
    container.children[0].click()
  }
  const {editor} = QuillEditorRegistry.getEditor(id);
  editor?.focus()
}

export function replaceEditorContents(contents, id) {
  const {editor} = QuillEditorRegistry.getEditor(id);
  if(!editor){
    return;
  }
  editor.setContents({insert: contents});
  storeState(id, contents);
}



export function getQuillStoredState(id) {
  return getUclusionLocalStorageItem(`editor-${id}`);
}


/**
 * Takes our properties and generates a quill options object
 * that configures the editor to what the properties imply.
 * @returns the quill options for the editor
 * */
export function generateEditorOptions (id, config) {
  const {
    marketId,
    layout,
    noToolbar,
    onS3Upload,
    setUploadInProgress,
    setOperationInProgress,
    setVideoDialogOpen,
    setLinkDialogOpen,
    simple,
    uploadDisabled,
    participants,
    mentionsAllowed,
    boundsId,
    placeholder,
  } = config;

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
            const {editor} = QuillEditorRegistry.getEditor(id);
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
