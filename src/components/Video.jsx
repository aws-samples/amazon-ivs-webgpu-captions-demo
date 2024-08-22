import { forwardRef, useCallback, useEffect, useRef } from 'react';

const Video = forwardRef(function Video(
  { playbackUrl, handleOnPlay, handleOnPause, handleOnLoad },
  forwardedRef
) {
  const playerRef = useRef();
  const ivsPlayerRef = useRef();

  const playVideo = async () => {
    try {
      await playerRef.current.play();
    } catch (err) {
      console.error("Error: Couldn't play video");
    }
  };

  const onVideoLoadRef = useCallback(
    (elem) => {
      playerRef.current = elem;
      forwardedRef.current = elem;
    },
    [forwardedRef]
  );

  useEffect(() => {
    if (window.IVSPlayer.isPlayerSupported) {
      ivsPlayerRef.current = window.IVSPlayer.create();
      ivsPlayerRef.current.attachHTMLVideoElement(playerRef.current);
      ivsPlayerRef.current.load(playbackUrl);

      // ivsPlayerRef.current.addEventListener(
      //   window.IVSPlayer.PlayerState.READY,
      //   () => {
      //     // Replace 'desired-audio-device-id' with the ID of your desired audio output device
      //     // or omit the second argument to use the default audio output
      //     setupAudioRouting(ivsPlayerRef.current);
      //   }
      // );

      ivsPlayerRef.current.play();
    }
    return () => {
      if (ivsPlayerRef.current) {
        ivsPlayerRef.current.delete();
        ivsPlayerRef.current = null;
      }
    };
  }, [playbackUrl]);

  // Function to set up audio routing
  function setupAudioRouting(player, destinationDeviceId = undefined) {
    // console.log('🚀 ~ setupAudioRouting ~ player:', player);
    const videoElement = player.getHTMLVideoElement();

    // Create an audio context
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();

    // Create a media element source from the video element
    const source = audioContext.createMediaElementSource(videoElement);

    // Create the audio destination
    let destination;

    if (destinationDeviceId) {
      // If a specific audio output device is desired
      audioContext
        .setSinkId(destinationDeviceId)
        .then(() => {
          destination = audioContext.destination;
          // Connect the source to the destination
          source.connect(destination);
        })
        .catch((error) => {
          console.error('Error setting audio output device:', error);
        });
    } else {
      // If no specific device is specified, use the default destination
      destination = audioContext.destination;
      // Connect the source to the destination
      source.connect(destination);
    }
  }

  return (
    <video
      ref={onVideoLoadRef}
      className='w-full h-full object-fit'
      onPlay={handleOnPlay}
      onPause={handleOnPause}
      onLoadedData={handleOnLoad}
      autoPlay
      playsInline
    />
  );
});

export default Video;
