/*
  Phone Validator [Frontend]
*/
class PhoneValidatorFE {

  /*
    An object containing options, such as boolean 'toggleColors' and boolean 'precise'.
  */
  #options;

  /*
    The HTML form.
  */
  #form;

  /*
    The HTML input field.
  */
  #inputField;

  /*
    The intltelinput instance.
  */
  #iti;

  /*
    The phone number instance.
  */ 
  #number;

  constructor(htmlIds, options = {}) {
    try {
      this.#form = document.getElementById(htmlIds.formId);
      this.#inputField = document.getElementById(htmlIds.inputFieldId);
      this.#iti = intlTelInput(this.#inputField, {
        utilsScript: '../intltelinput/js/utils.js',
        separateDialCode: true,
        initialCountry: 'US'
        /*
          Optionally, initial country code may be defined here.
        */
      });
      this.#number = {};
      this.#setDefaultOptions(options);
      this.#launchEventListeners();
    } catch(exceptionVar) {
      if(typeof htmlIds === 'undefined' || !htmlIds.hasOwnProperty('formId') || !htmlIds.hasOwnProperty('inputFieldId')) {
        console.log('The PhoneValidatorFE constructor demands properties \'formId\' and \'inputFieldId\' in the attribute \'htmlIds\'. Exception: ' + exceptionVar + '.');
      } else {
        console.log('An unexpected error occurred: ' + exceptionVar + '.');
      }
    }
  }

  #setDefaultOptions(options) {
    this.#options = {
      toggleColors: true,
      colors: {
        valid: '#e4f8e2',
        invalid: '#f8e2e2',
        default: '#ffffff'
      },
      useTransition: true,
      transition: 'all 0.3s ease',
      precise: true
    };
    if(options.hasOwnProperty('toggleColors') && typeof options.toggleColors === 'boolean') {
      this.#options.toggleColors = options.toggleColors;
    }
    if(options.hasOwnProperty('useTransition') && typeof options.useTransition === 'boolean') {
      this.#options.useTransition = options.useTransition;
    }
    if(options.hasOwnProperty('transition')) {
      this.#options.transition = options.transition;
    }
    if(this.#options.useTransition === true) {
      this.#inputField.style['transition'] = this.#options.transition;
    }
    if(options.hasOwnProperty('colors')) {
      for(let color in options.colors) {
        if(this.#options.colors.hasOwnProperty(color) && 
        /^#[0-9A-F]{6}$/i.test(options.colors[color])) {
          this.#options.colors[color] = options.colors[color];
        }
        if(color === 'default') {
          this.#toggleValid();
        }
      }
    }
    if(options.hasOwnProperty('precise')) {
      this.#options.precise = options.precise;
    }
  }

  /*
    We could use currying, but storing the PhoneValidatorFE instance in window seems simpler and cleaner.
  */
  #launchEventListeners() {
    window.phoneValidator = this;
    this.#inputField.addEventListener('input', window.phoneValidator);
    this.#inputField.addEventListener('countrychange', window.phoneValidator);
  }

  /*
    Found by JS automatically when event occurs.
  */
  handleEvent() {
    this.#removeWhitespace();
    this.#setDataForBackendCall();
    this.#toggleValid();
  }

  /*
    We allow whitespace, but not in the beginning of the string and not double whitespace. Lastly, when the phone number is valid, we trim it in the method 'setDataForBackendCall'.
  */
  #removeWhitespace() {
    let regex1 = /^\s+/g; /* Identify all whitespace in the beginning of the string. */
    let newValue = this.#inputField.value.replace(regex1,'');
    let regex2 = /\s{2,}/g; /* Identify double whitespace in the string. */
    this.#inputField.value = newValue.replace(regex2,' ');
  }

  #createHiddenFields() {
    if(!this.#form.querySelector('#countryCode')) {
      var countryCodeElem = document.createElement('input');
      countryCodeElem.setAttribute('type', 'hidden');
      countryCodeElem.setAttribute('name', 'countryCode');  
      countryCodeElem.setAttribute('id', 'countryCode');
      this.#form.appendChild(countryCodeElem);
    }
    if(!this.#form.querySelector('#domesticPortion')) {
      var domesticPortionElem = document.createElement('input');
      domesticPortionElem.setAttribute('type', 'hidden');
      domesticPortionElem.setAttribute('name', 'domesticPortion');  
      domesticPortionElem.setAttribute('id', 'domesticPortion');
      this.#form.appendChild(domesticPortionElem);
    }
  }

  /*
    We add the values to the hidden input fields.
  */
  #setDataForBackendCall() {
    this.#createHiddenFields();
    this.#form.querySelector('#countryCode').value = this.#iti.getSelectedCountryData().dialCode;
    this.#form.querySelector('#domesticPortion').value = this.#inputField.value.trim();
  }

  /*
    Toggle white/green/red input field.
  */
  #toggleValid() {
    if(this.#options.precise === true) {
      var valid = this.#iti.isValidNumberPrecise();
    } else {
      var valid = this.#iti.isValidNumber();
    }
    if(valid) {
      this.#setValidNumber();
      if(this.#options.toggleColors === true &&
         !this.#inputField.style['background-color'] !== this.#options.colors['valid']) {
        this.#inputField.style['background-color'] = this.#options.colors['valid'];
      }
    } else {
      this.#setInvalidNumber();
      if(this.#options.toggleColors === true) {
        if(this.#inputField.value.length !== 0) {
          if(!this.#inputField.style['background-color'] !== this.#options.colors['invalid']) {
            this.#inputField.style['background-color'] = this.#options.colors['invalid'];
          }
        } else if(this.#inputField.value.length === 0) {
          this.#inputField.style['background-color'] = this.#options.colors['default'];
        }  
      }
    }
  }

  /*
    Since 'number' is just a data storage object we don't use a dedicated PhoneNumber class for it.
  */
  #updateNumber(valid = false, countryCode = '', domesticPortion = '') {
    this.#number.valid = valid;
    this.#number.countryCode = countryCode;
    this.#number.domesticPortion = domesticPortion;
  }

  #setValidNumber() {
    let countryCode = this.#iti.getSelectedCountryData().dialCode;
    let domesticPortion = this.#form.querySelector('#domesticPortion').value;
    this.#updateNumber(true, countryCode, domesticPortion);
  }

  #setInvalidNumber() {
    this.#updateNumber();
  }

  getNumber() {
    return '+' + this.#number.countryCode + this.#number.domesticPortion;
  }

  validNumber() {
    return this.#number.valid;
  }

}