import {
  AutoTokenizer,
  AutoProcessor,
  WhisperForConditionalGeneration,
  TextStreamer,
  full,
} from '@xenova/transformers';
import {
  DEFAULT_MODEL_OPTIONS,
  MAX_NEW_TOKENS,
  SAMPLE_MODELS,
} from './constants';

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

// Used for models with timestamp completion
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

// Used for models with timestamp completion
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
