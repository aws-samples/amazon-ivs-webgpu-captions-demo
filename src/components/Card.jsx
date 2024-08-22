import Spinner from './Spinner';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Link } from '../router';

export function Card({
  appearance,
  style,
  fullWidth,
  loading,
  loaderSize = 'default',
  children,
  href = undefined,
  className,
  ...buttonProps
}) {
  const typeClass = twMerge(
    clsx(
      'ring-1 hover:ring-2 focus:ring-2',
      'ring-inset',
      'ring-uiText/5 hover:ring-uiText/20 focus:ring-uiText/20',
      'outline-none',
      'cursor-pointer disabled:cursor-not-allowed',
      'appearance-none',
      'inline-flex',
      'items-center',
      'justify-start',
      'rounded-lg',
      'bg-surfaceAlt/90 hover:bg-surfaceAlt',
      'disabled:opacity-75 disabled:pointer-events-none disabled:ring-0',
      'text-uiText/90 hover:text-uiText disabled:opacity-50',
      'select-none',
      'leading-none',
      'group/card',
      {
        'bg-primary/10 ring-2 ring-primary/10 text-primaryAlt hover:bg-primary/20 hover:text-primaryAlt hover:ring-primary/20 focus:text-primaryAlt focus:ring-primary/40':
          appearance === 'primary',
        'bg-secondary text-uiText/90 hover:text-uiText/100 focus:text-uiText/100':
          appearance === 'secondary',
        'bg-destruct/10 ring-2 ring-destruct/10 text-destruct hover:text-destructAlt hover:ring-destruct/20 hover:bg-destruct/20 focus:text-destructAlt focus:ring-destruct/40 focus:bg-destruct/20':
          appearance === 'destruct',
        'bg-positive/10 ring-2 ring-positive/10 text-positive hover:text-positiveAlt hover:ring-positive/20 hover:bg-positive/20 focus:text-positiveAlt focus:ring-positive/40 focus:bg-positive/20':
          appearance === 'positive',
        'h-8 px-2 bg-neutral-300/50 text-neutral-800 hover:text-neutral-900 hover:bg-neutral-300/75 focus:text-neutral-900 focus:bg-neutral-300/75':
          appearance === 'toast',
        'bg-black/75 backdrop-blur text-white/80 ring-white/20 hover:ring-white/40 hover:text-white focus:ring-2 focus:ring-white focus:text-white hover:bg-black/90 focus:bg-black/90':
          appearance === 'overlay',
        'bg-transparent text-white/80 ring-transparent hover:text-white hover:ring-transparent focus:ring-2 focus:ring-white focus:text-white hover:bg-white/10 focus:bg-white/10':
          appearance === 'transparent',
        'text-violet-400 hover:bg-violet-500/20 hover:text-violet-400 hover:ring-violet-500/20 focus:text-violet-400 focus:ring-violet-500/40':
          appearance === 'violet',
        'text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-400 hover:ring-indigo-500/20 focus:text-indigo-400 focus:ring-indigo-500/40':
          appearance === 'indigo',
        'rounded-none': style === 'sharp',
        'w-full': fullWidth && fullWidth !== 'responsive',
        'grow w-auto': fullWidth === 'responsive',
      },
      [className]
    )
  );

  const loaderClass = twMerge(
    clsx({
      'invisible absolute': !loading,
      'visible absolute': loading,
    })
  );

  const visibleClass = twMerge(
    clsx('inline-flex', 'items-center', 'justify-center', 'gap-x-1.5', {
      visible: !loading,
      invisible: loading,
    })
  );

  return (
    <>
      {href === undefined ? (
        <button className={typeClass} {...buttonProps}>
          <span className={visibleClass}>{children}</span>
          <span className={loaderClass}>
            <Spinner size={loaderSize} />
          </span>
        </button>
      ) : (
        <Link to={href} className={typeClass} {...buttonProps}>
          <span className={visibleClass}>{children}</span>
        </Link>
      )}
    </>
  );
}
