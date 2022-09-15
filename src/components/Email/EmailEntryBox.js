/**
 * An email entry with chips etc, similar to Slack's workspace creation email entry
 */

import React, { useEffect, useRef, useState } from 'react';
import { Send } from '@material-ui/icons';
import Chip from '@material-ui/core/Chip';
import { makeStyles } from '@material-ui/styles';
import { Typography } from '@material-ui/core';
import PropTypes from 'prop-types'

const wizardStyles = makeStyles((theme) => {
  return {
    emailChip: {
      display: 'inline-block',
      marginTop: '0.5rem',
      marginLeft: '0.25rem',
      marginRight: '0.25rem',
      marginBottom: '0.5rem',
    },
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
      color: theme.palette.grey['500'],
    },
    error: {
      color: '#E85757',
    }
  };
});

function EmailEntryBox (props) {
  const [myEmailList, setMyEmailList] = useState([]);
  const [error, setError] = useState(null);
  const textRef = useRef(null);
  const { onChange, placeholder, controlledEmailList, setControlledEmailList } = props;
  const classes = wizardStyles();
  const emailList = controlledEmailList || myEmailList;
  const setEmailList = setControlledEmailList || setMyEmailList;

  // gets the text from the target of the event
  const getText = (target) => {
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
  const getPlaceholder = (target) => {
    if (target?.childNodes) {
      const placeholder = [...target.childNodes].find(child => child.id === 'placeholder');
      return placeholder;
    }
  };

  useEffect(() => {
    if (textRef.current) {
      const target = textRef.current;
      const placeholder = getPlaceholder(target);
      if (placeholder == null) {
        target.focus();
        // select all the content in the element
        document.execCommand('selectAll', false, null);
        // collapse selection to the end
        document.getSelection().collapseToEnd();
        // give us a blinking cursor
        const {node} = getText(target);
        if(node == null){
          target.appendChild(document.createTextNode('\u200b'));
        }
      }
    }
  });

  const validateEmail = (email) => {
    if (!email) {
      return { valid: false };
    }
    if (emailList.includes(email)) {
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

  // Handles keydown in text entry box
  const onKeyDown = (event) => {
    const { key, target } = event;
    const { text: email, node: textNode } = getText(target);
    const emailValidation = validateEmail(email);
    // are we done entering an email?
    if (['Enter', 'Tab', ',', ';', ' '].includes(key)) {
      event.preventDefault();
      // not actually an input, so don't put it in field
      if (emailValidation.valid) {
        const newEmails = [...emailList, email];
        setEmailList(newEmails);
        onChange(newEmails);
        //zero out the text
        textNode.remove();
      } else {
        setError(emailValidation.error);
      }
      return;
    }
    // are we backspacing and need to delete an email?
    if (['Backspace'].includes(key)) {
      if (!email) {
        event.preventDefault();
        console.dir('deleting email');
        const newEmails = [...emailList];
        newEmails.pop();
        setEmailList(newEmails);
        onChange(newEmails);
        return;
      }
    }
    setError(null);
  };

  const onDelete = (email) => {
    const newEmails = emailList.filter((candidate) => email !== candidate);
    setEmailList(newEmails);
  };

  const onFocus = (event) => {
    const { target } = event;
    const placeholder = getPlaceholder(target);
    placeholder?.remove();
  };

  const onPaste = (event) => {
    event.preventDefault();
    // the w3 regexp minus the start and end chars
    const matchingRegexp = /([a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*)/g;
    const pasted = event.clipboardData.getData('text');
    const emails = pasted.match(matchingRegexp);
    console.dir(emails);
    if(emails) {
      const toBeAdded = emails.filter((email) => !emailList.includes(email));
      setEmailList([...emailList, ...toBeAdded]);
    }
  }

  return (
    <div>
      <div
        contentEditable="true"
        id="emailEntryBox"
        className={classes.editBox}
        ref={textRef}
        onPaste={onPaste}
        onFocus={onFocus}
        suppressContentEditableWarning={true}
        onKeyDown={onKeyDown}>
        <span id="placeholder" className={classes.placeholder} contentEditable="false">{placeholder}</span>
        {emailList.map((email) => {
          let icon = <Send/>;
          return (
            <div
              contentEditable={false}
              className={classes.emailChip}
              key={email}
              id={email}
            >
              <Chip
                icon={icon}
                size="small"
                label={email}
                onDelete={() => onDelete(email)}
              />
            </div>
          );
        })}
      </div>
      {error && (
        <Typography className={classes.error}>{error}</Typography>
      )}
    </div>
  );
};

EmailEntryBox.propTypes = {
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
};

EmailEntryBox.defaultProps = {
  onChange: () => {},
  placeholder: 'Ex. bfollis@uclusion.com, disrael@uclusion.com',
};

export default EmailEntryBox;