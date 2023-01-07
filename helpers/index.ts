import dayjs from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(localizedFormat)
dayjs.extend(relativeTime)

export function title(title?: string) {
  return title ? `${title} - readerr` : 'readerr'
}

const baseUrl = process.env.BASE_URL || process.env.NEXTAUTH_URL || ''

export function apiEndpoint(path: string) {
  return `${baseUrl}${path}`
}

export { dayjs }
