import clsx from 'clsx';
import { forwardRef, useCallback } from 'react';

const RealTimeVideo = forwardRef(function RealTimeVideo(
  { videoStream, userId, handleOnPlay, handleOnPause, handleOnLoad },
  forwardedRef
) {
  const streamId = videoStream && videoStream.id;
  const attachRef = useCallback(
    (elem) => {
      if (!videoStream || !elem) return;
      forwardedRef.current = elem;
      try {
        elem.srcObject = new MediaStream([videoStream.mediaStreamTrack]);
      } catch (err) {
        console.error(err);
      }
    },
    [forwardedRef, videoStream]
  );

  const videoClass = clsx('w-full h-full object-fit');

  return (
    <video
      key={`${userId}-video-${streamId}`}
      className={videoClass}
      ref={attachRef}
      onPlay={handleOnPlay}
      onPause={handleOnPause}
      onLoadedData={handleOnLoad}
      autoPlay
      muted
      playsInline
    />
  );
});

export default RealTimeVideo;
