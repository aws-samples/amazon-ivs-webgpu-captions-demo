import { useEffect, useRef, useContext, useState } from 'react';

import Video from '../components/Video';
import { CaptionsContext } from '../contexts/CaptionsContext';
import VideoPlayerFrame from './VideoPlayerFrame';
import { showWarningToast } from './Toast';
import { PLAYBACK_URL } from '../constants';

function LowLatency() {
  const videoElemRef = useRef();

  const {
    startTranscribe,
    cleanupWorker,
    createWorker,
    status,
    pauseTranscribe,
    resumeTranscribe,
  } = useContext(CaptionsContext);

  useEffect(() => {
    if (status !== 'ready') return;
    if (!videoElemRef.current) return;

    const captureStream = videoElemRef.current.captureStream();
    const audioTrack = captureStream.getAudioTracks()[0];
    startTranscribe(audioTrack);
    videoElemRef.current.muted = false;
  }, [startTranscribe, status]);

  useEffect(() => {
    const onMessageFunc = createWorker();
    return () => cleanupWorker(onMessageFunc);
  }, [cleanupWorker, createWorker]);

  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(true);

  const handlePlayPauseClick = () => {
    // console.log('playing', !videoElemRef.current.paused);
    if (!videoElemRef.current.paused) {
      videoElemRef.current.pause();
      pauseTranscribe();
    } else {
      videoElemRef.current.play();
      resumeTranscribe();
    }
  };

  const handleMuteClick = () => {
    const nextState = !videoElemRef.current.muted;
    videoElemRef.current.muted = nextState;
    setMuted(nextState);

    if (nextState) {
      pauseTranscribe();
      showWarningToast({
        text: 'Note: Captions are not currently supported when the video is muted.',
        id: 'captions-mute-warn',
      });
    } else {
      resumeTranscribe();
    }
  };

  return (
    <VideoPlayerFrame
      title='Low-latency video'
      handlePlayPauseClick={handlePlayPauseClick}
      handleMuteClick={handleMuteClick}
      playing={playing}
      loading={loading}
      muted={muted}
    >
      <Video
        ref={videoElemRef}
        playbackUrl={PLAYBACK_URL}
        handleOnPlay={() => setPlaying(true)}
        handleOnPause={() => setPlaying(false)}
        handleOnLoad={() => {
          setLoading(false);
          // console.log(videoElemRef.current.muted);
          setMuted(videoElemRef.current.muted);
        }}
      />
    </VideoPlayerFrame>
  );
}

export default LowLatency;
