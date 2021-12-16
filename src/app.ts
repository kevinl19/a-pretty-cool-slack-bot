import { isInitialConfigValid, start } from './util';

if (isInitialConfigValid()) {
  start();
} else {
  console.log('Process exiting');
  process.exit(1);
}

