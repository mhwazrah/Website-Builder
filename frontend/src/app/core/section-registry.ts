import {
  AccordionContent,
  CardsContent,
  CarouselContent,
  ContactContent,
  CtaContent,
  EmailContent,
  FeaturesContent,
  GalleryContent,
  HeroContent,
  LocalizedText,
  LogosContent,
  MapContent,
  PricingContent,
  RichTextContent,
  SectionContent,
  SectionType,
  SocialContent,
  StatsContent,
  StepsContent,
  TeamContent,
  TestimonialsContent,
  VideoContent,
  WhatsappContent,
} from './models';

export interface SectionTypeMeta {
  type: SectionType;
  label: string;
  /** PrimeIcons class. */
  icon: string;
  description: string;
  implemented: boolean;
  /** Builder palette grouping. */
  group: 'Headers' | 'Content' | 'Media' | 'Social' | 'Contact';
  defaultContent: () => SectionContent;
}

export function uid(): string {
  const c = globalThis.crypto as Crypto | undefined;
  return c?.randomUUID ? c.randomUUID() : Math.random().toString(36).slice(2);
}

export const SECTION_TYPES: SectionTypeMeta[] = [
  {
    type: 'hero',
    label: 'Hero',
    icon: 'pi pi-megaphone',
    description: 'A bold banner with headline, image and call-to-action.',
    implemented: true,
    group: 'Headers',
    defaultContent: (): HeroContent => ({
      headline: { en: 'Welcome to our business', ar: 'مرحبًا بكم في شركتنا' },
      subheadline: {
        en: 'We help you achieve more, every day.',
        ar: 'نساعدك على تحقيق المزيد، كل يوم.',
      },
      imageUrl: '',
      overlay: true,
      align: 'center',
      buttons: [
        {
          id: uid(),
          label: { en: 'Get started', ar: 'ابدأ الآن' },
          url: '#contact',
          style: 'primary',
        },
      ],
    }),
  },
  {
    type: 'cards',
    label: 'Cards',
    icon: 'pi pi-th-large',
    description: 'A responsive grid of image / title / text cards.',
    implemented: true,
    group: 'Content',
    defaultContent: (): CardsContent => ({
      columns: 3,
      items: [0, 1, 2].map(() => ({
        id: uid(),
        title: { en: 'Card title', ar: 'عنوان البطاقة' },
        body: {
          en: '<p>Short description for this card.</p>',
          ar: '<p>وصف قصير لهذه البطاقة.</p>',
        },
      })),
    }),
  },
  {
    type: 'features',
    label: 'Features',
    icon: 'pi pi-star',
    description: 'Key features as image-and-text rows, image on one side.',
    implemented: true,
    group: 'Content',
    defaultContent: (): FeaturesContent => ({
      items: [
        { id: uid(), icon: 'pi pi-bolt', title: { en: 'Fast', ar: 'سريع' }, body: { en: '<p>Lightning quick.</p>', ar: '<p>سريع كالبرق.</p>' } },
        { id: uid(), icon: 'pi pi-shield', title: { en: 'Secure', ar: 'آمن' }, body: { en: '<p>Safe and reliable.</p>', ar: '<p>آمن وموثوق.</p>' } },
        { id: uid(), icon: 'pi pi-heart', title: { en: 'Loved', ar: 'محبوب' }, body: { en: '<p>Customers love it.</p>', ar: '<p>عملاؤنا يحبونه.</p>' } },
      ],
    }),
  },
  {
    type: 'accordion',
    label: 'Accordion / FAQ',
    icon: 'pi pi-list',
    description: 'Expandable question-and-answer panels.',
    implemented: true,
    group: 'Content',
    defaultContent: (): AccordionContent => ({
      multiple: false,
      items: [1, 2].map((i) => ({
        id: uid(),
        header: { en: `Question ${i}`, ar: `سؤال ${i}` },
        body: { en: '<p>Answer goes here.</p>', ar: '<p>الإجابة هنا.</p>' },
      })),
    }),
  },
  {
    type: 'gallery',
    label: 'Gallery',
    icon: 'pi pi-images',
    description: 'A grid of images with optional captions.',
    implemented: true,
    group: 'Media',
    defaultContent: (): GalleryContent => ({ columns: 3, images: [] }),
  },
  {
    type: 'carousel',
    label: 'Carousel',
    icon: 'pi pi-sync',
    description: 'A rotating slideshow of images.',
    implemented: true,
    group: 'Media',
    defaultContent: (): CarouselContent => ({
      autoplay: true,
      intervalMs: 5000,
      slides: [],
    }),
  },
  {
    type: 'testimonials',
    label: 'Testimonials',
    icon: 'pi pi-comments',
    description: 'Customer quotes with author and rating.',
    implemented: true,
    group: 'Content',
    defaultContent: (): TestimonialsContent => ({
      columns: 2,
      items: [
        {
          id: uid(),
          quote: { en: 'Absolutely fantastic service!', ar: 'خدمة رائعة حقًا!' },
          author: { en: 'Sarah A.', ar: 'سارة أ.' },
          role: { en: 'Customer', ar: 'عميلة' },
          rating: 5,
        },
        {
          id: uid(),
          quote: { en: 'Highly recommended.', ar: 'أنصح به بشدة.' },
          author: { en: 'John D.', ar: 'جون د.' },
          role: { en: 'Customer', ar: 'عميل' },
          rating: 5,
        },
      ],
    }),
  },
  {
    type: 'stats',
    label: 'Stats',
    icon: 'pi pi-chart-bar',
    description: 'Eye-catching numbers and metrics.',
    implemented: true,
    group: 'Content',
    defaultContent: (): StatsContent => ({
      items: [
        { id: uid(), value: { en: '500+', ar: '+500' }, label: { en: 'Happy clients', ar: 'عميل سعيد' } },
        { id: uid(), value: { en: '10y', ar: '10 سنوات' }, label: { en: 'Experience', ar: 'خبرة' } },
        { id: uid(), value: { en: '24/7', ar: '24/7' }, label: { en: 'Support', ar: 'دعم' } },
      ],
    }),
  },
  {
    type: 'cta',
    label: 'Call to action',
    icon: 'pi pi-flag',
    description: 'A focused banner that drives one action.',
    implemented: true,
    group: 'Headers',
    defaultContent: (): CtaContent => ({
      heading: { en: 'Ready to get started?', ar: 'هل أنت مستعد للبدء؟' },
      text: { en: 'Reach out today and let’s talk.', ar: 'تواصل معنا اليوم ولنتحدث.' },
      button: {
        id: uid(),
        label: { en: 'Contact us', ar: 'تواصل معنا' },
        url: '#contact',
        style: 'primary',
      },
    }),
  },
  {
    type: 'richtext',
    label: 'Rich text',
    icon: 'pi pi-align-left',
    description: 'A free-form formatted text block.',
    implemented: true,
    group: 'Content',
    defaultContent: (): RichTextContent => ({
      body: {
        en: '<p>Write something about your business here…</p>',
        ar: '<p>اكتب شيئًا عن عملك هنا…</p>',
      },
      maxWidth: 'normal',
    }),
  },
  {
    type: 'contact',
    label: 'Contact us',
    icon: 'pi pi-envelope',
    description: 'Contact form with email delivery + WhatsApp click-to-chat.',
    implemented: true,
    group: 'Contact',
    defaultContent: (): ContactContent => ({
      description: {
        en: '<p>Have a question? Send us a message.</p>',
        ar: '<p>لديك سؤال؟ أرسل لنا رسالة.</p>',
      },
      recipientEmail: '',
      showPhone: true,
      whatsappNumber: '',
      successMessage: {
        en: 'Thanks! We will get back to you soon.',
        ar: 'شكراً! سنعاود التواصل معك قريباً.',
      },
    }),
  },
  {
    type: 'social',
    label: 'Social links',
    icon: 'pi pi-share-alt',
    description: 'A row of social-media links.',
    implemented: true,
    group: 'Social',
    defaultContent: (): SocialContent => ({
      links: [
        { id: uid(), platform: 'facebook', url: '' },
        { id: uid(), platform: 'instagram', url: '' },
        { id: uid(), platform: 'twitter', url: '' },
      ],
    }),
  },
  {
    type: 'whatsapp',
    label: 'WhatsApp chat',
    icon: 'pi pi-whatsapp',
    description: 'A click-to-chat WhatsApp button.',
    implemented: true,
    group: 'Contact',
    defaultContent: (): WhatsappContent => ({
      phone: '',
      message: { en: 'Hello! I have a question.', ar: 'مرحبًا! لدي سؤال.' },
      label: { en: 'Chat on WhatsApp', ar: 'تواصل عبر واتساب' },
      floating: false,
    }),
  },
  {
    type: 'email',
    label: 'Email us',
    icon: 'pi pi-at',
    description: 'A mailto call-to-action block.',
    implemented: true,
    group: 'Contact',
    defaultContent: (): EmailContent => ({
      email: '',
      subject: { en: 'Website enquiry', ar: 'استفسار من الموقع' },
      description: {
        en: '<p>Prefer email? Reach us directly.</p>',
        ar: '<p>تفضل البريد الإلكتروني؟ تواصل معنا مباشرة.</p>',
      },
      label: { en: 'Email us', ar: 'راسلنا' },
    }),
  },
  {
    type: 'pricing',
    label: 'Pricing',
    icon: 'pi pi-tags',
    description: 'Comparison of pricing plans with features.',
    implemented: true,
    group: 'Content',
    defaultContent: (): PricingContent => ({
      plans: [
        {
          id: uid(),
          name: { en: 'Starter', ar: 'مبتدئ' },
          price: { en: '$9', ar: '9$' },
          period: { en: '/mo', ar: '/شهر' },
          highlighted: false,
          buttonLabel: { en: 'Choose', ar: 'اختر' },
          buttonUrl: '#contact',
          features: [
            { id: uid(), text: { en: '1 project', ar: 'مشروع واحد' } },
            { id: uid(), text: { en: 'Email support', ar: 'دعم بالبريد' } },
          ],
        },
        {
          id: uid(),
          name: { en: 'Pro', ar: 'احترافي' },
          price: { en: '$29', ar: '29$' },
          period: { en: '/mo', ar: '/شهر' },
          highlighted: true,
          buttonLabel: { en: 'Choose', ar: 'اختر' },
          buttonUrl: '#contact',
          features: [
            { id: uid(), text: { en: '10 projects', ar: '10 مشاريع' } },
            { id: uid(), text: { en: 'Priority support', ar: 'دعم ذو أولوية' } },
            { id: uid(), text: { en: 'Analytics', ar: 'تحليلات' } },
          ],
        },
        {
          id: uid(),
          name: { en: 'Business', ar: 'أعمال' },
          price: { en: '$99', ar: '99$' },
          period: { en: '/mo', ar: '/شهر' },
          highlighted: false,
          buttonLabel: { en: 'Choose', ar: 'اختر' },
          buttonUrl: '#contact',
          features: [
            { id: uid(), text: { en: 'Unlimited', ar: 'غير محدود' } },
            { id: uid(), text: { en: 'Dedicated manager', ar: 'مدير مخصص' } },
          ],
        },
      ],
    }),
  },
  {
    type: 'team',
    label: 'Team',
    icon: 'pi pi-users',
    description: 'Meet-the-team grid with photos and roles.',
    implemented: true,
    group: 'Content',
    defaultContent: (): TeamContent => ({
      columns: 3,
      members: [
        { id: uid(), name: { en: 'Alex Doe', ar: 'أليكس' }, role: { en: 'Founder', ar: 'المؤسس' }, bio: { en: '<p>Leads the vision.</p>', ar: '<p>يقود الرؤية.</p>' } },
        { id: uid(), name: { en: 'Sam Lee', ar: 'سام' }, role: { en: 'Designer', ar: 'مصمم' }, bio: { en: '<p>Crafts the experience.</p>', ar: '<p>يصمم التجربة.</p>' } },
        { id: uid(), name: { en: 'Jo Park', ar: 'جو' }, role: { en: 'Engineer', ar: 'مهندس' }, bio: { en: '<p>Builds it all.</p>', ar: '<p>يبني كل شيء.</p>' } },
      ],
    }),
  },
  {
    type: 'logos',
    label: 'Logos',
    icon: 'pi pi-building',
    description: 'A strip of client / partner logos.',
    implemented: true,
    group: 'Media',
    defaultContent: (): LogosContent => ({ grayscale: true, logos: [] }),
  },
  {
    type: 'video',
    label: 'Video',
    icon: 'pi pi-video',
    description: 'Embed a YouTube / Vimeo / hosted video.',
    implemented: true,
    group: 'Media',
    defaultContent: (): VideoContent => ({
      provider: 'youtube',
      url: '',
      caption: { en: '', ar: '' },
    }),
  },
  {
    type: 'map',
    label: 'Map',
    icon: 'pi pi-map-marker',
    description: 'An embedded location map.',
    implemented: true,
    group: 'Contact',
    defaultContent: (): MapContent => ({
      query: '',
      zoom: 14,
      height: 360,
      caption: { en: '', ar: '' },
    }),
  },
  {
    type: 'steps',
    label: 'Steps',
    icon: 'pi pi-sitemap',
    description: 'A numbered process / how-it-works.',
    implemented: true,
    group: 'Content',
    defaultContent: (): StepsContent => ({
      layout: 'vertical',
      items: [
        { id: uid(), icon: 'pi pi-search', title: { en: 'Discover', ar: 'اكتشف' }, body: { en: '<p>We learn your needs.</p>', ar: '<p>نفهم احتياجاتك.</p>' } },
        { id: uid(), icon: 'pi pi-pencil', title: { en: 'Design', ar: 'صمّم' }, body: { en: '<p>We craft the plan.</p>', ar: '<p>نضع الخطة.</p>' } },
        { id: uid(), icon: 'pi pi-check', title: { en: 'Deliver', ar: 'سلّم' }, body: { en: '<p>We ship results.</p>', ar: '<p>نحقق النتائج.</p>' } },
      ],
    }),
  },
];

export function sectionMeta(type: SectionType): SectionTypeMeta {
  return SECTION_TYPES.find((s) => s.type === type) ?? SECTION_TYPES[0];
}

/**
 * Professional bilingual sample headings for section types whose renderer shows
 * the section title as its <h2>. New sections start with these (like Wix's
 * sample copy) instead of the raw palette label. Types not listed (hero, cta,
 * social, whatsapp, email, richtext, video) render their own heading from
 * content, so their section title stays empty.
 */
const DEFAULT_SECTION_TITLES: Partial<Record<SectionType, LocalizedText>> = {
  cards: { en: 'Why choose us', ar: 'لماذا تختارنا' },
  features: { en: 'What we offer', ar: 'ما نقدمه' },
  accordion: { en: 'Frequently asked questions', ar: 'الأسئلة الشائعة' },
  gallery: { en: 'Our gallery', ar: 'معرض الصور' },
  carousel: { en: 'Highlights', ar: 'أبرز الأعمال' },
  testimonials: { en: 'What our clients say', ar: 'ماذا يقول عملاؤنا' },
  stats: { en: 'By the numbers', ar: 'أرقامنا' },
  pricing: { en: 'Plans & pricing', ar: 'الباقات والأسعار' },
  team: { en: 'Meet the team', ar: 'تعرّف على الفريق' },
  logos: { en: 'Trusted by', ar: 'يثقون بنا' },
  steps: { en: 'How it works', ar: 'كيف نعمل' },
  contact: { en: 'Get in touch', ar: 'تواصل معنا' },
  map: { en: 'Find us', ar: 'موقعنا' },
};

/** A sensible bilingual default heading for a new section (may be empty). */
export function defaultSectionTitle(type: SectionType): LocalizedText {
  const t = DEFAULT_SECTION_TITLES[type];
  return t ? { ...t } : {};
}

/** Arabic labels + descriptions for each section type (admin UI translation). */
export const SECTION_LABELS_AR: Record<
  SectionType,
  { label: string; description: string }
> = {
  hero: { label: 'البانر الرئيسي', description: 'بانر بارز بعنوان وصورة ودعوة لاتخاذ إجراء.' },
  cards: { label: 'البطاقات', description: 'شبكة متجاوبة من البطاقات بصورة وعنوان ونص.' },
  features: { label: 'المميزات', description: 'مميزات رئيسية في صفوف من صورة ونص، الصورة على أحد الجانبين.' },
  accordion: { label: 'الأسئلة الشائعة', description: 'لوحات قابلة للطي للأسئلة والأجوبة.' },
  gallery: { label: 'المعرض', description: 'شبكة من الصور مع تعليقات اختيارية.' },
  carousel: { label: 'العارض الدوّار', description: 'عرض شرائح متحرّك من الصور.' },
  testimonials: { label: 'آراء العملاء', description: 'اقتباسات العملاء مع الاسم والتقييم.' },
  stats: { label: 'الإحصائيات', description: 'أرقام ومقاييس لافتة للنظر.' },
  cta: { label: 'دعوة لاتخاذ إجراء', description: 'شريط مركّز يحثّ على إجراء واحد.' },
  richtext: { label: 'نص منسّق', description: 'كتلة نص حرّ منسّق.' },
  contact: { label: 'تواصل معنا', description: 'نموذج تواصل مع إرسال بريد وزر واتساب.' },
  social: { label: 'روابط التواصل', description: 'صف من روابط وسائل التواصل الاجتماعي.' },
  whatsapp: { label: 'محادثة واتساب', description: 'زر للمحادثة الفورية عبر واتساب.' },
  email: { label: 'راسلنا', description: 'كتلة دعوة للمراسلة عبر البريد الإلكتروني.' },
  pricing: { label: 'الأسعار', description: 'مقارنة بين باقات الأسعار والمميزات.' },
  team: { label: 'الفريق', description: 'شبكة تعريف بأعضاء الفريق وصورهم.' },
  logos: { label: 'الشعارات', description: 'شريط من شعارات العملاء أو الشركاء.' },
  video: { label: 'فيديو', description: 'تضمين فيديو من يوتيوب أو فيميو.' },
  map: { label: 'الخريطة', description: 'خريطة موقع مضمّنة.' },
  steps: { label: 'الخطوات', description: 'خطوات مرقّمة لكيفية العمل.' },
};

const GROUP_LABELS_AR: Record<string, string> = {
  Headers: 'الرؤوس',
  Content: 'المحتوى',
  Media: 'الوسائط',
  Social: 'التواصل الاجتماعي',
  Contact: 'التواصل',
};

export function sectionLabel(type: SectionType, isAr: boolean): string {
  return isAr ? SECTION_LABELS_AR[type].label : sectionMeta(type).label;
}
export function sectionDescription(type: SectionType, isAr: boolean): string {
  return isAr ? SECTION_LABELS_AR[type].description : sectionMeta(type).description;
}
export function groupLabel(group: string, isAr: boolean): string {
  return isAr ? (GROUP_LABELS_AR[group] ?? group) : group;
}
