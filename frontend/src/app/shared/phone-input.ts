import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  input,
  model,
  viewChild,
} from '@angular/core';
import intlTelInput from 'intl-tel-input';

/**
 * Allowed countries for the phone field: the six GCC states plus Egypt and
 * Jordan (ISO2, lowercase). Default selection is Saudi Arabia.
 */
const ALLOWED_COUNTRIES = ['sa', 'ae', 'kw', 'qa', 'bh', 'om', 'eg', 'jo'];

/**
 * International phone field built on the `intl-tel-input` library (the same
 * library ngx-intl-tel-input wraps — that wrapper is incompatible with
 * Angular 22 because it relies on a removed ngx-bootstrap API). Shows a country
 * dropdown limited to {@link ALLOWED_COUNTRIES} with a separate dial code, and
 * emits the full international number (e.g. `+9665XXXXXXXX`) via `[(value)]`.
 */
@Component({
  selector: 'app-phone-input',
  standalone: true,
  template: `
    <input
      #el
      type="tel"
      autocomplete="tel"
      [disabled]="disabled()"
      class="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none transition duration-200 hover:border-gray-400 focus:border-transparent focus:ring-2 focus:shadow-md disabled:opacity-60"
      [style.--tw-ring-color]="'var(--site-primary)'"
    />
  `,
})
export class PhoneInput implements AfterViewInit, OnDestroy {
  /** Two-way bound full international number (or '' when empty). */
  readonly value = model<string>('');
  readonly disabled = input(false);

  private readonly inputRef =
    viewChild.required<ElementRef<HTMLInputElement>>('el');
  private iti: ReturnType<typeof intlTelInput> | null = null;

  ngAfterViewInit(): void {
    const input = this.inputRef().nativeElement;
    this.iti = intlTelInput(input, {
      initialCountry: 'sa',
      onlyCountries: ALLOWED_COUNTRIES,
      separateDialCode: true,
      countrySearch: true,
      // Default popup behaviour: an inline dropdown on desktop (the contact
      // renderer raises the phone row's z-index so it floats above the fields
      // below it) and a fullscreen popup on touch/mobile. Dark styling applies
      // via `.theme-dark` (mirrored onto <html> for the mobile popup on <body>).
    } as Parameters<typeof intlTelInput>[1]);

    // Seed any preset value (best-effort; the contact form starts empty).
    const seed = this.value();
    if (seed) {
      try {
        this.iti.setNumber(seed);
      } catch {
        /* utils not loaded — ignore */
      }
    }

    const emit = (): void => this.value.set(this.fullNumber(input));
    input.addEventListener('input', emit);
    input.addEventListener('countrychange', emit);
  }

  /** Build `+<dialCode><nationalDigits>` from the current selection + input. */
  private fullNumber(input: HTMLInputElement): string {
    const national = input.value.replace(/\D/g, '');
    if (!national) return '';
    const dial = this.iti?.getSelectedCountryData()?.dialCode ?? '';
    return `+${dial}${national}`;
  }

  ngOnDestroy(): void {
    this.iti?.destroy();
  }
}
