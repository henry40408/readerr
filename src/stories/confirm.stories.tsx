import { Confirm, ConfirmProps } from '../components/Confirm'
import { Story, action } from '@ladle/react'

export const Default: Story<ConfirmProps> = ({ message, multiple }) => (
  <>
    <Confirm
      message={message}
      multiple={multiple}
      onConfirm={action('onConfirm')}
    />
  </>
)

Default.args = {
  message: 'Delete',
  multiple: false
} as ConfirmProps
