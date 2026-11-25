/** The backend is already normalized by Host; both runtimes use the same Web routing convention. */
export function resolveOAuthWebOrigin(apiBaseUrl: string, webUrlOverride?: string | null): string {
  if (typeof webUrlOverride === 'string' && webUrlOverride.trim() !== '') {
    return new URL(webUrlOverride.trim()).origin
  }
  const url = new URL(apiBaseUrl)
  if (['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) && url.port === '8000') url.port = '5174'
  return url.origin
}

export function resolveWebAppUrl(apiBaseUrl: string, webUrlOverride?: string | null): string {
  return `${resolveOAuthWebOrigin(apiBaseUrl, webUrlOverride)}/#/`
}

export function resolveOnboardingUrl(apiBaseUrl: string, connectorId: string, flowId: string, webUrlOverride?: string | null): string {
  const url = new URL(`${resolveOAuthWebOrigin(apiBaseUrl, webUrlOverride)}/`)
  url.hash = `/onboarding?${new URLSearchParams({ source: 'dsh-plugin', connectorId, flowId })}`
  return url.href
}
