import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { dir, resolveText } from '../../../core/i18n';
import { ContactContent, Language, Section } from '../../../core/models';
import { ApiService } from '../../../core/api.service';
import { PhoneInput } from '../../../shared/phone-input';

/**
 * Renders a `contact` section: a description, a signal-driven contact form with
 * basic validation, and optional WhatsApp / email shortcuts. Submissions go
 * through `ApiService.publicSubmitContact`.
 */
@Component({
  selector: 'app-contact-renderer',
  standalone: true,
  imports: [FormsModule, PhoneInput],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let s = section();
    @let l = lang();
    @let c = content();
    @let ar = l === 'ar';
    <div class="mx-auto max-w-2xl px-4" [attr.dir]="dir(l)">
      @if (resolveText(s.title, l)) {
        <h2 class="mb-2 text-center text-3xl font-bold text-gray-900">
          {{ resolveText(s.title, l) }}
        </h2>
      }
      @if (resolveText(c.description, l)) {
        <div
          class="rich-text mb-8 text-center text-gray-600"
          [innerHTML]="resolveText(c.description, l)"
        ></div>
      }

      @if (submitted()) {
        <div
          class="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-4 text-center text-green-800"
        >
          {{ resolveText(c.successMessage, l) || (ar ? 'تم الإرسال بنجاح. شكراً لك!' : 'Thanks! Your message has been sent.') }}
        </div>
      } @else {
        <form
          class="stagger flex flex-col gap-5 rounded-2xl border border-gray-200 bg-white p-6 text-start shadow-sm sm:p-8"
          (ngSubmit)="submit()"
        >
          <!-- Name + Email -->
          <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700">
                {{ ar ? 'الاسم' : 'Name' }} <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                [ngModel]="name()"
                (ngModelChange)="name.set($event)"
                [disabled]="loading()"
                [attr.placeholder]="ar ? 'اسمك الكامل' : 'Your full name'"
                class="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none transition duration-200 hover:border-gray-400 focus:border-transparent focus:ring-2"
                [style.--tw-ring-color]="'var(--site-primary)'"
              />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700">
                {{ ar ? 'البريد الإلكتروني' : 'Email' }}
                <span class="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                dir="ltr"
                [ngModel]="email()"
                (ngModelChange)="email.set($event)"
                [disabled]="loading()"
                placeholder="you@example.com"
                class="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none transition duration-200 hover:border-gray-400 focus:border-transparent focus:ring-2"
                [style.--tw-ring-color]="'var(--site-primary)'"
              />
            </div>
          </div>

          <!-- Phone (optional) + Subject. Raised above the fields below so the
               phone country dropdown floats over them instead of behind. -->
          <div class="relative z-30 grid grid-cols-1 gap-5 sm:grid-cols-2">
            @if (c.showPhone) {
              <div class="intl-phone">
                <label class="mb-1.5 block text-sm font-medium text-gray-700">
                  {{ ar ? 'رقم الهاتف' : 'Phone' }}
                </label>
                <app-phone-input
                  [value]="phone()"
                  (valueChange)="phone.set($event)"
                  [disabled]="loading()"
                />
              </div>
            }
            <div [class.sm:col-span-2]="!c.showPhone">
              <label class="mb-1.5 block text-sm font-medium text-gray-700">
                {{ ar ? 'الموضوع' : 'Subject' }}
              </label>
              <input
                type="text"
                name="subject"
                [ngModel]="subject()"
                (ngModelChange)="subject.set($event)"
                [disabled]="loading()"
                [attr.placeholder]="ar ? 'موضوع رسالتك' : 'What is this about?'"
                class="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none transition duration-200 hover:border-gray-400 focus:border-transparent focus:ring-2"
                [style.--tw-ring-color]="'var(--site-primary)'"
              />
            </div>
          </div>

          <!-- Message -->
          <div>
            <label class="mb-1.5 block text-sm font-medium text-gray-700">
              {{ ar ? 'الرسالة' : 'Message' }} <span class="text-red-500">*</span>
            </label>
            <textarea
              name="message"
              rows="5"
              [ngModel]="message()"
              (ngModelChange)="message.set($event)"
              [disabled]="loading()"
              [attr.placeholder]="
                ar ? 'اكتب رسالتك هنا…' : 'Write your message here…'
              "
              class="w-full resize-y rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none transition duration-200 hover:border-gray-400 focus:border-transparent focus:ring-2"
              [style.--tw-ring-color]="'var(--site-primary)'"
            ></textarea>
          </div>

          <button
            type="submit"
            [disabled]="loading()"
            class="inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 font-semibold text-white shadow-sm transition duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:brightness-110 active:translate-y-0 disabled:translate-y-0 disabled:opacity-60 disabled:shadow-none disabled:hover:brightness-100"
            [style.background-color]="'var(--site-primary)'"
          >
            @if (loading()) {
              <i class="pi pi-spin pi-spinner"></i>
            }
            {{ ar ? 'إرسال الرسالة' : 'Send message' }}
          </button>
        </form>
      }

      @if (whatsappLink() || c.recipientEmail) {
        <div class="mt-6 flex flex-wrap items-center justify-center gap-3">
          @if (whatsappLink()) {
            <a
              [href]="whatsappLink()"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-4 py-2 font-medium text-white shadow-sm transition duration-300 ease-out hover:-translate-y-0.5 hover:opacity-90 hover:shadow-md"
            >
              <i class="pi pi-whatsapp"></i>
              {{ ar ? 'واتساب' : 'WhatsApp' }}
            </a>
          }
          @if (c.recipientEmail) {
            <a
              [href]="'mailto:' + c.recipientEmail"
              class="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 transition duration-300 ease-out hover:-translate-y-0.5 hover:border-gray-400 hover:bg-gray-50 hover:shadow-md"
            >
              <i class="pi pi-envelope"></i>
              {{ ar ? 'راسلنا عبر البريد' : 'Email us' }}
            </a>
          }
        </div>
      }
    </div>
  `,
})
export class ContactRenderer {
  readonly section = input.required<Section>();
  readonly lang = input.required<Language>();
  readonly subdomain = input.required<string>();

  private readonly api = inject(ApiService);
  private readonly messages = inject(MessageService);

  /** Strongly-typed view of the section content. */
  readonly content = computed(() => this.section().content as ContactContent);

  // Form state.
  readonly name = signal('');
  readonly email = signal('');
  readonly subject = signal('');
  readonly message = signal('');
  readonly loading = signal(false);
  readonly submitted = signal(false);

  /** Full international phone number from the intl phone field. */
  readonly phone = signal('');

  /** WhatsApp click-to-chat link, digits only; null when not configured. */
  readonly whatsappLink = computed(() => {
    const raw = this.content().whatsappNumber;
    if (!raw) return null;
    const digits = raw.replace(/\D/g, '');
    return digits ? `https://wa.me/${digits}` : null;
  });

  /** The submittable phone string (E.164) from the intl phone field. */
  private phoneNumber(): string {
    return this.phone().trim();
  }

  submit(): void {
    if (this.loading()) return;
    const ar = this.lang() === 'ar';

    const name = this.name().trim();
    const email = this.email().trim();
    const message = this.message().trim();

    // Basic required + email validation.
    if (!name || !email || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.messages.add({
        severity: 'error',
        summary: ar ? 'تحقق من البيانات' : 'Check your details',
        detail: ar
          ? 'يرجى تعبئة الاسم والبريد الإلكتروني الصحيح والرسالة.'
          : 'Please provide your name, a valid email and a message.',
      });
      return;
    }

    this.loading.set(true);
    this.api
      .publicSubmitContact(this.subdomain(), {
        name,
        email,
        phone: this.phoneNumber() || undefined,
        subject: this.subject().trim() || undefined,
        message,
        sectionId: this.section().id,
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.submitted.set(true);
          this.messages.add({
            severity: 'success',
            summary: ar ? 'تم الإرسال' : 'Sent',
            detail:
              resolveText(this.content().successMessage, this.lang()) ||
              (ar ? 'شكراً لتواصلك معنا.' : 'Thanks for reaching out.'),
          });
          // Reset form fields.
          this.name.set('');
          this.email.set('');
          this.phone.set('');
          this.subject.set('');
          this.message.set('');
        },
        error: () => {
          this.loading.set(false);
          this.messages.add({
            severity: 'error',
            summary: ar ? 'تعذّر الإرسال' : 'Could not send',
            detail: ar
              ? 'حدث خطأ. حاول مرة أخرى لاحقاً.'
              : 'Something went wrong. Please try again later.',
          });
        },
      });
  }

  // Expose helpers to the template.
  readonly resolveText = resolveText;
  readonly dir = dir;
}
