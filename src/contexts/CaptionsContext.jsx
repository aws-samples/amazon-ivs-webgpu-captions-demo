import {
  createContext,
  useMemo,
  useRef,
  useState,
  useCallback,
  useEffect,
} from 'react';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';

const WHISPER_SAMPLING_RATE = 16_000;
const DEFAULT_AUDIO_LENGTH = 5; // seconds
const MAX_AUDIO_LENGTH = 30; // seconds

const CaptionsContext = createContext({
  isWebGpuAvailable: () => false,
  startTranscribe: undefined,
  worker: undefined,
  cleanupWorker: undefined,
  createWorker: undefined,
  models: [],
  currentModel: undefined,
  setCurrentModel: undefined,
  toggleTranscribe: undefined,
  pauseTranscribe: undefined,
  resumeTranscribe: undefined,
  getModels: undefined,
  defaultModelRef: undefined,
  updateCaption: undefined,
  text: '',
  newText: '',
  tps: undefined,
  avgTps: undefined,
  loadingMessage: undefined,
  progressItems: undefined,
  status: undefined,
  setStatus: undefined,
});

// eslint-disable-next-line react/prop-types
function CaptionsProvider({ children }) {
  // eslint-disable-next-line no-unused-vars
  const [searchParams, setSearchParams] = useSearchParams();

  let audioLength =
    parseInt(searchParams.get('length')) || DEFAULT_AUDIO_LENGTH;
  audioLength = Math.min(audioLength, MAX_AUDIO_LENGTH);

  const MAX_SAMPLES = WHISPER_SAMPLING_RATE * audioLength;

  // Create a reference to the worker object.
  const worker = useRef(null);

  const recorderRef = useRef(null);

  // Model loading and progress
  const [status, setStatus] = useState(null);
  const [models, setModels] = useState([]);
  const [currentModel, setCurrentModel] = useState();
  const defaultModelRef = useRef();
  const [loadingMessage, setLoadingMessage] = useState('');
  const [progressItems, setProgressItems] = useState([]);

  // Inputs and outputs
  const [text, setText] = useState('');
  const [newText, setNewText] = useState('');
  const [tps, setTps] = useState(null);
  const [avgTps, setAvgTps] = useState(null);
  const language = 'en';

  // Processing
  const [recording, setRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [chunks, setChunks] = useState([]);
  const audioContextRef = useRef(null);

  const timeoutRef = useRef();
  const previousCompletionRef = useRef();

  const getModels = useCallback(() => {
    worker.current.postMessage({
      type: 'list',
    });
  }, []);

  const updateCaption = useCallback((transcription) => {
    if (previousCompletionRef.current === transcription) return;
    setNewText(transcription);
  }, []);

  const createWorker = useCallback(() => {
    if (!worker.current) {
      // Create the worker if it does not yet exist.
      worker.current = new Worker(new URL('../worker.js', import.meta.url), {
        type: 'module',
      });
    }

    if (!models.length) {
      getModels();
    }

    // Create a callback function for messages from the worker thread.
    const onMessageReceived = (e) => {
      switch (e.data.status) {
        case 'error':
          console.log(e.data.error);
          toast.error(
            'The model failed to load. It is likely too large for your device.'
          );
          setStatus(null);
          break;

        case 'models':
          setModels(e.data.models);
          defaultModelRef.current = e.data.models.find(
            (model) => model.default
          );
          setCurrentModel(defaultModelRef.current);
          break;

        case 'loading':
          // Model file start load: add a new progress item to the list.
          setStatus('loading');
          setLoadingMessage(e.data.data);
          break;

        case 'initiate':
          setProgressItems((prev) => [...prev, e.data]);
          break;

        case 'progress':
          // Model file progress: update one of the progress items.
          setProgressItems((prev) =>
            prev.map((item) => {
              if (item.file === e.data.file) {
                return { ...item, ...e.data };
              }
              return item;
            })
          );
          break;

        case 'done':
          // Model file loaded: remove the progress item from the list.
          setProgressItems((prev) =>
            prev.filter((item) => item.file !== e.data.file)
          );
          break;

        case 'ready':
          // Pipeline ready: the worker is ready to accept messages.
          setStatus('ready');
          if (recorderRef.current?.state !== 'recording')
            recorderRef.current?.start();
          break;

        case 'start':
          {
            // Start generation
            setIsProcessing(true);

            // Request new data from the recorder
            recorderRef.current?.requestData();
          }
          break;

        case 'update':
          {
            // Generation update: update the output text.
            const { tps } = e.data;
            if (!tps) return;

            setTps(tps);
            setAvgTps((prevState) => {
              const avg = (prevState + tps) / 2;
              return avg;
            });
          }
          break;

        case 'complete':
          // Generation complete: re-enable the "Generate" button
          setIsProcessing(false);
          updateCaption(`${e.data.output[0].replace(/\./g, '.\n')}`);
          break;
      }
    };

    // Attach the callback function as an event listener.
    worker.current.addEventListener('message', onMessageReceived);

    return onMessageReceived;
  }, [getModels, models, updateCaption]);

  const cleanupWorker = (func) => {
    worker.current.removeEventListener('message', func);
  };

  const requestCompletion = useCallback(
    (
      audio,
      language = 'en',
      initialCompletionStart = performance.now() / 1000
    ) => {
      worker.current.postMessage({
        type: 'generate',
        data: {
          audio,
          language,
          initialCompletionStart,
          model: currentModel?.value,
          modelOptions: currentModel?.modelOptions,
        },
      });
    },
    [currentModel]
  );

  const startTranscribe = useCallback((audioTrack) => {
    if (!audioTrack) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      timeoutRef.current = setTimeout(() => {
        startTranscribe(audioTrack);
      }, 100);

      return;
    }

    const audioStream = new MediaStream([audioTrack]);
    recorderRef.current = new MediaRecorder(audioStream);
    audioContextRef.current = new AudioContext({
      sampleRate: WHISPER_SAMPLING_RATE,
    });

    recorderRef.current.onstart = () => {
      setRecording(true);
      setChunks([]);
    };
    recorderRef.current.ondataavailable = (e) => {
      if (e.data.size > 0) {
        setChunks((prev) => [...prev, e.data]);
      } else {
        // Empty chunk received, so we request new data after a short timeout
        setTimeout(() => {
          recorderRef.current.requestData();
        }, 25);
      }
    };

    recorderRef.current.onstop = () => {
      setRecording(false);
    };

    recorderRef.current.onpause = () => {
      setRecording(false);
    };

    recorderRef.current.onresume = () => {
      setRecording(true);
    };

    recorderRef.current.start();
  }, []);

  const pauseTranscribe = useCallback(() => {
    if (!recorderRef.current) return;
    recorderRef.current.pause();
  }, []);

  const resumeTranscribe = useCallback(() => {
    if (!recorderRef.current) return;
    recorderRef.current.resume();
  }, []);

  const toggleTranscribe = useCallback(() => {
    if (!recorderRef.current) return;
    switch (recorderRef.current.state) {
      case 'paused':
        resumeTranscribe();
        break;

      case 'recording':
        pauseTranscribe();
        break;
    }
  }, [pauseTranscribe, resumeTranscribe]);

  const isWebGpuAvailable = () => !!navigator.gpu;

  useEffect(() => {
    if (!recorderRef.current) return;
    if (!recording) return;
    if (isProcessing) return;
    if (status !== 'ready') return;

    if (chunks.length > 0) {
      // Generate from data
      const blob = new Blob(chunks, { type: recorderRef.current.mimeType });

      const fileReader = new FileReader();

      fileReader.onloadend = async () => {
        const arrayBuffer = fileReader.result;
        const decoded = await audioContextRef.current.decodeAudioData(
          arrayBuffer
        );
        let audio = decoded.getChannelData(0);
        if (audio.length > MAX_SAMPLES) {
          // Get last MAX_SAMPLES
          audio = audio.slice(-MAX_SAMPLES);
        }
        requestCompletion(audio);
      };
      fileReader.readAsArrayBuffer(blob);
    } else {
      recorderRef.current?.requestData();
    }
  }, [
    status,
    recording,
    isProcessing,
    chunks,
    language,
    MAX_SAMPLES,
    requestCompletion,
  ]);

  const state = useMemo(() => {
    return {
      isWebGpuAvailable,
      startTranscribe,
      worker,
      cleanupWorker,
      createWorker,
      defaultModelRef,
      models,
      getModels,
      currentModel,
      setCurrentModel,
      updateCaption,
      text,
      newText,
      tps,
      avgTps,
      loadingMessage,
      progressItems,
      status,
      setStatus,
      toggleTranscribe,
      resumeTranscribe,
      pauseTranscribe,
    };
  }, [
    startTranscribe,
    createWorker,
    models,
    getModels,
    currentModel,
    updateCaption,
    text,
    newText,
    tps,
    avgTps,
    loadingMessage,
    progressItems,
    status,
    toggleTranscribe,
    resumeTranscribe,
    pauseTranscribe,
  ]);

  return (
    <CaptionsContext.Provider value={state}>
      {children}
    </CaptionsContext.Provider>
  );
}

export { CaptionsContext };
export default CaptionsProvider;
