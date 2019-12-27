// taken from https://github.com/NewOldMax/react-material-ui-form-validator example

import React from 'react';
import red from '@material-ui/core/colors/red';
import {FormControl, FormControlLabel, Checkbox, FormHelperText}  from '@material-ui/core';
import { ValidatorComponent } from 'react-material-ui-form-validator';

const red300 = red['500'];

const style = {
  right: 0,
  fontSize: 12,
  color: red300,
  position: 'absolute',
  marginTop: '-15px',
};

class CheckboxValidator extends ValidatorComponent {

  render() {
    const { errorMessages, validators, requiredError, value, label, ...rest } = this.props;
    const { isValid } = this.state;
    return (
      <div>
        <FormControl error={isValid}>
        <FormControlLabel
          control={
            <Checkbox
              {...rest}
              ref={(r) => { this.input = r; }}
            />
          }
          label={label}
          />
        <FormHelperText>{this.errorText()}</FormHelperText>
        </FormControl>
      </div>
    );
  }

  errorText() {
    const { isValid } = this.state;

    if (isValid) {
      return null;
    }

    return (
      <div style={style}>
        {this.getErrorMessage()}
      </div>
    );
  }
}

export default CheckboxValidator;
