import { dayjs } from '../helpers'

export enum TimeStyle {
  DEFAULT,
  FROM_NOW
}

export interface TimeProps {
  time: number
  type?: TimeStyle
}

export function Time(props: TimeProps) {
  const formatted = dayjs(props.time).format('LLLL')
  let result = formatted
  if (props.type === TimeStyle.FROM_NOW) result = dayjs(props.time).fromNow()
  return (
    <time dateTime={formatted} title={formatted}>
      {result}
    </time>
  )
}

export interface FromNowProps {
  time: number
}

export function FromNow({ time: t }: FromNowProps) {
  return <Time time={t} type={TimeStyle.FROM_NOW} />
}
