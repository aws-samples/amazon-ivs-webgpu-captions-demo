// eslint-disable-next-line no-undef
const API_URL = process.env.API_URL;
const PLAYBACK_URL =
  'https://760b256a3da8.us-east-1.playback.live-video.net/api/video/v1/us-east-1.049054135175.channel.6a8P5HuaulWu.m3u8';
const MAX_NEW_TOKENS = 64;
const DEFAULT_MODEL_OPTIONS = {
  dtype: {
    encoder_model: 'fp32',
    decoder_model_merged: 'fp32',
  },
  device: 'webgpu',
};
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

export {
  API_URL,
  PLAYBACK_URL,
  MAX_NEW_TOKENS,
  SAMPLE_MODELS,
  DEFAULT_MODEL_OPTIONS,
};
