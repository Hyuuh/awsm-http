import {
  fakerEN,
  fakerES,
  fakerFR,
  fakerDE,
  fakerIT,
  fakerPT_BR,
  fakerRU,
  fakerZH_CN,
  fakerJA,
  fakerKO,
  type Faker,
} from "@faker-js/faker";

const locales: Record<string, Faker> = {
  en: fakerEN,
  es: fakerES,
  fr: fakerFR,
  de: fakerDE,
  it: fakerIT,
  pt_BR: fakerPT_BR,
  ru: fakerRU,
  zh_CN: fakerZH_CN,
  ja: fakerJA,
  ko: fakerKO,
};

export const getFaker = (locale: string = "en"): Faker => {
  return locales[locale] || fakerEN;
};

export const AVAILABLE_LOCALES = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "it", label: "Italian" },
  { value: "pt_BR", label: "Portuguese (Brazil)" },
  { value: "ru", label: "Russian" },
  { value: "zh_CN", label: "Chinese (China)" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
];
