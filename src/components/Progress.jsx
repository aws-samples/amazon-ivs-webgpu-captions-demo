import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

function formatBytes(size) {
  const i = size == 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024));
  return (
    +(size / Math.pow(1024, i)).toFixed(2) * 1 +
    ['B', 'kB', 'MB', 'GB', 'TB'][i]
  );
}

export default function Progress({ text, percentage, total }) {
  percentage ??= 0;
  const bgClass = twMerge(clsx(''));
  const fgClass = twMerge(
    clsx('text-current progress-ring__circle stroke-current')
  );

  return (
    <div className='relative w-40 h-40'>
      <svg className='w-full h-full' viewBox='0 0 100 100'>
        <circle
          className={bgClass}
          strokeWidth='10'
          cx='50'
          cy='50'
          r='40'
          fill='transparent'
        ></circle>
        <circle
          className={fgClass}
          strokeWidth='10'
          strokeLinecap='round'
          cx='50'
          cy='50'
          r='40'
          fill='transparent'
          strokeDasharray='251.2'
          strokeDashoffset='calc(251.2px - (251.2px * 70) / 100)'
        ></circle>
      </svg>
    </div>
    // <div className='w-full bg-neutral-100 dark:bg-neutral-700 text-left rounded-lg overflow-hidden mb-0.5'>
    //   <div
    //     className='bg-blue-400 whitespace-nowrap px-1 text-sm'
    //     style={{ width: `${percentage}%` }}
    //   >
    //     {text} ({percentage.toFixed(2)}%
    //     {isNaN(total) ? '' : ` of ${formatBytes(total)}`})
    //   </div>
    // </div>
  );
}
