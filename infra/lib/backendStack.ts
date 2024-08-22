import { Duration, Stack, StackProps } from "aws-cdk-lib";
import {
  Cors,
  LambdaIntegration,
  RestApi,
  RequestValidator,
  Model,
  JsonSchemaType,
} from "aws-cdk-lib/aws-apigateway";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { CfnStage } from "aws-cdk-lib/aws-ivs";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";

function getPolicy(): PolicyStatement {
  return new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ["ivs:*"],
    resources: ["*"],
  });
}

// AmazonIVSWebGPUCaptionsDemo

class BackendStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const stage = new CfnStage(this, "AmazonIVSWebGPUCaptionsDemoStage", {
      name: "AmazonIVSWebGPUCaptionsDemoStage",
      tags: [
        {
          key: "AmazonIVSDemoResource",
          value: "AmazonIVSWebGPUCaptionsDemoResource",
        },
      ],
    });

    const initialPolicy = [getPolicy()];
    const runtime = Runtime.NODEJS_20_X;
    const bundling = {
      /**
       * By default, when using the NODEJS_20_X runtime, @aws-sdk/* is included in externalModules
       * since it is already available in the Lambda runtime. However, to ensure that the latest
       * @aws-sdk version is used, which contains the @aws-sdk/client-ivs-realtime package, we
       * remove @aws-sdk/* from externalModules so that we bundle it instead.
       */
      externalModules: [],
      minify: true,
    };

    const timeout = Duration.minutes(1);

    const stageJoinFunction = new NodejsFunction(
      this,
      "AmazonIVSWebGPUCaptionsDemoJoinFunction",
      {
        entry: "lambda/stageJoinHandler.ts",
        handler: "stageJoinHandler",
        initialPolicy,
        runtime,
        bundling,
        timeout,
        environment: {
          STAGE_ARN: stage.ref,
        },
      },
    );

    const api = new RestApi(this, "AmazonIVSWebGPUCaptionsDemoApi", {
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: ["POST"],
        allowHeaders: Cors.DEFAULT_HEADERS,
      },
    });

    const joinModel = new Model(this, "join-model-validator", {
      restApi: api,
      contentType: "application/json",
      description: "Model used to validate body of join requests.",
      modelName: "joinModelCdk",
      schema: {
        type: JsonSchemaType.OBJECT,
        required: ["userId", "publish"],
        properties: {
          userId: { type: JsonSchemaType.STRING },
          publish: { type: JsonSchemaType.BOOLEAN },
          attributes: { type: JsonSchemaType.OBJECT },
        },
      },
    });

    const joinRequestValidator = new RequestValidator(
      this,
      "join-request-validator",
      {
        restApi: api,
        requestValidatorName: "join-request-validator",
        validateRequestBody: true,
      },
    );

    const joinPath = api.root.addResource("join");
    joinPath.addMethod("POST", new LambdaIntegration(stageJoinFunction), {
      requestValidator: joinRequestValidator,
      requestModels: {
        "application/json": joinModel,
      },
    });
  }
}

export default BackendStack;
