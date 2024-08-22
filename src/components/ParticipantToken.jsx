import { Description, DialogTitle } from '@headlessui/react';
import { ModalContext } from '../contexts/ModalContext';
import { Button } from './Buttons';
import { useContext, useEffect, useRef, useState } from 'react';
import { StageContext } from '../contexts/StageContext';
import copyTextToClipboard from '../helpers/clipboard';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { Check, Clipboard } from '@phosphor-icons/react';

export function ParticipantToken() {
  const { setModalOpen } = useContext(ModalContext);
  const { getStageToken } = useContext(StageContext);
  const [stagePublishToken, setStagePublishToken] = useState();
  const [_copied, _setCopied] = useState(false);
  const copyLinkTimeoutRef = useRef();

  // On load, set the token
  useEffect(() => {
    const fetchToken = async () => {
      const response = await getStageToken(true);
      const result = await response.text();
      const { token: _token } = JSON.parse(result);
      return _token;
    };

    fetchToken().then((_token) => {
      setStagePublishToken(_token);
    });
  }, [getStageToken]);

  function copyToken() {
    let copied = false;
    try {
      copyTextToClipboard(stagePublishToken);
      toast.success('Link copied to clipboard');
      copied = true;
    } catch (err) {
      toast.error('Failed to copy token');
    }
    return copied;
  }

  function handleCopyLinkClick(e) {
    e.preventDefault();
    const copied = copyToken();

    if (copyLinkTimeoutRef.current) clearTimeout(copyLinkTimeoutRef.current);
    _setCopied(copied);
    copyLinkTimeoutRef.current = setTimeout(() => {
      _setCopied(false);
    }, 4000);
  }

  const copyButtonClass = clsx([
    'shrink-0 select-none rounded-md p-1',
    { 'bg-positive': _copied },
    { 'bg-surfaceAlt3': !_copied },
  ]);

  return (
    <div className='p-6'>
      <DialogTitle className='text-lg font-bold mb-4'>
        Publish content
      </DialogTitle>
      <Description className='sr-only'>
        This dialog explains how to publish content to this stage
      </Description>
      <p className='mb-2'>
        The following participant token allows you to publish content to the
        stage.
      </p>
      <p className='mb-4'>
        Use the token with the Amazon IVS Real-time Broadcast SDKs. A live demo
        is available on the following page:{' '}
        <a
          href='https://codepen.io/amazon-ivs/project/full/ZzWobn'
          target='_blank'
          rel='noopener noreferrer'
          className='text-secondary hover:text-uiText underline'
        >
          IVS Real-Time Streaming Web Sample (React)
        </a>
        .
      </p>
      <div className='flex flex-col justify-center gap-y-4 mb-5 py-4 bg-surfaceAlt rounded-lg ring-1 ring-border'>
        <div className='flex w-full items-start justify-center text-left text-xs px-4 gap-2'>
          <span
            className='grow shrink line-clamp-6 font-mono break-all'
            title={stagePublishToken}
          >
            {stagePublishToken}
          </span>
          <button
            className={copyButtonClass}
            onClick={handleCopyLinkClick}
            aria-label='Copy link'
            title='Copy link'
          >
            {_copied ? (
              <Check size={16} weight='bold' className='text-white' />
            ) : (
              <Clipboard size={16} weight='bold' className='text-uiText' />
            )}
          </button>
        </div>
      </div>
      <div className='flex gap-4'>
        <Button
          appearance='primary'
          style='roundedText'
          fullWidth={true}
          type='submit'
          onClick={() => setModalOpen(false)}
          className='py-3'
        >
          Done
        </Button>
      </div>
    </div>
  );
}
