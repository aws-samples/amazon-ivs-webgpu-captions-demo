import { ParticipantToken } from "@aws-sdk/client-ivs-realtime";
import type { ParticipantTokenCapability } from "@aws-sdk/client-ivs-realtime";
import { createStageToken } from "sdk/realtime";
import { StageResponse, UserAttributes } from "./types";
import { ErrorWithCode } from "../lambda/util";

/**
 * A function that creates creates a stage token and chat token for the
 * stage and room associated with the provided `sessionId`
 */

async function joinStage(
  stageArn: string,
  userId: string,
  attributes: UserAttributes,
  capabilities: ParticipantTokenCapability[],
) {
  let token: ParticipantToken;

  // Create stage token
  try {
    const stageTokenData = await createStageToken(
      stageArn as string,
      { userId, attributes, capabilities } as {
        userId: string;
        attributes: UserAttributes;
      },
    );
    token = stageTokenData;
  } catch (err) {
    throw new ErrorWithCode(
      `Failed to create stage participant token:: ${(err as Error).toString()}`,
      500,
    );
  }

  return token;
}

// eslint-disable-next-line import/prefer-default-export
export { joinStage };
