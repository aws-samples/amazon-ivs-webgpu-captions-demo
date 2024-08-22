#!/usr/bin/env node
import "source-map-support/register";

import { App } from "aws-cdk-lib";

import BackendStack from "../lib/backendStack";
import ClientStack from "../lib/clientStack";

const app = new App();
const isBootstrap = JSON.parse(process.env.BOOTSTRAP || "false");

// Environment
const account = process.env.AWS_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.AWS_REGION || process.env.CDK_DEFAULT_REGION;
const env = { account, region };

// Runtime context values
const stackType = app.node.tryGetContext("stackType");

if (stackType === "backend" || isBootstrap) {
  // eslint-disable-next-line no-new
  const backendStack = new BackendStack(
    app,
    "AmazonIVSWebGPUCaptionsDemoBackendStack",
    {
      env,
    },
  );
}

if (stackType === "website" || isBootstrap) {
  // eslint-disable-next-line no-new
  const clientStack = new ClientStack(
    app,
    "AmazonIVSWebGPUCaptionsDemoClientStack",
    {
      env,
    },
  );
}
