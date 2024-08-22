import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Pill({ appearance, className, children }) {
  const pillClass = twMerge(
    clsx(
      'inline-flex text-xs leading-none text-center items-center px-3 py-2 rounded-full font-mono bg-surfaceAlt text-uiText',
      'select-none',
      {
        'bg-primary/10 text-primaryAlt': appearance === 'primary',
        'bg-secondary text-uiText/90': appearance === 'secondary',
        'bg-destruct/10 text-destruct': appearance === 'destruct',
        'bg-positive/10 text-positive': appearance === 'positive',
        'h-8 px-2 bg-neutral-300/50 text-neutral-800': appearance === 'toast',
        'bg-surfaceAlt/50 backdrop-blur text-uiText/80':
          appearance === 'overlay',
      },
      [className]
    )
  );

  return <div className={pillClass}>{children}</div>;
}
