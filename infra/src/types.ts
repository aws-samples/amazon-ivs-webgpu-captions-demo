import { ParticipantToken } from "@aws-sdk/client-ivs-realtime";

type UserAttributes = {
  username: string;
  demoParticipantRole: string;
};

type StageResponse = {
  id: string;
  token: ParticipantToken;
};

type Headers = {
  "Content-Type": string;
  "Access-Control-Allow-Headers": string;
  "Access-Control-Allow-Origin": string;
  "Access-Control-Allow-Methods": string;
};

type ErrorDetails = {
  errorName: string;
  errorCode: number;
  errorSource: string;
  shouldLogErrorMetric?: boolean | undefined;
};

type ErrorWithCode = {
  message: string;
  statusCode: number;
};

export { Headers, StageResponse, UserAttributes, ErrorDetails, ErrorWithCode };
