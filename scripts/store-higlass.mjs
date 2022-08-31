import { startDevServer } from '@web/dev-server';
import { puppeteerLauncher } from '@web/test-runner-puppeteer';
import config from '../web-test-runner.config.mjs';

async function main() {
  const server = await startDevServer({
    ...config,
    browsers: [
      puppeteerLauncher({
        createPage({ config, browser }) { 
          console.log({ config, browser });
        }
      }),
    ]
  });
}

main();
