import { useCallback, useContext } from 'react';
import { CaptionsContext } from '../contexts/CaptionsContext';
import { Pill } from './Pill';
import { Button } from './Buttons';
import {
  House,
  Info,
  Pause,
  Play,
  SpeakerHigh,
  SpeakerSlash,
  Warning,
  WarningCircle,
} from '@phosphor-icons/react';
import Spinner from './Spinner';
import Captions from './Captions';
import Select from './Select';
import toast from 'react-hot-toast';
import prettyBytes from 'pretty-bytes';
import clsx from 'clsx';
import { showWarningToast } from './Toast';
import { ModalContext } from '../contexts/ModalContext';
import { AnimatedDialog } from './AnimatedDialog';

function VideoPlayerFrame({
  title,
  handlePlayPauseClick,
  handleMuteClick,
  handleLoadClick = () => {},
  handleInfoClick = () => {},
  showInfoButton = false,
  playing,
  muted,
  loading,
  hideControls = false,
  disableModelSelect = false,
  children,
}) {
  const {
    isWebGpuAvailable,
    status,
    loadingMessage,
    text,
    newText,
    tps,
    models,
    worker,
    setStatus,
    currentModel,
    setCurrentModel,
    progressItems,
  } = useContext(CaptionsContext);

  const { modalOpen, setModalOpen, modalContent } = useContext(ModalContext);

  const showToastWarn = useCallback((id) => {
    showWarningToast({
      text: 'The selected model is not designed for on-device use and may be slow.',
      id,
    });
  }, []);

  return (
    <>
      <div className='w-full h-dvh grid grid-cols-1 grid-rows-[56px_minmax(0,_1fr)_72px] bg-surface'>
        <div className='w-full h-full relative grid grid-cols-3 place-items-center'>
          <div className='w-full h-full px-2 relative flex justify-start items-center'>
            <Button
              className='px-2 py-2 text-sm'
              style='roundedText'
              appearance='transparent'
              href='/'
            >
              <House weight='fill' size={20} className='text-uiText' />
            </Button>
          </div>
          <Pill>{title}</Pill>
          {showInfoButton && (
            <div className='w-full h-full px-2 relative flex justify-end items-center'>
              <Button
                className='px-2 py-2 text-sm'
                style='roundedText'
                appearance='transparent'
                onClick={handleInfoClick}
              >
                <Info weight='fill' size={20} className='text-uiText' />
              </Button>
            </div>
          )}
        </div>
        {isWebGpuAvailable() ? (
          <>
            <div className='w-full h-full px-2'>
              <div className='relative w-full h-full bg-neutral-900 rounded-md ring-1 ring-surfaceAlt2/10 group/overlay overflow-hidden'>
                {!hideControls && (
                  <div className='absolute w-full h-full flex justify-center pointer-events-none'>
                    <div
                      className={clsx(
                        'absolute w-full h-full flex items-center justify-center transition-opacity duration-200',
                        {
                          'bg-black/20': !playing,
                        }
                      )}
                    >
                      <div
                        className={clsx([
                          'relative z-10 transition-opacity duration-200',
                          {
                            'opacity-0 group-hover/overlay:opacity-100':
                              playing,
                          },
                        ])}
                      >
                        <Button
                          appearance='transparent'
                          className='p-4 pointer-events-auto'
                          onClick={handlePlayPauseClick}
                          loading={loading}
                          loaderSize='large'
                          loaderType='alert'
                        >
                          {playing ? (
                            <span key='PauseButton'>
                              <Pause
                                weight='fill'
                                size={48}
                                className='text-white relative drop-shadow-md'
                              />
                            </span>
                          ) : (
                            <span key='PlayButton'>
                              <Play
                                weight='fill'
                                size={48}
                                className='text-white relative -left-0.5 drop-shadow-md'
                              />
                            </span>
                          )}
                        </Button>
                      </div>
                      <div className='absolute right-0 top-0 p-4 z-10'>
                        <Button
                          appearance='overlay'
                          style='roundedText'
                          className='px-3 py-1.5 text-sm pointer-events-auto ring-0'
                          onClick={handleMuteClick}
                        >
                          {muted ? (
                            <>
                              Muted <SpeakerSlash weight='fill' size={20} />
                            </>
                          ) : (
                            <>
                              Umuted <SpeakerHigh weight='fill' size={20} />
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className='absolute z-10 bottom-12 text-left px-8 w-full max-w-[560px] h-[84px] overflow-hidden'>
                      <Captions caption={text} newCaptions={newText} />
                    </div>
                  </div>
                )}
                <div
                  className='w-full h-full rounded-md overflow-hidden cursor-default'
                  // onClick={handlePlayPauseClick}
                  // loaderType='alert'
                  disabled={loading}
                >
                  {children}
                </div>
              </div>
            </div>
            <div className='w-full h-full relative flex justify-center items-center gap-1'>
              {status === null && (
                <div className='relative flex justify-center items-center gap-1'>
                  <Select
                    selectedValue={currentModel?.value}
                    options={models}
                    onChange={(option) => {
                      if (option.warn) {
                        showToastWarn('model-warn');
                      } else {
                        toast.dismiss('model-warn');
                      }
                      setCurrentModel(option);
                    }}
                    disabled={status !== null || disableModelSelect}
                  >
                    <span className='inline-flex justify-between items-center w-full'>
                      <span className='inline-flex items-center w-full gap-1'>
                        {currentModel?.warn && (
                          <span className='text-sm shrink-0'>
                            <WarningCircle
                              className='text-primaryAlt'
                              size={16}
                              weight='fill'
                            />
                          </span>
                        )}
                        {currentModel?.label}
                      </span>
                      <span className='text-sm shrink-0 opacity-50'>
                        {prettyBytes(currentModel?.sizeInBytes || 0)}
                      </span>
                    </span>
                  </Select>
                  <Button
                    className='px-5 py-3'
                    onClick={() => {
                      worker.current.postMessage({
                        type: 'load',
                        data: {
                          modelId: currentModel?.value,
                          modelOptions: currentModel?.modelOptions,
                        },
                      });
                      setStatus('loading');
                      handleLoadClick();
                    }}
                    appearance='primary'
                    disabled={status !== null || disableModelSelect}
                  >
                    Load
                  </Button>
                </div>
              )}
              {status === 'loading' && (
                <div className='w-full max-w-[500px] text-left mx-auto p-4'>
                  <div className='flex gap-x-2 items-center justify-center text-center text-uiText font-mono text-xs'>
                    <Spinner />
                    {loadingMessage}
                    {/* {progressItems.map(({ file, progress, loaded, total }) =>
                      console.log(file, Math.round(progress * 100) / 100, total)
                    )} */}
                  </div>
                </div>
              )}
              {status === 'ready' && (
                <>
                  <Pill appearance={'positive'}>{currentModel?.label}</Pill>
                  <Pill>
                    {tps ? <>{tps.toFixed(2)} tok/s</> : <>-tok / s</>}
                  </Pill>
                </>
              )}
            </div>
          </>
        ) : (
          <>
            <div className='w-full h-full flex justify-center items-center px-2 text-uiText'>
              <div className='flex flex-col items-center justify-start text-center gap-1 max-w-[580px] w-full select-none'>
                <Warning
                  size={64}
                  weight='regular'
                  className='text-primaryAlt mb-4'
                />
                <h2 className='font-bold text-2xl'>WebGPU not supported</h2>
                <p className='text-uiText/50 text-lg text-balance'>
                  Unable to load WebGPU. You may need to take additional steps
                  to enable this feature in your browser.
                </p>
              </div>
            </div>
            <div className='w-full h-full relative flex justify-center items-center gap-1'>
              <div className='bg-surfaceAlt rounded-full animate-pulse h-4 w-8'></div>
            </div>
          </>
        )}
      </div>
      <AnimatedDialog
        isOpen={modalOpen}
        onRequestClose={() => setModalOpen(false)}
      >
        {modalContent}
      </AnimatedDialog>
    </>
  );
}

export default VideoPlayerFrame;
