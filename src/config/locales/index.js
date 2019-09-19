import enMessages from './en';


export function getLocaleMessages(locale) {
  if (locale.startsWith('en')) {
    return enMessages;
  }
}

export const locales = ['en'];