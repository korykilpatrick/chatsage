import { createServer } from 'vite';
import { watch } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';

async function startTestWatch() {
  // Create Vite dev server for HMR support
  const vite = await createServer({
    configFile: path.resolve(__dirname, '../../vitest.config.ts'),
    server: {
      watch: {
        ignored: ['**/coverage/**', '**/node_modules/**'],
        usePolling: true, // Required for Replit environment
      },
    },
  });

  // Start Vitest in watch mode
  const vitest = spawn('npx', ['vitest', 'watch'], {
    stdio: 'inherit',
    shell: true,
  });

  // Handle process termination
  process.on('SIGINT', async () => {
    await vite.close();
    vitest.kill();
    process.exit(0);
  });

  // Watch for file changes
  const watcher = watch(path.resolve(__dirname, '../'), {
    recursive: true,
  });

  for await (const event of watcher) {
    if (!event.filename?.includes('node_modules') && 
        !event.filename?.includes('coverage')) {
      // Trigger test re-run
      vitest.kill('SIGUSR2');
    }
  }
}

startTestWatch().catch(console.error);
