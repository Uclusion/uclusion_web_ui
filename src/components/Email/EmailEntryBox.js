/**
 * An email entry with chips etc, similar to Slack's workspace creation email entry
 */

import React from 'react';
import { Send } from '@material-ui/icons';
import Chip from '@material-ui/core/Chip';
import PropTypes from 'prop-types'
import * as ReactDOM from 'react-dom';
import { getUclusionLocalStorageItem, setUclusionLocalStorageItem } from '../localStorageUtils'

export function setEmailList(emailList, id) {
  console.debug(`Setting emails for ${id}`);
  console.debug(emailList)
  setUclusionLocalStorageItem(`emails-${id}`, emailList);
}

export function getEmailList(id) {
  return getUclusionLocalStorageItem(`emails-${id}`);
}

class EmailEntryBox extends React.Component{

  constructor(props){
    super(props);
    this.emailList = [];
    this.marketId = props.marketId;
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

  // gets the placeholder node
  getPlaceholder = (target) => {
    if (target?.childNodes) {
      const placeholder = [...target.childNodes].find(child => child.id === 'placeholder');
      return placeholder;
    }
  };

  validateEmail = (email) => {
    if (!email) {
      return { valid: false };
    }
    if (this.emailList.includes(email)) {
      return {
        valid: false,
        error: `${email} is already present.`
      };
    }
    // regexp from w3 spec
    const w3regexp = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    if (!email.match(w3regexp)) {
      return { valid: false, error: `'${email}' is not a valid email.` };
    }
    return { valid: true };
  };

  setError = (value) => {
    const errorBox = document.getElementById("emailEntryBoxError");
    const {node} = this.getText(errorBox);
    node?.remove();
    if(value){
      errorBox.appendChild(document.createTextNode(value));
    }
  }

  generateChip = (email) => {
    const node = document.createElement("div");
    const icon = <Send/>;
    node.id = email;
    node.setAttribute("contentEditable", false);
    node.setAttribute("style", "display:inline-block; margin: 0.25rem");
    const element = (
        <Chip
          icon={icon}
          size="small"
          label={email}
          onDelete={(e) => this.onDelete(e, email)}
        />
    );
    ReactDOM.render(element, node);
    return node;
  }
  // Handles keydown in text entry box
  onKeyDown = (event) => {
    const { key, target } = event;
    const { text: email, node: textNode } = this.getText(target);
    const emailValidation = this.validateEmail(email);
    // are we done entering an email?
    if (['Enter', 'Tab', ',', ';', ' '].includes(key)) {
      event.preventDefault();
      // not actually an input, so don't put it in field
      if (emailValidation.valid) {
        const newEmails = [...this.emailList, email];
        this.emailList = newEmails;
        setEmailList(newEmails, this.marketId);
        //zero out the text
        textNode.remove();
        // render the chip
        const chip = this.generateChip(email);
        target.appendChild(chip);
        target.focus();
        // cursor at end
        // select all the content in the element
        document.execCommand('selectAll', false, null);
        // collapse selection to the end
        document.getSelection().collapseToEnd();
        // give us a blinking cursor
        target.appendChild(document.createTextNode('\u200b'));
      }else{
        this.setError(`'${email}' is not a valid email.`);
      }
      return;
    }
    // are we backspacing and need to delete an email?
    if (['Backspace'].includes(key)) {
      if (!email) {
        event.preventDefault();
        const newEmails = [...this.emailList];
        const deleted = newEmails.pop();
        console.debug(`deleting email ${deleted}`);
        this.emailList = newEmails;
        setEmailList(newEmails, this.marketId);
        const toBeRemoved = document.getElementById(deleted);
        console.debug(toBeRemoved);
        toBeRemoved?.remove();
        return;
      }
    }
    this.setError(null);
  };

  onDelete = (event, email) => {
    const newEmails = this.emailList.filter((candidate) => email !== candidate);
    setEmailList(newEmails, this.marketId);
    event.target.parentNode.remove();
  };

  onFocus = (event) => {
    const { target } = event;
    const placeholder = this.getPlaceholder(target);
    placeholder?.remove();
  };

  onPaste = (event) => {
    event.preventDefault();
    // the w3 regexp minus the start and end chars
    const matchingRegexp = /([a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*)/g;
    const pasted = event.clipboardData.getData('text');
    const emails = pasted.match(matchingRegexp);
    if(emails) {
      const toBeAdded = emails.filter((email) => !this.emailList.includes(email));
      setEmailList([...this.emailList, ...toBeAdded]);
    }
  }

  render () {
    return (
      <div>
        <div
          autoFocus={true}
          contentEditable="true"
          id="emailEntryBox"
          style={this.wizardStyles.editBox}
          onPaste={this.onPaste}
          onFocus={this.onFocus}
          suppressContentEditableWarning={true}
          onKeyDown={this.onKeyDown}>
          <span id="placeholder" style={this.wizardStyles.placeholder} contentEditable="false">{this.placeholder}</span>
        </div>
        <div id="emailEntryBoxError" style={{height: '1rem', color:'#E85757'}}/>
      </div>
    )
  }
};

EmailEntryBox.propTypes = {
  marketId: PropTypes.string.isRequired,
  placeholder: PropTypes.string,
};

EmailEntryBox.defaultProps = {
  placeholder: 'Ex. bfollis@uclusion.com, disrael@uclusion.com',
};

export default EmailEntryBox;