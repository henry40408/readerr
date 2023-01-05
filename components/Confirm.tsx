import React, { SyntheticEvent, useCallback, useReducer } from 'react'

export type ConfirmProps = {
  callback: () => void
  message: string
}

enum Stage {
  INITIAL,
  CONFIRMING,
  CONFIRMED
}

enum Action {
  CONFIRMING,
  CONFIRM,
  CANCEL
}

function reducer(_stage: Stage, action: Action) {
  switch (action) {
    case Action.CONFIRMING:
      return Stage.CONFIRMING
    case Action.CONFIRM:
      return Stage.CONFIRMED
    case Action.CANCEL:
      return Stage.INITIAL
    default:
      throw new Error(`unexpected action: ${action}`)
  }
}

export const Confirm: React.FC<ConfirmProps> = (props) => {
  const [stage, dispatch] = useReducer(reducer, Stage.INITIAL)
  const { callback } = props

  const toConfirming = useCallback((e: SyntheticEvent) => {
    e.preventDefault()
    dispatch(Action.CONFIRMING)
  }, [])
  const handleConfirm = useCallback(
    (e: SyntheticEvent) => {
      e.preventDefault()
      dispatch(Action.CONFIRM)
      callback()
    },
    [callback]
  )
  const handleCancel = useCallback((e: SyntheticEvent) => {
    e.preventDefault()
    dispatch(Action.CANCEL)
  }, [])

  if (stage === Stage.INITIAL)
    return (
      <a href="#" onClick={toConfirming}>
        {props.message}
      </a>
    )

  if (stage === Stage.CONFIRMING)
    return (
      <>
        {`${props.message}?`}
        <a href="#" onClick={handleConfirm}>
          Yes
        </a>
        ,
        <a href="#" onClick={handleCancel}>
          No
        </a>
      </>
    )

  return <span />
}
