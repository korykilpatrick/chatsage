import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const generate = () => {
  console.log('Starting OpenAPI code generation...');

  const result = spawnSync('npx', [
    '@openapitools/openapi-generator-cli',
    'generate',
    '-i', path.resolve(__dirname, '../attached_assets/openapi.json'),
    '-g', 'nodejs-express-server',
    '-o', path.resolve(__dirname, './generated'),
    '--skip-validate-spec',
    '--additional-properties=npmName=chatsage-api',
    '--additional-properties=npmVersion=1.0.0',
    '--additional-properties=supportsES6=true',
    '--additional-properties=useSingleRequestParameter=false',
    '--additional-properties=modelPropertyNaming=camelCase',
    '--additional-properties=servicePort=5000',
    '--additional-properties=basePort=5000',
    '--additional-properties=projectName=chatsage-api',
    '--additional-properties=sourceFolder=src'
  ], { 
    stdio: 'inherit',
    encoding: 'utf-8'
  });

  if (result.error) {
    console.error('Error generating code:', result.error);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error('Generator exited with status:', result.status);
    process.exit(1);
  }

  console.log('Code generation completed successfully');
};

generate();