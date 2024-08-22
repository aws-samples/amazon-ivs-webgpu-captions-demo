import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { joinStage } from "../src/joinStage";
import { createApiGwResponse } from "./util";
import { ErrorWithCode } from "types";
import { ParticipantTokenCapability } from "@aws-sdk/client-ivs-realtime";

const { STAGE_ARN } = process.env;

async function stageJoinHandler(
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> {
  let body;
  let result;

  try {
    body = JSON.parse(event.body as string);
  } catch (err) {
    return createApiGwResponse(400, {
      error: `Failed to parse request body: ${(err as Error).toString()}`,
    });
  }

  // Set capabilities
  const capabilities = body.publish
    ? [ParticipantTokenCapability.PUBLISH]
    : [ParticipantTokenCapability.SUBSCRIBE];

  // Add demo attributes
  // Used in the frontend app to determine who to show in the window
  let attributes = body.attributes || {};
  attributes = body.publish
    ? { ...attributes, demoParticipantRole: "publisher" }
    : { ...attributes, demoParticipantRole: "subscriber" };

  try {
    result = await joinStage(
      STAGE_ARN as string,
      body.userId,
      attributes,
      capabilities,
    );
  } catch (err) {
    const { message, statusCode } = err as ErrorWithCode;
    return createApiGwResponse(statusCode, {
      error: message,
    });
  }

  return createApiGwResponse(200, result);
}

export { stageJoinHandler };
