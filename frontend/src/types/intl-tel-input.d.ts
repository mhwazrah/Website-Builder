/**
 * Minimal ambient types for `intl-tel-input` v19 (the package ships no
 * declarations). Only the surface used by {@link PhoneInput} is typed.
 */
declare module 'intl-tel-input' {
  interface CountryData {
    name?: string;
    iso2?: string;
    dialCode?: string;
  }
  interface Iti {
    getSelectedCountryData(): CountryData;
    getNumber(): string;
    setNumber(value: string): void;
    isValidNumber(): boolean;
    destroy(): void;
  }
  const intlTelInput: (
    input: HTMLInputElement,
    options?: Record<string, unknown>,
  ) => Iti;
  export default intlTelInput;
}
