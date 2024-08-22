import {
  IVSRealTime,
  Stage,
  ParticipantTokenConfiguration,
  ParticipantToken,
} from "@aws-sdk/client-ivs-realtime";
import { ResourceTags } from "../../lambda/constants";

const region = process.env.AWS_REGION;

const ivsRealtimeClient = new IVSRealTime({ region, maxAttempts: 12 });

/**
 * IVS stages
 */
async function createStage(participant: ParticipantTokenConfiguration) {
  const { stage, participantTokens } = await ivsRealtimeClient.createStage({
    participantTokenConfigurations: [participant],
    tags: ResourceTags,
  });

  return {
    stage,
    participantTokens,
  } as {
    stage: Required<Stage>;
    participantTokens: Required<ParticipantToken[]>;
  };
}

async function createStageToken(
  stageArn: string,
  participant: ParticipantTokenConfiguration,
) {
  const { participantToken } = await ivsRealtimeClient.createParticipantToken({
    stageArn,
    ...participant,
  });
  return participantToken as Required<ParticipantToken>;
}

function deleteStage(arn: string) {
  return ivsRealtimeClient.deleteStage({ arn });
}

function disconnectParticipant(
  stageArn: string,
  participantId: string,
  reason: string,
) {
  return ivsRealtimeClient.disconnectParticipant({
    stageArn,
    participantId,
    reason,
  });
}

export { createStage, createStageToken, deleteStage, disconnectParticipant };
