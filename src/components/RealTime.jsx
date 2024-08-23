import { useEffect, useContext, useState, useCallback, useRef } from 'react';
import { StreamType } from 'amazon-ivs-web-broadcast';
import { CaptionsContext } from '../contexts/CaptionsContext';
import { StageContext } from '../contexts/StageContext';
import RealTimeVideo from './RealTimeVideo';
import VideoPlayerFrame from './VideoPlayerFrame';
import { isHostParticipant } from '../helpers/stage';
import { LightningSlash } from '@phosphor-icons/react';
import { Button } from './Buttons';
import { ParticipantToken } from './ParticipantToken';
import { ModalContext } from '../contexts/ModalContext';

function RealTime() {
  const {
    startTranscribe,
    cleanupWorker,
    createWorker,
    status,
    isWebGpuAvailable,
    pauseTranscribe,
    resumeTranscribe,
  } = useContext(CaptionsContext);

  const { joinStage, leaveStage, participants, getStageToken, stageJoined } =
    useContext(StageContext);

  const { setModalOpen, setModalContent } = useContext(ModalContext);

  const [token, setToken] = useState();
  const [videoStream, setVideoStream] = useState();
  const [audioStream, setAudioStream] = useState();

  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(true);

  const videoElemRef = useRef();
  const audioElemRef = useRef();

  useEffect(() => {
    const onMessageFunc = createWorker();
    return () => cleanupWorker(onMessageFunc);
  }, [cleanupWorker, createWorker]);

  // On token update, join stage
  useEffect(() => {
    if (!isWebGpuAvailable()) return;
    if (!token) return;
    joinStage(token);
  }, [isWebGpuAvailable, joinStage, token]);

  useEffect(() => {
    if (!isWebGpuAvailable()) return;
    if (participants.size < 1) return;
    const values = participants.values();

    values.forEach((participantInfo) => {
      const isMainParticipant = isHostParticipant(participantInfo);
      if (isMainParticipant) {
        const { streams } = participantInfo;

        const _videoStream = streams.find(
          (stream) => stream.streamType === StreamType.VIDEO
        );
        setVideoStream(_videoStream);

        const _audioStream = streams.find(
          (stream) => stream.streamType === StreamType.AUDIO
        );

        setAudioStream(_audioStream);
      }
    });
  }, [isWebGpuAvailable, participants]);

  // On load, set the token
  useEffect(() => {
    const fetchToken = async () => {
      const response = await getStageToken();
      const result = await response.text();
      const { token: _token } = JSON.parse(result);
      return _token;
    };

    fetchToken().then((_token) => {
      setToken(_token);
    });

    return () => {
      leaveStage();
    };
  }, [leaveStage]);

  useEffect(() => {
    if (status !== 'ready') return;
    if (!audioStream) return;
    if (!audioElemRef.current) return;

    startTranscribe(audioStream.mediaStreamTrack);
    audioElemRef.current.play();
    setMuted(audioElemRef.current.muted);
  }, [audioStream, startTranscribe, status]);

  const updateAudioStream = useCallback(
    (elem) => {
      if (!audioStream || !elem) return;
      audioElemRef.current = elem;
      elem.play();
      setMuted(elem.muted);
      try {
        elem.srcObject = new MediaStream([audioStream.mediaStreamTrack]);
      } catch (err) {
        console.error(err);
      }
    },
    [audioStream]
  );

  const handlePlayPauseClick = () => {
    if (!videoElemRef.current.paused) {
      videoElemRef.current.pause();
      audioElemRef.current.pause();
      pauseTranscribe();
    } else {
      videoElemRef.current.play();
      audioElemRef.current.play();
      resumeTranscribe();
    }
  };

  const handleMuteClick = () => {
    const nextState = !audioElemRef.current.muted;
    audioElemRef.current.muted = nextState;

    // If the next state is unmuted, also play the audio
    if (!nextState) {
      audioElemRef.current.play();
      videoElemRef.current.play();
    }

    setMuted(nextState);
  };

  const handleInfoClick = useCallback(() => {
    setModalContent(<ParticipantToken />);
    setModalOpen(true);
  }, [setModalContent, setModalOpen]);

  return (
    <VideoPlayerFrame
      title={'Real-time video'}
      handlePlayPauseClick={handlePlayPauseClick}
      handleMuteClick={handleMuteClick}
      handleInfoClick={handleInfoClick}
      showInfoButton={true}
      playing={playing}
      loading={loading}
      disableModelSelect={stageJoined && participants.size < 1}
      hideControls={stageJoined && participants.size < 1}
      muted={muted}
    >
      {stageJoined && participants.size > 0 && (
        <>
          <RealTimeVideo
            ref={videoElemRef}
            videoStream={videoStream}
            userId={'rtmps-stream'}
            handleOnPlay={() => setPlaying(true)}
            handleOnPause={() => setPlaying(false)}
            handleOnLoad={() => setLoading(false)}
          />
          <audio className='hidden' ref={updateAudioStream} autoPlay />
        </>
      )}
      {stageJoined && participants.size < 1 && (
        <div className='w-full h-full flex justify-center items-center px-2 text-neutral-300'>
          <div className='flex flex-col items-center justify-start text-center gap-1 max-w-[580px] w-full select-none'>
            <LightningSlash
              size={48}
              weight='regular'
              className='text-current mb-4'
            />
            <h2 className='font-bold text-2xl'>Stream offline</h2>
            <p className='text-neutral-300/50 text-lg text-balance mb-4'>
              The stream is offline. Use a publisher token and use it to stream
              content to this stage.
            </p>
            <Button
              appearance='primary'
              style='roundedText'
              onClick={handleInfoClick}
              className='py-3 px-8 text-lg font-medium'
            >
              View publish token
            </Button>
          </div>
        </div>
      )}
    </VideoPlayerFrame>
  );
}

export default RealTime;
