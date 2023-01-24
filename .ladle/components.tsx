import React from 'react'
import type { GlobalProvider } from '@ladle/react'

import '../src/styles/globals.css'

export const Provider: GlobalProvider = ({ globalState, children }) => (
  <>
    <div className={globalState.theme === 'dark' ? 'dark' : ''}>{children}</div>
  </>
)
