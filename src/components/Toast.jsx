import { WarningCircle } from '@phosphor-icons/react';
import toast from 'react-hot-toast';
import { Button } from './Buttons';

export function showWarningToast({
  text = 'Warning',
  actionText = 'Dismiss',
  id = Date.now(),
  icon = (
    <WarningCircle
      weight='fill'
      size={24}
      className='text-primaryAlt shrink-0'
    />
  ),
  duration = Infinity,
}) {
  return toast(
    (t) => (
      <div className='grow flex gap-x-1 items-center'>
        <span className='text-sm text-black/80 text-pretty'>{text}</span>
        <div className='inline-flex'>
          <Button
            appearance='toast'
            className='text-xs relative -right-2'
            onClick={() => toast.dismiss(t.id)}
            type='button'
          >
            {actionText}
          </Button>
        </div>
      </div>
    ),
    {
      id,
      duration,
      icon,
    }
  );
}
