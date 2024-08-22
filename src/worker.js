import {
  AutoTokenizer,
  AutoProcessor,
  WhisperForConditionalGeneration,
  TextStreamer,
  full,
} from '@xenova/transformers';

const MAX_NEW_TOKENS = 64;
const SAMPLE_MODELS = [
  {
    label: 'Whisper',
    description: 'A state-of-the-art model for automatic speech recognition.',
    section: 'whisper',
  },
  {
    label: 'Whisper tiny',
    description: 'The smallest version of whisper. Uses 4-bit quantization.',
    value: 'onnx-community/whisper-tiny.en',
    sizeInBytes: 118552291,
    default: true,
    section: 'whisper',
    modelOptions: {
      dtype: {
        encoder_model: 'q4', // 'q4' or 'fp32' or 'fp16'
        decoder_model_merged: 'q4', // 'q4' or 'fp32' ('fp16' is broken)
      },
      device: 'webgpu',
    },
  },
  {
    label: 'Whisper base',
    description: 'The base version of whisper. Uses 4-bit quantization.',
    value: 'onnx-community/whisper-base.en',
    sizeInBytes: 142372822,
    section: 'whisper',
    modelOptions: {
      dtype: {
        encoder_model: 'q4',
        decoder_model_merged: 'q4',
      },
      device: 'webgpu',
    },
  },
  {
    label: 'Whisper small',
    description:
      'A larger-than-normal version of whisper. Uses 4-bit quantization.',
    value: 'onnx-community/whisper-small.en',
    sizeInBytes: 585972125,
    warn: true,
    section: 'whisper',
    modelOptions: {
      dtype: {
        encoder_model: 'q4',
        decoder_model_merged: 'q4',
      },
      device: 'webgpu',
    },
  },
  {
    label: 'Distil',
    description:
      'A distilled version of the Whisper model that can be 6 times faster and 49% smaller while performing within 1% WER on out-of-distribution evaluation sets.',
    section: 'distil',
  },
  {
    label: 'Distil small',
    description:
      'The smallest version of distil, optimized for on-device transcription. Uses 4-bit quantization.',
    value: 'onnx-community/distil-small.en',
    sizeInBytes: 251047822,
    section: 'distil',
    modelOptions: {
      dtype: {
        encoder_model: 'q4',
        decoder_model_merged: 'q4',
      },
      device: 'webgpu',
    },
  },
  {
    label: 'Distil medium',
    description:
      'Not recommended for on-device transcription. A version of distil that is slower, but may be more accurate than small. Not quantized.',
    value: 'distil-whisper/distil-medium.en',
    sizeInBytes: 1578064499,
    warn: true,
    section: 'distil',
    modelOptions: {
      dtype: {
        encoder_model: 'fp32',
        decoder_model_merged: 'fp32',
      },
      device: 'webgpu',
    },
  },
  {
    label: 'Distil large',
    description:
      'Not recommended for on-device transcription. The latest (v3) and largest version of distil. Not quantized.',
    value: 'distil-whisper/distil-large-v3',
    sizeInBytes: 2547875840,
    warn: true,
    section: 'distil',
    modelOptions: {
      dtype: {
        encoder_model: 'fp32',
        decoder_model_merged: 'fp32',
      },
      device: 'webgpu',
    },
  },
];

const DEFAULT_MODEL_OPTIONS = {
  dtype: {
    encoder_model: 'fp32',
    decoder_model_merged: 'fp32',
  },
  device: 'webgpu',
};

/**
 * This class uses the Singleton pattern to ensure that only one instance of the model is loaded.
 */
class AutomaticSpeechRecognitionPipeline {
  static model_id = null;
  static tokenizer = null;
  static processor = null;
  static model = null;

  static async getInstance(
    progress_callback = null,
    modelId = 'Xenova/whisper-tiny.en',
    modelOptions = DEFAULT_MODEL_OPTIONS
  ) {
    this.model_id = modelId;

    this.tokenizer ??= AutoTokenizer.from_pretrained(this.model_id, {
      progress_callback,
    });
    this.processor ??= AutoProcessor.from_pretrained(this.model_id, {
      progress_callback,
    });

    this.model ??= WhisperForConditionalGeneration.from_pretrained(
      this.model_id,
      {
        ...modelOptions,
        progress_callback,
      }
    );

    return Promise.all([this.tokenizer, this.processor, this.model]);
  }

  static async dispose() {
    const { state } = await getPromiseState(this.model);
    if (state === 'rejected') {
      this.model = null;
      this.tokenizer = null;
      this.processor = null;
    } else {
      this.model.dispose();
      this.tokenizer = null;
      this.processor = null;
    }
  }
}

let processing = false;
var lastConfirmedString = '';
var lastConfirmedWord = '';

const pending = {
  state: 'pending',
};

function getPromiseState(promise) {
  // We put `pending` promise after the promise to test,
  // which forces .race to test `promise` first
  return Promise.race([promise, pending]).then(
    (value) => {
      if (value === pending) {
        return value;
      }
      return {
        state: 'resolved',
        value,
      };
    },
    (reason) => ({ state: 'rejected', reason })
  );
}

function parseOutput(output, initialCompletionEnd = performance.now()) {
  // console.log('completion end time: ', initialCompletionEnd);
  const regex = /<\|(\d+\.\d+)\|>([^<]+)(?:<\|(\d+\.\d+)\|>|$)/g;
  const matches = [];
  let match;
  while ((match = regex.exec(output)) !== null) {
    const content = match[2].trim();
    matches.push({
      start: parseFloat(match[1]),
      end: match[3] ? parseFloat(match[3]) : parseFloat(match[1]),
      content,
    });
  }

  return matches.map((item) => ({
    start: initialCompletionEnd - item.end,
    end: initialCompletionEnd,
    content: item.content === '[BLANK_AUDIO]' ? null : item.content,
  }));
}

function formatResultString(str) {
  // Convert to array
  // Remove ">" from start of string
  // Remove "." from end of string
  let result = str.replace(/^>+/, '').replace(/\.+$/, '').split(' ');
  return result;
}

function getNewString(oldStr, newStr) {
  const stringArray = formatResultString(newStr);
  const oldWords = convertStringToArray(oldStr);
  const newWords = convertStringToArray(newStr);

  // eslint-disable-next-line no-unused-vars
  const { word, index, shouldReplace } = findLastCommonWord(oldWords, newWords);
  let result;
  if (index === -1) {
    result = [lastConfirmedWord, ...stringArray];
  } else {
    result = shouldReplace
      ? [lastConfirmedWord, ...stringArray.slice(index + 1)]
      : stringArray.slice(index + 1);
  }

  return result.join(' ');
}

function findLastCommonWord(oldWords, newWords) {
  // Split both strings into arrays of words
  // console.log('oldWords:', oldWords);
  // console.log('newWords:', newWords);

  const lastWords = oldWords.slice(-2); // array with last 2 words
  // console.log('lastWords:', lastWords);
  // console.log('\n');

  // Initialize variables to store the result
  let lastCommonWord = null;
  let lastCommonIndex = -1;
  let shouldReplace = false;

  // Iterate backwards through the words in the new string
  for (let i = newWords.length - 1; i > 0; i--) {
    const word = newWords[i];
    // Check if the word exists in the last two characters of the old string
    if (lastWords[1] === word) {
      lastCommonWord = word;
      lastCommonIndex = i;
      shouldReplace = true;
      break;
    } else if (lastWords[0] === word) {
      // console.log('matched second to last word:', lastWords[0]);
      // console.log('newWords:', newWords.slice(i));
      lastCommonWord = word;
      lastCommonIndex = i - 1;
      shouldReplace = false;
      break;
    }
  }

  // console.log('index:', lastCommonIndex);
  // console.log('word:', lastCommonWord);
  // console.log('\n');

  // Return the result as an object
  return {
    word: lastCommonWord,
    index: lastCommonIndex,
    shouldReplace,
  };
}

function concatCompletions(completions) {
  let completion = [];
  for (let index = 0; index < completions.length; index++) {
    const element = completions[index];
    completion.push(element.content);
  }
  return completion.join(' ');
}

function convertStringToArray(str) {
  // only keep words and spaces
  let result = str.replace(/[^\w\s]/gi, '');
  result = result.toLowerCase();
  result = result.replace(/[^\w\s]|_/g, '').split(/\s+/);
  return result;
}

async function generate({
  audio,
  language,
  initialCompletionStart,
  model: _model,
  modelOptions,
}) {
  if (processing) return;
  processing = true;

  // Tell the main thread we are starting
  self.postMessage({ status: 'start' });

  // Retrieve the text-generation pipeline.
  const [tokenizer, processor, model] =
    await AutomaticSpeechRecognitionPipeline.getInstance(
      null,
      _model,
      modelOptions
    );

  let startTime;
  let numTokens = 0;
  const callback_function = (output) => {
    startTime ??= performance.now();

    let tps;
    if (numTokens++ > 0) {
      tps = (numTokens / (performance.now() - startTime)) * 1000;
    }
    self.postMessage({
      status: 'update',
      output,
      tps,
      numTokens,
    });
  };

  const streamer = new TextStreamer(tokenizer, {
    skip_prompt: true,
    skip_special_tokens: true,
    callback_function,
  });

  const inputs = await processor(audio);

  const outputs = await model.generate({
    ...inputs,
    max_new_tokens: MAX_NEW_TOKENS,
    streamer,
  });

  let modelOutput = tokenizer.batch_decode(outputs, {
    skip_special_tokens: true,
  });

  const outputString = modelOutput.join(' ');

  // Find new words
  let result = getNewString(lastConfirmedString, outputString);
  if (outputString !== '') {
    const outputStringArray = result.split(' ');
    // Get the last word of the array and store it as the lastConfirmedString
    lastConfirmedString = outputString;
    lastConfirmedWord = outputStringArray.pop();
    result = outputStringArray.join(' ');
  }

  // Send the output back to the main thread
  self.postMessage({
    status: 'complete',
    output: [result],
  });
  processing = false;
}

async function load({
  modelId = 'onnx-community/whisper-tiny.en_timestamped',
  modelOptions = DEFAULT_MODEL_OPTIONS,
}) {
  try {
    self.postMessage({
      status: 'loading',
      data: 'Loading model',
    });

    // Load the pipeline and save it for future use.
    // eslint-disable-next-line no-unused-vars
    const [tokenizer, processor, model] =
      await AutomaticSpeechRecognitionPipeline.getInstance(
        (x) => {
          // We also add a progress callback to the pipeline so that we can
          // track model loading.
          self.postMessage(x);
        },
        modelId,
        modelOptions
      );

    self.postMessage({
      status: 'loading',
      data: 'Compiling model',
    });

    // Run model with dummy input to compile shaders
    await model.generate({
      input_features: full([1, 80, 3000], 0.0),
      max_new_tokens: 1,
    });
    self.postMessage({ status: 'ready' });
  } catch (error) {
    self.postMessage({ status: 'error', error });
    await destroy();
  }
}

function getAvailableModels() {
  self.postMessage({ status: 'models', models: SAMPLE_MODELS });
  return SAMPLE_MODELS;
}

async function destroy() {
  return await AutomaticSpeechRecognitionPipeline.dispose();
}

// Listen for messages from the main thread
self.addEventListener('message', async (e) => {
  const { type, data } = e.data;

  switch (type) {
    case 'load':
      load(data);
      break;

    case 'generate':
      generate(data);
      break;

    case 'list':
      getAvailableModels();
      break;

    case 'dispose':
      destroy();
      break;
  }
});
