/**
 * An email entry with chips etc, similar to Slack's workspace creation email entry
 */

import React, { useRef, useState } from 'react';
import { Send } from '@material-ui/icons';
import { TextField } from '@material-ui/core';
import Chip from '@material-ui/core/Chip';
import { makeStyles } from '@material-ui/styles';

const classes = makeStyles((theme) => {
  return {
    emailChip: {
      marginTop: '2rem',
      marginLeft: '1rem',
      marginRight: '1rem',
      marginBottom: '2rem',
    },
    chipContainer: {
      display: 'flex',
    },
    inputLabel: {
      display: 'block',
      marginTop: '2rem',
      fontWeight: 'bold',
      textTransform: 'none'
    }
  };
});

function EmailEntryBox(props) {
  const [emailList, setEmailList] = useState([]);
  const [currentEmail, setCurrentEmail] = useState('');
  const textRef = useRef(null);
  const {onChange} = props;

  const onEmailChange = (event) => {
    const {value} = event.target;
    setCurrentEmail(value);
  }

  const validateEmail = () => {
    if(!textRef?.current?.validity.valid){
      return false;
    }
    if(isEmpty(currentEmail)){
      return false;
    }
    if(emailList.includes(currentEmail)){
      return false;
    }
    return true;
  }

  // Handles keypresses in text entry box
  const onKeyPress = (event) => {
    const {key} = event;
    if (['Enter', 'Tab', ',', ';', ' '].includes(key)) {
      // not actually an input, so don't put it in field
      event.preventDefault();
      if(validateEmail()) {
        setEmailList([...emailList, currentEmail]);
        setCurrentEmail('');
      }
    }
  }

  const onDelete = (email) => {
    const newEmails = emailList.filter((candidate) => email !== candidate);
    setEmailList(newEmails);
  };



  return (
    <div>
      <div className={classes.chipContainer}>
        {emailList.map((email) => {
          let icon = <Send/>;
          return (
            <div className={classes.emailChip}>
              <Chip
                key={email}
                icon={icon}
                label={email}
                onDelete={() => onDelete(email)}
              />
            </div>
          );
        })}

      </div>
      <TextField
        variant="standard"
        id="emails"
        inputProps={{"type": "email"}}
        inputRef={textRef}
        placeholder="Type or paste emails here"
        onChange={onEmailChange}
        onKeyPress={onKeyPress}
        value={currentEmail}
      />

    </div>

  )


}


export default EmailEntryBox;