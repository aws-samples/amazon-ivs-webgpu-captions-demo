# Amazon IVS WebGPU Captions Demo

A demo web application intended as an educational tool to demonstrate how you can add captions to a Amazon IVS Real-time and Low-latency streams using [transformers.js](https://github.com/xenova/transformers.js) and [WebGPU](https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API).

![A video with captioned subtitles](./app-screenshot.png)

**This project is intended for education purposes only and not for production usage.**

## Prerequisites

- [NodeJS](https://nodejs.org/) `v20.10.0` and Node package manager (npm).
  - If you have [node version manager](https://github.com/nvm-sh/nvm) installed, run `nvm use` to sync your node version with this project.
- `API_URL` from the deployed serverless infrastructure for this demo.
- [AWS CLI Version 2](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html)
- Access to an AWS Account with at least the following permissions:
  - Create IAM roles
  - Create Lambda Functions
  - Create Amazon IVS Stages
  - Create Amazon S3 Buckets
  - Create Cloudfront Distributions

## Running the demo

Follow these instructions to run the demo:

### Deploy backend infrastructure

1. Initialize the infrastructure: `npm run deploy:init`
2. Deploy the backend stack: `npm run deploy:backend`

For more details, review the [Amazon IVS WebGPU Captions Demo Serverless Infrastructure](./infra/README.md)

### Run client app

1. Run: `npm ci`
2. Run: `npm run dev`

### Deploy client app

The following command will deploy the client website to a public cloudfront url.

1. Run: `npm deploy:website`

### Replace the low-latency IVS stream

Replace the `PLAYBACK_URL` in [src/constants.js](./src/constants.js#L3) with your IVS Playback URL.

## Known issues and limitations

- The application is meant for demonstration purposes and **not** for production use.
- This application is only tested and supported on browsers and devices that support WebGPU. Other browsers and devices, including mobile browsers and smartphones, may work with this tool, but are not officially supported at this time.

## About Amazon IVS

Amazon Interactive Video Service (Amazon IVS) is a managed livestreaming and stream chat solution that is quick and easy to set up, and ideal for creating interactive video experiences. [Learn more](https://aws.amazon.com/ivs/).

- [Amazon IVS docs](https://docs.aws.amazon.com/ivs/)
- [User Guide](https://docs.aws.amazon.com/ivs/latest/userguide/)
- [API Reference](https://docs.aws.amazon.com/ivs/latest/APIReference/)
- [Setting Up for Streaming with Amazon Interactive Video Service](https://aws.amazon.com/blogs/media/setting-up-for-streaming-with-amazon-ivs/)
- [Learn more about Amazon IVS on IVS.rocks](https://ivs.rocks/)
- [View more demos like this](https://ivs.rocks/examples)
