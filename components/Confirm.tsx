import React, { SyntheticEvent, useCallback, useState } from 'react'

export interface ConfirmProps {
  message: string
  onConfirm: () => Promise<void>
  multiple?: boolean
}

enum Stage {
  INITIAL,
  CHOOSING,
  LOADING,
  RESOLVED
}

export const Confirm: React.FC<ConfirmProps> = (props) => {
  const [stage, setStage] = useState(Stage.INITIAL)
  const { multiple, onConfirm } = props

  const toConfirming = useCallback((e: SyntheticEvent) => {
    e.preventDefault()
    setStage(Stage.CHOOSING)
  }, [])
  const handleConfirm = useCallback(
    (e: SyntheticEvent) => {
      e.preventDefault()
      setStage(Stage.LOADING)
      onConfirm()
        .then(() =>
          multiple ? setStage(Stage.INITIAL) : setStage(Stage.RESOLVED)
        )
        .catch(() => setStage(Stage.INITIAL))
    },
    [multiple, onConfirm]
  )
  const handleCancel = useCallback((e: SyntheticEvent) => {
    e.preventDefault()
    setStage(Stage.INITIAL)
  }, [])

  if (stage === Stage.INITIAL)
    return (
      <a href="#" onClick={toConfirming}>
        {props.message}
      </a>
    )

  if (stage === Stage.CHOOSING)
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

  if (stage === Stage.LOADING) return <>...</>

  return <span />
}
