/**
 * An email entry with chips etc, similar to Slack's workspace creation email entry
 */

import React from 'react';
import { Send } from '@material-ui/icons';
import Chip from '@material-ui/core/Chip';
import PropTypes from 'prop-types'
import * as ReactDOM from 'react-dom';
import _ from 'lodash';


const ENTRY_BOX_ID = "emailEntryBox";
const ENTRY_BOX_ERROR_ID = "emailEntryBoxError";

class EmailEntryBox extends React.Component{

  constructor(props){
    super(props);
    this.emailList = [];
    this.marketId = props.marketId;
    this.alreadyInList = props.alreadyInList || [];
    this.setEmailList = props.setEmailList;
    this.setIsValid = props.setIsValid;
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
    return email.split('').reduce((a,b) => (((a << 5) - a) + b.charCodeAt(0))|0, 0);
  }

  setValidEmail(email, entryBoxNode) {
    const newEmails = [...this.emailList, email];
    this.emailList = newEmails;
    this.setEmailList(newEmails);
    // render the chip
    const chip = this.generateChip(email);
    entryBoxNode.appendChild(chip);
  }

  emailEntered = (entryBoxNode, onValidEmail, onInvalidEmail) => {
    const { text: email, node: textNode } = this.getText(entryBoxNode);
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

  onBlur = (event) => {
    const { target } = event;
    this.emailEntered(target);
    const isValid = !_.isEmpty(this.emailList);
    this.setIsValid(isValid);
    if (!isValid) {
      this.setError('No valid or not already present emails entered');
    }
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
      return { valid: false, error: `'${email}' is not a valid email.` };
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
    node.setAttribute("style", "display:inline-block; margin: 0.25rem");
    const element = (
        <Chip
          icon={icon}
          size="small"
          label={email}
          onDelete={() => this.doDelete(email)}
        />
    );
    ReactDOM.render(element, node);
    return node;
  }
  // Handles keydown in text entry box
  onKeyDown = (event) => {
    const { key, target } = event;
    // are we done entering an email?
    if (['Enter', 'Tab', ',', ';', ' '].includes(key)) {
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
      const onInvalidEmail = (error, email) => {
        this.setError(error);
      }
      this.emailEntered(target, onValidEmail, onInvalidEmail);
      return;
    }
    // are we backspacing and need to delete an email?
    if (['Backspace'].includes(key)) {
      const { text: email } = this.getText(target);
      if (!email) {
        event.preventDefault();
        const newEmails = [...this.emailList];
        const deleted = newEmails.pop();
        this.doDelete(deleted);
        return;
      }
    }
    // Something has been entered so enable the wizard send button - see Slack handling
    this.setIsValid(true);
    this.setError(null);
  };

  doDelete = (email) => {
    this.emailList = this.emailList.filter((candidate) => email !== candidate);
    this.setEmailList(this.emailList);
    const hash = this.hashEmail(email);
    const node = document.getElementById(hash);
    node?.remove();
  };

  onFocus = (event) => {
    const { target } = event;
    const placeholder = this.getPlaceholder(target);
    placeholder?.remove();
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

  render () {
    return (
      <div>
        <div
          autoFocus={true}
          contentEditable="true"
          id={ENTRY_BOX_ID}
          style={this.wizardStyles.editBox}
          onPaste={this.onPaste}
          onFocus={this.onFocus}
          onBlur={this.onBlur}
          suppressContentEditableWarning={true}
          onKeyDown={this.onKeyDown}>
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
};

EmailEntryBox.defaultProps = {
  placeholder: 'Ex. bfollis@uclusion.com, disrael@uclusion.com',
};

export default EmailEntryBox;