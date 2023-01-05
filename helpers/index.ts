export function title(title?: string) {
  return title ? `${title} - readerr` : 'readerr'
}

const baseUrl = process.env.BASE_URL || process.env.NEXTAUTH_URL || ''

export function apiEndpoint(path: string) {
  return `${baseUrl}${path}`
}
