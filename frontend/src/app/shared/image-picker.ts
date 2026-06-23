import {
  Component,
  computed,
  inject,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { FileUploadModule } from 'primeng/fileupload';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageService } from 'primeng/api';
import { ImageCropperComponent } from 'ngx-smart-cropper';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../core/api.service';
import { AdminI18n } from '../core/admin-i18n';
import { assetUrl } from '../core/config';
import { Asset } from '../core/models';
import { FieldLabel } from './field-label';

/**
 * Reusable image field: the user can upload a file (cropped to a forced aspect
 * ratio, then sent to the API and stored), paste an image URL, OR pick from the
 * media library of previously uploaded assets. Two-way bound via `[(value)]` to
 * the resulting URL (a server path like `/uploads/x.webp` or an absolute URL).
 *
 * Set `[aspectRatio]` to enforce a shape on uploads (e.g. `16/9` for hero,
 * `1` for avatars, `4/3` for cards). When omitted the crop is free-form so the
 * user can still trim the image without distorting it.
 */
@Component({
  selector: 'app-image-picker',
  imports: [
    FormsModule,
    InputTextModule,
    FileUploadModule,
    ButtonModule,
    DialogModule,
    TooltipModule,
    SkeletonModule,
    ImageCropperComponent,
    FieldLabel,
  ],
  template: `
    @if (label()) {
      <app-field-label [text]="label()" [hint]="hint()" />
    }
    <div class="flex flex-col gap-2">
      @if (value()) {
        <div class="relative inline-block w-full max-w-xs">
          <img
            [src]="preview()"
            alt="preview"
            class="h-28 w-full object-cover rounded-md border border-gray-200 bg-gray-50"
          />
          <button
            type="button"
            (click)="clear()"
            class="absolute top-1 ltr:right-1 rtl:left-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
            [attr.aria-label]="i18n.t('Remove', 'إزالة')"
          >
            <i class="pi pi-times text-xs"></i>
          </button>
        </div>
      } @else {
        <p-fileupload
          mode="advanced"
          [customUpload]="true"
          accept="image/*"
          [auto]="true"
          [showUploadButton]="false"
          [showCancelButton]="false"
          [chooseLabel]="i18n.t('Upload', 'رفع')"
          styleClass="w-full"
          (uploadHandler)="onSelect($event)"
        />
      }
      <div class="flex items-center gap-2">
        <input
          pInputText
          class="w-full text-sm"
          [placeholder]="i18n.t('or paste an image URL', 'أو ألصق رابط صورة')"
          [ngModel]="value()"
          (ngModelChange)="value.set($event)"
        />
        <p-button
          type="button"
          icon="pi pi-images"
          severity="secondary"
          [outlined]="true"
          [label]="i18n.t('Library', 'المكتبة')"
          (onClick)="openLibrary()"
        />
      </div>
      @if (aspectRatio()) {
        <span class="text-xs text-gray-400">
          {{ i18n.t('Uploads are cropped to', 'يتم اقتصاص الصور إلى') }}
          {{ ratioLabel(aspectRatio()!) }}
        </span>
      }
      @if (uploading()) {
        <span class="text-xs text-gray-500">
          <i class="pi pi-spin pi-spinner"></i> {{ i18n.t('Uploading', 'جارٍ الرفع') }}…
        </span>
      }
    </div>

    <!-- Crop dialog (forces the slot aspect ratio) -->
    <p-dialog
      [(visible)]="cropOpen"
      [modal]="true"
      [draggable]="false"
      [closable]="!uploading()"
      [style]="{ width: '44rem', maxWidth: '95vw' }"
      [header]="cropHeader()"
      [dir]="i18n.dir()"
      (onHide)="onCropHide()"
    >
      @if (cropSource(); as src) {
        <div class="flex flex-col items-center gap-3">
          <div class="w-full overflow-auto">
            <ngx-smart-cropper
              [imageSource]="src"
              [aspectRatio]="aspectRatio()"
              [imageType]="'webp'"
              [imagePreviewWidth]="520"
              (imageCroppedEvent)="onCropped($event)"
            />
          </div>
          <p class="text-xs text-gray-500">
            {{
              i18n.t(
                'Drag to reposition, drag a handle to resize.',
                'اسحب لتغيير الموضع، واسحب المقابض لتغيير الحجم.'
              )
            }}
          </p>
        </div>
      }
      <ng-template pTemplate="footer">
        <p-button
          [label]="i18n.t('Cancel', 'إلغاء')"
          [text]="true"
          severity="secondary"
          [disabled]="uploading()"
          (onClick)="cancelCrop()"
        />
        <p-button
          [label]="i18n.t('Crop & use', 'اقتصاص واستخدام')"
          icon="pi pi-check"
          [loading]="uploading()"
          (onClick)="confirmCrop()"
        />
      </ng-template>
    </p-dialog>

    <p-dialog
      [(visible)]="libraryOpen"
      [modal]="true"
      [draggable]="false"
      [dismissableMask]="true"
      [style]="{ width: '46rem' }"
      [header]="i18n.t('Library', 'المكتبة')"
      [dir]="i18n.dir()"
    >
      @if (libraryLoading()) {
        <div class="grid grid-cols-3 gap-3 sm:grid-cols-4" aria-busy="true">
          @for (i of skeletonSlots; track i) {
            <p-skeleton height="6rem" borderRadius="0.375rem" />
          }
        </div>
      } @else if (assets().length === 0) {
        <div class="py-10 text-center text-sm text-gray-500">
          {{ i18n.t('No images yet', 'لا توجد صور بعد') }}
        </div>
      } @else {
        <div class="grid grid-cols-3 gap-3 sm:grid-cols-4">
          @for (asset of assets(); track asset.id) {
            <div
              class="group relative cursor-pointer overflow-hidden rounded-md border border-gray-200 bg-gray-50"
              (click)="pick(asset)"
            >
              <img
                [src]="thumb(asset)"
                [alt]="asset.filename ?? i18n.t('Image', 'صورة')"
                class="h-24 w-full object-cover"
              />
              <button
                type="button"
                (click)="removeAsset(asset, $event)"
                class="absolute top-1 ltr:right-1 rtl:left-1 hidden h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 group-hover:inline-flex"
                [attr.aria-label]="i18n.t('Remove', 'إزالة')"
                [pTooltip]="i18n.t('Remove', 'إزالة')"
              >
                <i class="pi pi-trash text-xs"></i>
              </button>
            </div>
          }
        </div>
      }
    </p-dialog>
  `,
})
export class ImagePickerComponent {
  readonly value = model<string>('');
  readonly label = input('');
  readonly hint = input('');
  /** Forced crop ratio (width/height). Null = free-form crop. */
  readonly aspectRatio = input<number | null>(null);
  /**
   * Optional custom uploader for the cropped file. When provided it is used
   * instead of the generic image endpoint and must resolve to the stored URL.
   * Lets special uploads (e.g. logos, which also extract brand colours) reuse
   * this component and its cropper.
   */
  readonly uploadFn = input<((file: File) => Promise<string>) | null>(null);

  private readonly api = inject(ApiService);
  private readonly messages = inject(MessageService);
  protected readonly i18n = inject(AdminI18n);

  protected readonly uploading = signal(false);
  protected readonly libraryOpen = signal(false);
  protected readonly libraryLoading = signal(false);
  protected readonly assets = signal<Asset[]>([]);
  /** Placeholder slots shown while the media library loads. */
  protected readonly skeletonSlots = [0, 1, 2, 3, 4, 5, 6, 7];

  // --- crop state ---
  protected readonly cropOpen = signal(false);
  protected readonly cropSource = signal<string | null>(null);
  private pendingName = 'image.webp';
  private readonly cropper = viewChild(ImageCropperComponent);

  protected readonly preview = computed(
    () => assetUrl(this.value()) ?? this.value(),
  );

  protected readonly cropHeader = computed(() => {
    const base = this.i18n.t('Crop image', 'اقتصاص الصورة');
    const r = this.aspectRatio();
    return r ? `${base} · ${this.ratioLabel(r)}` : base;
  });

  protected thumb(asset: Asset): string {
    return assetUrl(asset.url) ?? asset.url;
  }

  /** Human label for common aspect ratios (e.g. 1.777… → "16:9"). */
  protected ratioLabel(ratio: number): string {
    const known: Array<[number, string]> = [
      [1, '1:1'],
      [16 / 9, '16:9'],
      [4 / 3, '4:3'],
      [3 / 2, '3:2'],
      [16 / 10, '16:10'],
      [21 / 9, '21:9'],
      [3 / 4, '3:4'],
      [2 / 3, '2:3'],
      [9 / 16, '9:16'],
    ];
    for (const [value, text] of known) {
      if (Math.abs(value - ratio) < 0.02) return text;
    }
    return ratio.toFixed(2);
  }

  protected openLibrary(): void {
    this.libraryOpen.set(true);
    this.libraryLoading.set(true);
    this.api.listAssets().subscribe({
      next: (res) => {
        this.assets.set(res.items);
        this.libraryLoading.set(false);
      },
      error: () => {
        this.libraryLoading.set(false);
        this.messages.add({
          severity: 'error',
          summary: this.i18n.t('Could not load library', 'تعذر تحميل المكتبة'),
        });
      },
    });
  }

  protected pick(asset: Asset): void {
    this.value.set(asset.url);
    this.libraryOpen.set(false);
  }

  protected removeAsset(asset: Asset, event: Event): void {
    event.stopPropagation();
    this.api.deleteAsset(asset.id).subscribe({
      next: () => {
        this.assets.update((list) => list.filter((a) => a.id !== asset.id));
      },
      error: () => {
        this.messages.add({
          severity: 'error',
          summary: this.i18n.t('Delete failed', 'فشل الحذف'),
        });
      },
    });
  }

  /** A file was chosen: load it into the cropper instead of uploading raw. */
  protected onSelect(event: { files: File[] }): void {
    const file = event.files?.[0];
    if (!file) return;
    this.pendingName = this.toWebpName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      this.cropSource.set(reader.result as string);
      this.cropOpen.set(true);
      // The library defaults to a fixed square crop box; size it to the
      // forced ratio once the cropper image has laid out.
      setTimeout(() => this.initCropBox(), 80);
    };
    reader.onerror = () => {
      this.messages.add({
        severity: 'error',
        summary: this.i18n.t('Could not read file', 'تعذر قراءة الملف'),
      });
    };
    reader.readAsDataURL(file);
  }

  /** Run the crop, then upload the cropped result. */
  protected confirmCrop(): void {
    const cropper = this.cropper();
    if (!cropper) return;
    // cropImage() emits imageCroppedEvent synchronously → onCropped() uploads.
    cropper.cropImage();
  }

  protected async onCropped(dataUrl: string): Promise<void> {
    if (!dataUrl || this.uploading()) return;
    this.uploading.set(true);
    try {
      const ratio = this.aspectRatio();
      // Guarantee the exact ratio: the cropper does not enforce it on its
      // default box, so cover-fit the result to the target before upload.
      const finalUrl = ratio ? await this.coverToRatio(dataUrl, ratio) : dataUrl;
      const file = this.dataUrlToFile(finalUrl, this.pendingName);
      if (!file) throw new Error('decode failed');
      const custom = this.uploadFn();
      const url = custom
        ? await custom(file)
        : (await firstValueFrom(this.api.uploadImage(file))).url;
      this.value.set(url);
      this.cropOpen.set(false);
      this.cropSource.set(null);
      this.messages.add({
        severity: 'success',
        summary: this.i18n.t('Image uploaded', 'تم رفع الصورة'),
      });
    } catch {
      this.messages.add({
        severity: 'error',
        summary: this.i18n.t('Upload failed', 'فشل الرفع'),
      });
    } finally {
      this.uploading.set(false);
    }
  }

  protected cancelCrop(): void {
    this.cropOpen.set(false);
  }

  protected onCropHide(): void {
    this.cropSource.set(null);
  }

  protected clear(): void {
    this.value.set('');
  }

  /**
   * Size the cropper's default crop box to the forced ratio (the library
   * otherwise starts with a fixed 150×150 square). Polls until the cropper
   * image has laid out so client dimensions are available.
   */
  private initCropBox(attempt = 0): void {
    const ratio = this.aspectRatio();
    if (!ratio) return;
    const cropper = this.cropper();
    const imgEl = cropper?.imageElement?.nativeElement;
    const width = imgEl?.clientWidth ?? 0;
    const height = imgEl?.clientHeight ?? 0;
    if (!cropper || width === 0 || height === 0) {
      if (attempt < 15) setTimeout(() => this.initCropBox(attempt + 1), 80);
      return;
    }
    // Largest centered box of `ratio` that fits inside the displayed image.
    let boxW = width;
    let boxH = width / ratio;
    if (boxH > height) {
      boxH = height;
      boxW = height * ratio;
    }
    cropper.cropWidth.set(Math.round(boxW));
    cropper.cropHeight.set(Math.round(boxH));
    cropper.cropX.set(Math.round((width - boxW) / 2));
    cropper.cropY.set(Math.round((height - boxH) / 2));
  }

  /** Center-crop (cover) a data URL to an exact width/height ratio. */
  private coverToRatio(dataUrl: string, ratio: number): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const sw = img.naturalWidth;
        const sh = img.naturalHeight;
        if (!sw || !sh) {
          resolve(dataUrl);
          return;
        }
        let tw = sw;
        let th = Math.round(sw / ratio);
        if (th > sh) {
          th = sh;
          tw = Math.round(sh * ratio);
        }
        const sx = Math.round((sw - tw) / 2);
        const sy = Math.round((sh - th) / 2);
        const canvas = document.createElement('canvas');
        canvas.width = tw;
        canvas.height = th;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, sx, sy, tw, th, 0, 0, tw, th);
        resolve(canvas.toDataURL('image/webp'));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }

  // --- helpers ---
  private toWebpName(name: string): string {
    const stem = name.replace(/\.[^./\\]+$/, '') || 'image';
    return `${stem}.webp`;
  }

  /** Decode a `data:` URL into a File for upload. */
  private dataUrlToFile(dataUrl: string, name: string): File | null {
    const comma = dataUrl.indexOf(',');
    if (!dataUrl.startsWith('data:') || comma < 0) return null;
    const meta = dataUrl.slice(5, comma);
    const mime = meta.split(';')[0] || 'image/webp';
    const binary = atob(dataUrl.slice(comma + 1));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new File([bytes], name, { type: mime });
  }
}
