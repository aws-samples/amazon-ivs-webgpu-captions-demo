import { Card } from './Card';
import { LowLatencyIcon } from './icons/LowLatency';
import { RealTimeIcon } from './icons/RealTime';

function StartScreen() {
  return (
    <>
      <main className='relative grid place-items-center w-[100dvw] h-[100dvh] text-uiText/50 p-6 bg-surface'>
        <div className='grid place-items-center'>
          <div className='flex flex-col w-full gap-y-4 items-center'>
            <h1
              className='text-3xl font-black sm:text-4xl text-center text-balance whitespace-break-spaces text-uiText inline-block cursor-default select-none max-w-[540px]'
              aria-label='Welcome to Amazon IVS Real-time'
            >
              Amazon IVS WebGPU Captions Demo
            </h1>
            <div className='max-w-[580px] mb-8'>
              <p className='text-center text-pretty'>
                An experimental demo that shows how to generate client-side
                captions for IVS real-time and low-latency using{' '}
                <a
                  href='https://github.com/xenova/transformers.js'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-secondary hover:text-uiText underline'
                >
                  transformers.js
                </a>{' '}
                and{' '}
                <a
                  href='https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API'
                  target='_blank'
                  rel='noopener noreferer noreferrer'
                  className='text-secondary hover:text-uiText underline'
                >
                  WebGPU
                </a>
                .
              </p>
            </div>
            <div className='w-full flex flex-col gap-2 sm:flex-row items-center justify-center max-w-[640px]'>
              <div className='w-full'>
                <Card
                  appearance='violet'
                  fullWidth={true}
                  href='/low-latency'
                  className='py-4'
                >
                  <div className='inline-flex flex-col items-start gap-y-6 px-4 py-1'>
                    <div className='inline-flex grow-0 p-3 rounded-md text-violet-500 bg-violet-500/10 ring-1 ring-violet-500/20 group-hover/card:bg-violet-100 group-hover/card:dark:bg-violet-600/20 group-hover/card:ring-violet-400/30 group-hover/card:dark:ring-violet-500/30 group-hover/card:text-violet-800 group-hover/card:dark:text-violet-400'>
                      <LowLatencyIcon className='inline size-8' />
                    </div>
                    <div className='inline-flex flex-col items-start gap-y-2'>
                      <span className='inline-flex font-black text-uiText group-hover/card:text-violet-800 group-hover/card:dark:text-violet-300'>
                        Low-latency video
                      </span>
                      <span className='inline-flex text-sm text-opacity-75 text-uiText group-hover/card:text-violet-800/75 group-hover/card:dark:text-violet-300/75'>
                        Under 3 seconds of latency from host to viewer.
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
              <div className='w-full'>
                <Card
                  appearance='indigo'
                  fullWidth={true}
                  href='/real-time'
                  className='py-4'
                >
                  <div className='inline-flex flex-col items-start gap-y-6 px-4 py-1'>
                    <div className='inline-flex grow-0 p-3 rounded-md text-indigo-500 bg-indigo-500/10 ring-1 ring-indigo-500/20 group-hover/card:bg-indigo-100 group-hover/card:dark:bg-indigo-600/20 group-hover/card:ring-indigo-400/30 group-hover/card:dark:ring-indigo-500/30 group-hover/card:text-indigo-800 group-hover/card:dark:text-indigo-400'>
                      <RealTimeIcon className='inline size-8' />
                    </div>
                    <div className='inline-flex flex-col items-start gap-y-2'>
                      <span className='inline-flex font-black text-uiText group-hover/card:text-indigo-800 group-hover/card:dark:text-indigo-300'>
                        Real-time video
                      </span>
                      <span className='inline-flex text-sm text-opacity-75 text-uiText group-hover/card:text-indigo-800/75 group-hover/card:dark:text-indigo-300/75'>
                        Under 300 milliseconds of latency from host to viewer.
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export default StartScreen;
