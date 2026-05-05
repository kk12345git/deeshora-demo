import {getRequestConfig} from 'next-intl/server';
import {routing} from './routing';
 
export default getRequestConfig(async ({locale}) => {
  let localeToUse = locale;
  if (!routing.locales.includes(localeToUse as any)) {
    localeToUse = routing.defaultLocale;
  }
 
  return {
    locale: localeToUse as string,
    messages: (await import(`../../messages/${localeToUse}.json`)).default
  };
});
