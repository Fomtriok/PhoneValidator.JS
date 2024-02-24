const LibPhone = require('google-libphonenumber');

/*
  Phone Validator [Backend]
*/
class PhoneValidator {

  static #stripWhitespace(number) {
    number.countryCode = number.countryCode.replace(/\s/g,'');
    number.domesticPortion = number.domesticPortion.replace(/\s/g,'');
  }

  static #formatNumber(phoneUtil, number, parsedNumber) {
    const PhoneNumberFormat = LibPhone.PhoneNumberFormat;
    const INTERNATIONAL = phoneUtil.format(parsedNumber, PhoneNumberFormat.INTERNATIONAL);
    const DOMESTIC = phoneUtil.format(parsedNumber, PhoneNumberFormat.NATIONAL);
    number.full = {
      international: INTERNATIONAL,
      domestic: DOMESTIC
    };
  }
 
  /*
    The client input may or may not have a leading substring in the 'domesticPortion' that is only demanded for domestic calls. Both options are accepted as valid numbers by phoneUtil.isValidNumber(), but we want to strip that leading substring from the 'domesticNumber' property in the augmented 'number' object if it is superfluous - for the sake of standardization. We don't literally remove the substring, but rather overwrite the previous 'number.domesticPortion' with a version that for certain does not contain the substring.
  */
  static #stripCountryCode(INTERNATIONAL, countryCode) {
    return INTERNATIONAL.substring(countryCode.length + 1).trim();
  }
  
  /*
    This method first takes the numeric country code [e.g. '1'] and the domestic number, and (1) from this determines the alphabetic region code [e.g. 'US', 'SE' or 'CA'], and finally (2) returns the country name corresponding to that region code. Sometimes, such as for the US and CA, two regions/countries share the same country code.
  */
  static #getCountryName(phoneUtil, number, parsedNumber) {
    number.regionCode = phoneUtil.getRegionCodeForNumber(parsedNumber);
    let regionNames = new Intl.DisplayNames(['en'], {type: 'region'});
    return regionNames.of(number.regionCode); 
  }

  static #orderProperties(number) {
    const NUMBER_TEMPLATE = {
      countryCode: null,
      regionCode: null,
      countryName: null,
      domesticPortion: null,
      full: {
        international: null,
        domestic: null
      }
    };
    /*
      We must alter the 'number' object property-by-property for changes to be valid also in the calling context.
    */
    let tempNumber = Object.assign(NUMBER_TEMPLATE, number);
    Object.keys(number).forEach(key => delete number[key]);
    Object.keys(tempNumber).forEach(key => number[key] = tempNumber[key]);
  }

  static isPhoneNumber(number) {
    if(!number.hasOwnProperty('countryCode') || !number.hasOwnProperty('domesticPortion')) {
      throw new Error('The object \'number\' must have the two properties \'countryCode\' and \'domesticPortion\'.');
    }
    if(typeof number.countryCode !== 'string' || typeof number.domesticPortion !== 'string' ||
       number.countryCode.trim() === '' || number.domesticPortion.trim() === '') {
      console.log('One or both of the properties \'countryCode\' and \'domesticPortion\' of the object \'number\' are either not strings, or else empty strings.');
      return false;
    }
    const phoneUtil = LibPhone.PhoneNumberUtil.getInstance();
    this.#stripWhitespace(number);
    const fullNumber = '+' + number.countryCode + number.domesticPortion;
    try {
      var parsedNumber = phoneUtil.parseAndKeepRawInput(fullNumber);
    } catch (e) {
      /*
        If the provided number is not valid, the parse method may fail, meaning that calling phoneUtil.isValidNumber() is then not necessary, but rather we in those cases return false here.
      */
      return false;
    }
    if(phoneUtil.isValidNumber(parsedNumber)) {
      /*
        Notice: 'domesticPortion' is not necessarily equal to the domestic number, for different countries have different demands on how domestic numbers should start. Since we add the country code, phoneUtil.isValidNumber() accepts domestic portions that include or exclude that possible domestic leading string.
      */
      this.#formatNumber(phoneUtil, number, parsedNumber);
      number.domesticPortion = this.#stripCountryCode(number.full.international, number.countryCode);
      number.countryName = this.#getCountryName(phoneUtil, number, parsedNumber);
      this.#orderProperties(number);
      return true;
    } else {
      return false;
    }
  }

}

module.exports = PhoneValidator;
