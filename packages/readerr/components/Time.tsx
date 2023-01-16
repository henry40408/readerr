import { dayjs } from '../helpers'

export enum TimeStyle {
  DEFAULT,
  FROM_NOW
}

export type TimeProps = { time: number; type?: TimeStyle }

export function TimeComponent({
  time: t,
  type = TimeStyle.DEFAULT
}: TimeProps) {
  const formatted = dayjs(t).format('LLLL')
  let result = formatted
  if (type === TimeStyle.FROM_NOW) result = dayjs(t).fromNow()
  return (
    <time dateTime={formatted} title={formatted}>
      {result}
    </time>
  )
}

export type FromNowProps = { time: number }

export function FromNow({ time: t }: FromNowProps) {
  return <TimeComponent time={t} type={TimeStyle.FROM_NOW} />
}
