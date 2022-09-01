/**
 * An email entry with chips etc, similar to Slack's workspace creation email entry
 */

import React, { useEffect, useRef, useState } from 'react';
import { Send } from '@material-ui/icons';
import Chip from '@material-ui/core/Chip';
import { makeStyles } from '@material-ui/styles';
import { Typography } from '@material-ui/core';

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
      height: '10rem',
      border: '1px solid black',
    },
  };
});

function EmailEntryBox (props) {
  const [emailList, setEmailList] = useState([]);
  const [error, setError] = useState(null);
  const textRef = useRef(null);
  const { onChange } = props;
  const classes = wizardStyles();
  useEffect(() => {
    if(textRef.current) {
      const target = textRef.current;
      target.focus();
      // select all the content in the element
      document.execCommand('selectAll', false, null);
      // collapse selection to the end
      document.getSelection().collapseToEnd();
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
    const w3regexp = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    if(!email.match(w3regexp)){
      return {valid: false, error: `${email} is not a valid email.`}
    }
    return {valid: true};
  };

  // Handles keydown in text entry box
  const onKeyDown = (event) => {
    const { key, target } = event;
    const text = [...target.childNodes].find(child => child.nodeType === Node.TEXT_NODE);
    let email = text?.textContent?.trim();
    const emailValidation = validateEmail(email);
    // are we done entering an email?
    if (['Enter', 'Tab', ',', ';', ' '].includes(key)) {
      event.preventDefault();
      // not actually an input, so don't put it in field
      if(emailValidation.valid) {
        setEmailList([...emailList, email]);
        //zero out the text
        text?.remove();
        // move focus to end
        // [optional] make sure focus is on the element
      }else{
        setError(emailValidation.error)
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
        return;
      }
    }
    setError(null);
  };

  const onDelete = (email) => {
    const newEmails = emailList.filter((candidate) => email !== candidate);
    setEmailList(newEmails);
  };

  return (
  <div>
    <div
      contentEditable="true"
      className={classes.editBox}
      ref={textRef}
      suppressContentEditableWarning={true}
      onKeyDown={onKeyDown}>
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
      <Typography>{error}</Typography>
    )}
  </div>
  );
};

export default EmailEntryBox;