import type { AcceptedLanguages } from '@payloadcms/translations'
import type { ImportMap, SanitizedConfig, ServerFunctionClient } from 'payload'

import { rtlLanguages } from '@payloadcms/translations'
import { RootProvider } from '@payloadcms/ui'
import { getClientConfig } from '@payloadcms/ui/utilities/getClientConfig'
import { headers as getHeaders, cookies as nextCookies } from 'next/headers.js'
import { getPayload, parseCookies } from 'payload'
import React from 'react'

import { getNavPrefs } from '../../elements/Nav/getNavPrefs.js'
import { getRequestLanguage } from '../../utilities/getRequestLanguage.js'
import { getRequestLocale } from '../../utilities/getRequestLocale.js'
import { getRequestTheme } from '../../utilities/getRequestTheme.js'
import { initReq } from '../../utilities/initReq.js'
import { checkDependencies } from './checkDependencies.js'
import { NestProviders } from './NestProviders.js'

import '@payloadcms/ui/scss/app.scss'

export const metadata = {
  description: 'Generated by Next.js',
  title: 'Next.js',
}

export const RootLayout = async ({
  children,
  config: configPromise,
  importMap,
  serverFunction,
}: {
  readonly children: React.ReactNode
  readonly config: Promise<SanitizedConfig>
  readonly importMap: ImportMap
  readonly serverFunction: ServerFunctionClient
}) => {
  checkDependencies()

  const config = await configPromise

  const headers = await getHeaders()
  const cookies = parseCookies(headers)

  const languageCode = getRequestLanguage({
    config,
    cookies,
    headers,
  })

  const theme = getRequestTheme({
    config,
    cookies,
    headers,
  })

  const payload = await getPayload({ config, importMap })

  const { i18n, permissions, user } = await initReq(config)

  const dir = (rtlLanguages as unknown as AcceptedLanguages[]).includes(languageCode)
    ? 'RTL'
    : 'LTR'

  const languageOptions = Object.entries(config.i18n.supportedLanguages || {}).reduce(
    (acc, [language, languageConfig]) => {
      if (Object.keys(config.i18n.supportedLanguages).includes(language)) {
        acc.push({
          label: languageConfig.translations.general.thisLanguage,
          value: language,
        })
      }

      return acc
    },
    [],
  )

  async function switchLanguageServerAction(lang: string): Promise<void> {
    'use server'
    const cookies = await nextCookies()
    cookies.set({
      name: `${config.cookiePrefix || 'payload'}-lng`,
      path: '/',
      value: lang,
    })
  }

  const navPrefs = await getNavPrefs({ payload, user })

  const clientConfig = getClientConfig({
    config,
    i18n,
    importMap,
  })

  const locale = await getRequestLocale({
    payload,
    user,
  })

  return (
    <html
      data-theme={theme}
      dir={dir}
      lang={languageCode}
      suppressHydrationWarning={config?.admin?.suppressHydrationWarning ?? false}
    >
      <head>
        <style>{`@layer payload-default, payload;`}</style>
      </head>
      <body>
        <RootProvider
          config={clientConfig}
          dateFNSKey={i18n.dateFNSKey}
          fallbackLang={config.i18n.fallbackLanguage}
          isNavOpen={navPrefs?.open ?? true}
          languageCode={languageCode}
          languageOptions={languageOptions}
          locale={locale?.code}
          permissions={permissions}
          serverFunction={serverFunction}
          switchLanguageServerAction={switchLanguageServerAction}
          theme={theme}
          translations={i18n.translations}
          user={user}
        >
          {Array.isArray(config.admin?.components?.providers) &&
          config.admin?.components?.providers.length > 0 ? (
            <NestProviders
              importMap={payload.importMap}
              providers={config.admin?.components?.providers}
              serverProps={{
                i18n,
                payload,
                permissions,
                user,
              }}
            >
              {children}
            </NestProviders>
          ) : (
            children
          )}
        </RootProvider>
        <div id="portal" />
      </body>
    </html>
  )
}
