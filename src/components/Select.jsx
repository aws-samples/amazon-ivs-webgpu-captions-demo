import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { CaretUpDown } from '@phosphor-icons/react';
import clsx from 'clsx';
import { useCallback } from 'react';
import { twMerge } from 'tailwind-merge';
import prettyBytes from 'pretty-bytes';

function Select({ disabled, options, selectedValue, onChange, children }) {
  const hasOptions = options.length > 0;

  const selectedOption = options.find(
    (option) => option.value === selectedValue
  );

  const opts = options.filter((option) => option.value);

  const handleChange = useCallback(
    (e, option) => {
      onChange(option);
    },
    [onChange]
  );

  return (
    <Menu>
      <MenuButton
        className='group/button inline-flex gap-x-2 items-center justify-between rounded-lg w-full min-w-[260px] text-uiText bg-surfaceAlt/50 hover:bg-surfaceAlt py-2 pl-3 pr-2 text-left appearance-none ring-2 ring-inset ring-uiText/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-surfaceAlt2/25 focus-visible:ring-offset-2 ring-offset-surface text-md disabled:opacity-75 disabled:pointer-events-none disabled:ring-0 disabled:cursor-not-allowed'
        disabled={!hasOptions || disabled}
      >
        {children}
        <CaretUpDown
          size={16}
          weight='bold'
          className='opacity-50 group-hover/button:opacity-75 group-focus/button:opacity-75'
        />
      </MenuButton>
      <MenuItems
        transition
        anchor='top'
        className='[--anchor-gap:8px] rounded-xl bg-surface bg-opacity-95 dark:bg-opacity-90 backdrop-blur p-1 ring-1 ring-border origin-bottom transition duration-200 ease-out data-[closed]:scale-95 data-[closed]:opacity-0 shadow-xl w-80 z-50'
      >
        {opts.map((option) => (
          <MenuItem
            as='button'
            key={option.value}
            className={twMerge(
              clsx([
                'group flex flex-col w-full justify-center items-start gap-0.5 text-sm text-left rounded-lg py-1.5 px-3',
                'data-[focus]:bg-primaryAlt/5 data-[focus]:ring-1 data-[focus]:ring-primary/20',
                {
                  'opacity-50 cursor-not-allowed': option.disabled,
                },
              ])
            )}
            onClick={(e) => handleChange(e, option)}
            disabled={option.disabled}
            title={`${option.label} - ${option.description}`}
          >
            {({ active }) => (
              <>
                <div
                  className={clsx([
                    'w-full inline-flex justify-between items-baseline',
                    {
                      'text-primaryAlt dark:text-primary/90': active,
                    },
                    {
                      'text-uiText': !active,
                    },
                  ])}
                >
                  <span className='font-medium'>{option?.label}</span>
                  <span
                    className={clsx(
                      'text-xs font-medium shrink-0',
                      {
                        'text-primaryAlt/70 dark:text-primary/60': active,
                      },
                      {
                        'text-uiText/50': !active,
                      }
                    )}
                  >
                    {prettyBytes(option.sizeInBytes)}
                  </span>
                </div>
                <span
                  className={clsx([
                    'text-xs',
                    'line-clamp-2',
                    { 'text-primaryAlt/75 dark:text-primary/75': active },
                    { 'text-uiText/50': !active },
                  ])}
                >
                  {option.description}
                </span>
              </>
            )}
          </MenuItem>
        ))}
      </MenuItems>
    </Menu>
  );
}

export default Select;
