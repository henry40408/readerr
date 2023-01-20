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

  const handleRequest = useCallback((e: SyntheticEvent) => {
    e.preventDefault()
    setStage(Stage.CONFIRMING)
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

  const handleCancel = useCallback((e: SyntheticEvent) => {
    e.preventDefault()
    setStage(Stage.INITIAL)
  }, [])

  if (stage === Stage.INITIAL)
    return (
      <a href="#" onClick={handleRequest}>
        {props.message}
      </a>
    )

  if (stage === Stage.CONFIRMING)
    return (
      <>
        {`${props.message}? `}
        <a href="#" onClick={handleConfirm}>
          Yes
        </a>
        {', '}
        <a href="#" onClick={handleCancel}>
          No
        </a>
      </>
    )

  return <span />
}
