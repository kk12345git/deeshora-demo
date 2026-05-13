import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ locale }) => {
  let localeToUse = locale;
  if (!routing.locales.includes(localeToUse as any)) {
    localeToUse = routing.defaultLocale;
  }

  try {
    return {
      locale: localeToUse as string,
      messages: (await import(`../../messages/${localeToUse}.json`)).default,
    };
  } catch (error) {
    console.error(
      `[i18n] Failed to load messages for ${localeToUse}, falling back to default:`,
      error,
    );
    return {
      locale: routing.defaultLocale,
      messages: (await import(`../../messages/${routing.defaultLocale}.json`))
        .default,
    };
  }
});
