import { randomUUID } from 'node:crypto';
import { SectionType } from '../common/enums';
import { LocalizedText } from '../common/types';

/** A section to seed when a template is applied (no ids/pageId yet). */
export interface TemplateSection {
  type: SectionType;
  title: LocalizedText;
  subtitle: LocalizedText;
  anchor: string;
  showInNav: boolean;
  content: Record<string, unknown>;
  settings: Record<string, unknown>;
}

export interface TemplateMeta {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  /** PrimeIcons class for the picker. */
  icon: string;
}

const uid = () => randomUUID();
const center = { background: 'none', paddingY: 'lg', align: 'center' };
const left = { background: 'none', paddingY: 'lg', align: 'left' };

/** Catalogue metadata (shown in the create dialog). */
export const TEMPLATE_CATALOG: TemplateMeta[] = [
  {
    id: 'blank',
    name: { en: 'Blank', ar: 'فارغ' },
    description: { en: 'Start from scratch with an empty page.', ar: 'ابدأ من صفحة فارغة.' },
    icon: 'pi pi-file',
  },
  {
    id: 'business',
    name: { en: 'Business', ar: 'أعمال' },
    description: {
      en: 'Hero, features, services and a contact form.',
      ar: 'بانر ومميزات وخدمات ونموذج تواصل.',
    },
    icon: 'pi pi-briefcase',
  },
  {
    id: 'restaurant',
    name: { en: 'Restaurant', ar: 'مطعم' },
    description: {
      en: 'Hero, menu highlights, gallery and contact.',
      ar: 'بانر وأبرز الأطباق ومعرض صور وتواصل.',
    },
    icon: 'pi pi-shop',
  },
  {
    id: 'portfolio',
    name: { en: 'Portfolio', ar: 'أعمالي' },
    description: {
      en: 'Hero intro, work gallery, about and contact.',
      ar: 'مقدمة ومعرض أعمال ونبذة وتواصل.',
    },
    icon: 'pi pi-images',
  },
];

function hero(headlineEn: string, headlineAr: string, subEn: string, subAr: string): TemplateSection {
  return {
    type: SectionType.HERO,
    title: {},
    subtitle: {},
    anchor: 'home',
    showInNav: false,
    content: {
      headline: { en: headlineEn, ar: headlineAr },
      subheadline: { en: subEn, ar: subAr },
      imageUrl: '',
      overlay: true,
      align: 'center',
      buttons: [
        { id: uid(), label: { en: 'Get in touch', ar: 'تواصل معنا' }, url: '#contact', style: 'primary' },
      ],
    },
    settings: center,
  };
}

function contact(): TemplateSection {
  return {
    type: SectionType.CONTACT,
    title: { en: 'Get in touch', ar: 'تواصل معنا' },
    subtitle: { en: 'We would love to hear from you', ar: 'يسعدنا تواصلك معنا' },
    anchor: 'contact',
    showInNav: true,
    content: {
      description: { en: '<p>Send us a message and we will reply soon.</p>', ar: '<p>أرسل لنا رسالة وسنرد قريباً.</p>' },
      recipientEmail: '',
      showPhone: true,
      whatsappNumber: '',
      successMessage: { en: 'Thanks! We will be in touch.', ar: 'شكراً! سنتواصل معك.' },
    },
    settings: center,
  };
}

function cards(titleEn: string, titleAr: string, anchor: string, items: Array<[string, string, string, string]>): TemplateSection {
  return {
    type: SectionType.CARDS,
    title: { en: titleEn, ar: titleAr },
    subtitle: {},
    anchor,
    showInNav: true,
    content: {
      columns: 3,
      items: items.map(([te, ta, be, ba]) => ({
        id: uid(),
        title: { en: te, ar: ta },
        body: { en: `<p>${be}</p>`, ar: `<p>${ba}</p>` },
      })),
    },
    settings: center,
  };
}

function features(): TemplateSection {
  return {
    type: SectionType.FEATURES,
    title: { en: 'Why choose us', ar: 'لماذا تختارنا' },
    subtitle: {},
    anchor: 'features',
    showInNav: true,
    content: {
      items: [
        { id: uid(), icon: 'pi pi-bolt', title: { en: 'Fast', ar: 'سريع' }, body: { en: '<p>Quick and reliable.</p>', ar: '<p>سريع وموثوق.</p>' } },
        { id: uid(), icon: 'pi pi-shield', title: { en: 'Trusted', ar: 'موثوق' }, body: { en: '<p>Quality you can trust.</p>', ar: '<p>جودة تثق بها.</p>' } },
        { id: uid(), icon: 'pi pi-heart', title: { en: 'Loved', ar: 'محبوب' }, body: { en: '<p>Customers love us.</p>', ar: '<p>عملاؤنا يحبوننا.</p>' } },
      ],
    },
    settings: { background: 'muted', paddingY: 'lg', align: 'center' },
  };
}

function gallery(): TemplateSection {
  return {
    type: SectionType.GALLERY,
    title: { en: 'Gallery', ar: 'المعرض' },
    subtitle: {},
    anchor: 'gallery',
    showInNav: true,
    content: { columns: 3, images: [] },
    settings: left,
  };
}

/** Build the section graph for a template id (empty for blank/unknown). */
export function buildTemplateSections(templateId: string | undefined): TemplateSection[] {
  switch (templateId) {
    case 'business':
      return [
        hero('Grow your business with us', 'نمِّ أعمالك معنا', 'Modern solutions for ambitious teams.', 'حلول عصرية للفرق الطموحة.'),
        features(),
        cards('Our services', 'خدماتنا', 'services', [
          ['Consulting', 'استشارات', 'Expert advice tailored to you.', 'نصائح خبيرة مصممة لك.'],
          ['Implementation', 'تنفيذ', 'We build it end to end.', 'نبنيه من البداية للنهاية.'],
          ['Support', 'دعم', 'Ongoing help when you need it.', 'دعم مستمر عند الحاجة.'],
        ]),
        contact(),
      ];
    case 'restaurant':
      return [
        hero('Delicious food, made fresh', 'طعام لذيذ، طازج دائماً', 'Come taste the difference.', 'تعال وتذوق الفرق.'),
        cards('Menu highlights', 'أبرز الأطباق', 'menu', [
          ['Starters', 'المقبلات', 'Fresh and flavourful.', 'طازجة ولذيذة.'],
          ['Mains', 'الأطباق الرئيسية', 'Hearty and satisfying.', 'مشبعة وشهية.'],
          ['Desserts', 'الحلويات', 'Sweet endings.', 'نهايات حلوة.'],
        ]),
        gallery(),
        contact(),
      ];
    case 'portfolio':
      return [
        hero('Hi, I build great things', 'مرحباً، أصنع أشياء رائعة', 'Designer & developer.', 'مصمم ومطور.'),
        gallery(),
        cards('About', 'نبذة', 'about', [
          ['Experience', 'الخبرة', 'Years of crafting digital products.', 'سنوات في صناعة المنتجات الرقمية.'],
          ['Skills', 'المهارات', 'Design, code and everything between.', 'تصميم وبرمجة وكل ما بينهما.'],
          ['Approach', 'الأسلوب', 'User-first, detail-obsessed.', 'المستخدم أولاً، واهتمام بالتفاصيل.'],
        ]),
        contact(),
      ];
    case 'blank':
    default:
      return [];
  }
}
