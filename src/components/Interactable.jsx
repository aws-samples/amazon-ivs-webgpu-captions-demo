import Spinner from './Spinner';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Link } from '../router';

export function Interactable({
  children,
  href = undefined,
  className,
  loading = false,
  loaderType,
  ...buttonProps
}) {
  const typeClass = twMerge(
    clsx(
      'outline-none',
      'cursor-pointer disabled:cursor-not-allowed',
      'appearance-none',
      'inline-flex',
      'items-center',
      'justify-center',
      'disabled:opacity-75 disabled:pointer-events-none disabled:ring-0',
      'text-uiText/90 hover:text-uiText focus:text-uiText disabled:opacity-50',
      'select-none',
      'leading-none',
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
    clsx(
      'w-full h-full inline-flex',
      'items-center',
      'justify-center',
      'gap-x-1.5',
      {
        visible: !loading,
        invisible: loading,
      }
    )
  );

  return (
    <>
      {href === undefined ? (
        <button className={typeClass} {...buttonProps}>
          <div className={visibleClass}>{children}</div>
          <span className={loaderClass}>
            <Spinner type={loaderType} />
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
