import readline from 'readline';
import process from 'process';
import {
  CloudFormationClient,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';
import { fromIni } from '@aws-sdk/credential-providers';
import { writeFileSync } from 'fs';

// Create the cloudformation client to get the API URL
const awsProfile = process.env.AWS_PROFILE;
let clientConfig = {};
if (awsProfile) {
  const credentialsProvider = fromIni({ profile: awsProfile });
  clientConfig = { credentials: credentialsProvider };
}
const cloudFormationClient = new CloudFormationClient(clientConfig);

async function initApiUrl() {
  let apiUrl = undefined;
  try {
    apiUrl = await fetchApiUrl();
  } catch (err) {
    const shouldContinue = await confirmAction(
      `${err.message}. 
          \nCould not find a deployed backend. 
          \nDo you wish to manually set a backend API URL? [Y/n]`
    );

    if (!shouldContinue) {
      throw new Error('Operation aborted by user.');
    }

    apiUrl = await validateApiUrl();
  }

  const shouldSave = await confirmAction(
    `API URL: ${apiUrl}
      \nDo you wish to save this API URL for future use? [Y/n]`
  );

  if (shouldSave) {
    try {
      const content = `API_URL=${apiUrl}`;
      writeFileSync('./.env', content);
    } catch (err) {
      console.error('Failed to write file:', err);
    }
  }
}

async function fetchApiUrl() {
  try {
    const { Stacks } = await cloudFormationClient.send(
      new DescribeStacksCommand({
        StackName: 'AmazonIVSWebGPUCaptionsDemoBackendStack',
      })
    );
    const [backendStack] = Stacks;
    const outputs = backendStack.Outputs;

    for (const output of outputs) {
      const value = findValueBySubstring(
        output,
        'AmazonIVSWebGPUCaptionsDemoApiEndpoint'
      );
      if (value) return value;
    }
  } catch (err) {
    throw new Error(err);
  }
}

async function validateApiUrl() {
  const validator = (response) => {
    const startsWithHttps = response.startsWith('https://');
    const endsWithSlash = response.at(-1) === '/';
    return startsWithHttps && endsWithSlash;
  };

  const validationMessage =
    '\nInvalid API URL provided. API URL must begin with `https://` and end with a `/`';
  return await readUserInput(`Enter your backend API URL: `, {
    validator,
    validationMessage,
  });
}

function findValueBySubstring(obj, substring) {
  const values = Object.values(obj);
  const matchingValues = values.filter((value) => value.includes(substring));
  if (matchingValues.length === 0) return null;
  return obj.OutputValue;
}

async function confirmAction(query) {
  const readlineInterface = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  readlineInterface.on('SIGINT', () => process.exit(-1));

  const answer = await new Promise((resolve) => {
    readlineInterface.question(`\n${query} `, (ans) => {
      readlineInterface.close();
      resolve(ans);
    });
  });

  if (answer.toLowerCase() === 'y' || answer.toLowerCase() === '') {
    return true;
  }

  if (answer.toLowerCase() === 'n') {
    return false;
  }

  console.info('Invalid answer provided.');

  return confirmAction(query);
}

async function readUserInput(
  query,
  { validator = () => true, validationMessage = 'Invalid answer provided.' }
) {
  const readlineInterface = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  readlineInterface.on('SIGINT', () => process.exit(-1));

  const answer = await new Promise((resolve) => {
    readlineInterface.question(`\n${query} `, (ans) => {
      readlineInterface.close();
      resolve(ans);
    });
  });

  if (validator(answer)) {
    return answer;
  }

  console.info(validationMessage);

  return readUserInput(query, validator);
}

export {
  findValueBySubstring,
  confirmAction,
  readUserInput,
  fetchApiUrl,
  validateApiUrl,
  initApiUrl,
};
