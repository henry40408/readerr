import React, { SyntheticEvent, useCallback, useState } from 'react'

export type ConfirmProps = {
  callback: () => Promise<void>
  message: string
}

enum Stage {
  INITIAL,
  CHOOSING,
  LOADING,
  RESOLVED
}

export const Confirm: React.FC<ConfirmProps> = (props) => {
  const [stage, setStage] = useState(Stage.INITIAL)
  const { callback } = props

  const toConfirming = useCallback((e: SyntheticEvent) => {
    e.preventDefault()
    setStage(Stage.CHOOSING)
  }, [])
  const handleConfirm = useCallback(
    (e: SyntheticEvent) => {
      e.preventDefault()
      async function run() {
        setStage(Stage.LOADING)
        await callback()
          .then(() => setStage(Stage.RESOLVED))
          .catch(() => setStage(Stage.INITIAL))
      }
      run()
    },
    [callback]
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

  if (stage === Stage.LOADING) return <div>...</div>

  return <span />
}
