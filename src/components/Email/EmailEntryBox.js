/**
 * An email entry with chips etc, similar to Slack's workspace creation email entry
 */

import React from 'react';
import { Send } from '@material-ui/icons';
import Chip from '@material-ui/core/Chip';
import PropTypes from 'prop-types'
import * as ReactDOM from 'react-dom';
import _ from 'lodash';
import { getUclusionLocalStorageItem, setUclusionLocalStorageItem } from '../localStorageUtils';


const ENTRY_BOX_ID = "emailEntryBox";
const ENTRY_BOX_ERROR_ID = "emailEntryBoxError";

// we're using local storage for get/set, because it's synchronous and works with onblur
export function setEmailList(emailList, id) {
  setUclusionLocalStorageItem(`${ENTRY_BOX_ID}-${id}`, emailList);
}

export function getEmailList(id) {
  return getUclusionLocalStorageItem(`${ENTRY_BOX_ID}-${id}`);
}

class EmailEntryBox extends React.Component{

  constructor(props){
    super(props);
    this.emailList = [];
    this.marketId = props.marketId;
    this.alreadyInList = props.alreadyInList || [];
    this.setIsValid = props.setIsValid;
    this.placeholder = props.placeholder;
    this.inputRef = React.createRef();
  }
   wizardStyles = {
      editBox: {
        width: '100%',
        padding: '0.25rem',
        height: '10rem',
        borderRadius: '6px',
        border: '1px dashed grey',
        '&:focus': {
          outline: '2px solid #2D9CDB',
        },
      },
      placeholder: {
        color: 'grey',
      },

    };

  // gets the text from the target of the event
  getText = (target) => {
    if (target?.childNodes) {
      const text = [...target.childNodes].find(child => child.nodeType === Node.TEXT_NODE);
      const trimmed = text?.textContent?.trim();
      // to get a nice cursor we add a non visible space, but trim doesn't think it's wihtespace
      const spaceDehacked = trimmed?.replace('\u200b', '');
      return { text: spaceDehacked, node: text };
    }
    return { text: undefined, node: undefined };
  };


  hashEmail = (email) => {
    //stolen from https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript
    return email?.split('').reduce((a,b) => (((a << 5) - a) + b.charCodeAt(0))|0, 0);
  }

  setValidEmail(email, entryBoxNode) {
    const newEmails = [...this.emailList, email];
    this.emailList = newEmails;
    setEmailList(newEmails, this.marketId);
    // render the chip
    const chip = this.generateChip(email);
    entryBoxNode.appendChild(chip);
  }

  emailEntered = (entryBoxNode, onValidEmail, onInvalidEmail) => {
    const { text: email, node: textNode } = this.getText(entryBoxNode);
    if (!_.isEmpty(email)) {
      const emailValidation = this.validateEmail(email);
      if (emailValidation.valid) {
        this.setValidEmail(email, entryBoxNode);
        //zero out the text
        textNode.remove();
        onValidEmail?.(email);
      } else {
        onInvalidEmail?.(emailValidation.error, email);
      }
    }
  }

  onBlur = (event) => {
    const { target } = event;
    const placeholder = this.getPlaceholder(target);
    placeholder?.remove();
    // Try to leave valid undefined if nothing entered
    this.emailEntered(target, () => this.setIsValid(true), (error) => {
      this.setIsValid(false);
      this.setError(error);
    });
  }

  // gets the placeholder node
  getPlaceholder = (target) => {
    if (target?.childNodes) {
      return [...target.childNodes].find(child => child.id === 'placeholder');
    }
  };

  validateEmail = (email) => {
    if (!email) {
      return { valid: false };
    }
    if (this.emailList.includes(email)||this.alreadyInList.includes(email)) {
      return {
        valid: false,
        error: `${email} is already present.`
      };
    }
    // regexp from w3 spec
    const w3regexp = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    if (!email.match(w3regexp)) {
      return { valid: false };
    }
    return { valid: true };
  };

  setError = (value) => {
    const errorBox = document.getElementById(ENTRY_BOX_ERROR_ID);
    const {node} = this.getText(errorBox);
    node?.remove();
    if(value){
      errorBox.appendChild(document.createTextNode(value));
    }
  }

  generateChip = (email) => {
    const hash = this.hashEmail(email);
    const node = document.createElement("div");
    const icon = <Send/>;
    node.id = hash;
    node.setAttribute("contentEditable", false);
    node.setAttribute("tabindex", -1)
    node.setAttribute("style", "display:inline-block; margin: 0.25rem");
    const element = (
        <Chip
          icon={icon}
          size="small"
          label={email}
          tabIndex={-1}
          onDelete={() => this.doDelete(email)}
        />
    );
    ReactDOM.render(element, node);
    return node;
  }
  // Handles keydown in text entry box
  onKeyDown = (event) => {
    const { key, target } = event;
    const placeholder = this.getPlaceholder(target);
    placeholder?.remove();
    // are we done entering an email?
    if (['Enter', ',', ';', ' '].includes(key)) {
      event.preventDefault();
      // not actually an input, so don't put it in field
      const onValidEmail = () => {
        target.focus();
        // cursor at end
        // select all the content in the element
        document.execCommand('selectAll', false, null);
        // collapse selection to the end
        document.getSelection().collapseToEnd();
        // give us a blinking cursor
        target.appendChild(document.createTextNode('\u200b'));
      };
      const onInvalidEmail = (error) => {
        this.setError(error);
      }
      this.emailEntered(target, onValidEmail, onInvalidEmail);
      return;
    }
    const { text: email } = this.getText(target);
    // are we backspacing and need to delete an email?
    if (['Backspace'].includes(key)) {
      if (!email) {
        event.preventDefault();
        const newEmails = [...this.emailList];
        const deleted = newEmails.pop();
        this.doDelete(deleted);
        return;
      }
    }
    const emailValidation = this.validateEmail(email);
    if (emailValidation.valid) {
      this.setIsValid(true);
    }
    if (emailValidation.error) {
      this.setIsValid(false);
      this.setError(emailValidation.error);
    } else {
      this.setError(null);
    }
  };

  doDelete = (email) => {
    this.emailList = this.emailList.filter((candidate) => email !== candidate);
    setEmailList(this.emailList, this.marketId);
    if (_.isEmpty(this.emailList)) {
      this.setIsValid(undefined);
    }
    const hash = this.hashEmail(email);
    const node = document.getElementById(hash);
    node?.remove();
  };

  onPaste = (event) => {
    // the w3 regexp minus the start and end chars
    const matchingRegexp = /([a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*)/g;
    const pasted = event.clipboardData.getData('text');
    const emails = pasted.match(matchingRegexp);
    const { target } = event;
    if (emails) {
      event.preventDefault();
      const toBeAdded = emails.filter((email) => !this.emailList.includes(email));
      toBeAdded.forEach((email) => {
        this.setValidEmail(email, target)
      })
    }
  }

  // https://github.com/facebook/react/issues/6868 - must implement autofocus ourselves for div
  componentDidMount() {
    this.inputRef?.current?.focus();
  }

  render () {
    return (
      <div>
        <div
          contentEditable="true"
          id={ENTRY_BOX_ID}
          style={this.wizardStyles.editBox}
          onPaste={this.onPaste}
          onBlur={this.onBlur}
          ref={this.inputRef}
          suppressContentEditableWarning={true}
          onKeyDown={this.onKeyDown}
          onClick={(event) => {
            const placeholder = this.getPlaceholder(event.target);
            placeholder?.remove();
          }}>
          <span id="placeholder" style={this.wizardStyles.placeholder} contentEditable="false">{this.placeholder}</span>
        </div>
        <div id={ENTRY_BOX_ERROR_ID} style={{height: '1rem', color:'#E85757'}}/>
      </div>
    )
  }
}

EmailEntryBox.propTypes = {
  marketId: PropTypes.string.isRequired,
  placeholder: PropTypes.string,
  setIsValid: PropTypes.func
};

EmailEntryBox.defaultProps = {
  placeholder: 'Ex. bfollis@uclusion.com, disrael@uclusion.com',
  setIsValid: () => {}
};

export default EmailEntryBox;