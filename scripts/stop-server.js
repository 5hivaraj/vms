import { stopVmsServer } from '../backend/src/utils/serverProcess.js';

const port = Number(process.env.PORT) || 5000;
const actions = await stopVmsServer(port);

if (actions.length === 0) {
  console.log('No VMS server was running.');
} else {
  console.log(actions.join('\n'));
}
