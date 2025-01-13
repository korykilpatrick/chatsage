import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const generate = () => {
  const result = spawnSync('npx', [
    '@openapitools/openapi-generator-cli',
    'generate',
    '-i', path.resolve(__dirname, '../attached_assets/openapi.json'),
    '-g', 'typescript-node',
    '-o', path.resolve(__dirname, './generated'),
    '--skip-validate-spec',
    '--additional-properties=framework=express',
    '--additional-properties=supportsES6=true',
    '--additional-properties=npmName=chatsage-api',
    '--additional-properties=npmVersion=1.0.0',
    '--additional-properties=useSingleRequestParameter=true'
  ], { stdio: 'inherit' });

  if (result.error) {
    console.error('Error generating code:', result.error);
    process.exit(1);
  }
};

generate();