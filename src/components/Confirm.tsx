import React, { SyntheticEvent, useCallback, useState } from 'react'

export interface ConfirmProps {
  message: string
  onConfirm: (e: boolean) => void
  multiple?: boolean
}

enum Stage {
  INITIAL,
  CONFIRMING,
  CONFIRMED
}

export const Confirm: React.FC<ConfirmProps> = (props) => {
  const { multiple = false, onConfirm } = props
  const [stage, setStage] = useState(Stage.INITIAL)

  const handleCancel = useCallback((e: SyntheticEvent) => {
    e.preventDefault()
    setStage(Stage.INITIAL)
  }, [])

  const handleConfirm = useCallback(
    (e: SyntheticEvent) => {
      e.preventDefault()
      setStage(Stage.CONFIRMED)
      onConfirm(true)
      if (multiple) setStage(Stage.INITIAL)
    },
    [multiple, onConfirm]
  )

  const handleRequest = useCallback((e: SyntheticEvent) => {
    e.preventDefault()
    setStage(Stage.CONFIRMING)
  }, [])

  if (stage === Stage.INITIAL)
    return (
      <span className="dark:text-white">
        <a className="underline" href="#" onClick={handleRequest}>
          {props.message}
        </a>
      </span>
    )

  if (stage === Stage.CONFIRMING)
    return (
      <span className="dark:text-white">
        {`${props.message}? `}
        <a className="underline text-red-500" href="#" onClick={handleConfirm}>
          Yes
        </a>
        {', '}
        <a className="underline" href="#" onClick={handleCancel}>
          No
        </a>
      </span>
    )

  return <span />
}
