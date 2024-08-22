import { APIGatewayProxyResult } from "aws-lambda";

class ErrorWithCode extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

function getResponseHeaders() {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Origin": "*",
  };
}

function createApiGwResponse(
  statusCode: number,
  result: unknown,
): APIGatewayProxyResult {
  const headers = getResponseHeaders();

  const body = JSON.stringify(result);

  return {
    headers,
    statusCode,
    body,
  };
}

export {
  createApiGwResponse,
  getResponseHeaders,
  ErrorWithCode,
};
