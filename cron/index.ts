import { WebClient } from '@slack/web-api';
import { Credentials } from '../src/constant';
import { schedule, ScheduleOptions } from 'node-cron';
import { notifyUserSignups } from './tasks';
import { Dependencies } from '../src/type';
import { setupDependencies } from '../src/util';

interface JobParams {
  expr: string,
  func: (dep: Dependencies) => void,
  opts?: ScheduleOptions,
}

const slack = new WebClient(Credentials.slack.token);
const jobs: JobParams[] = [{
  expr: '0 10 * * 0-5', /* Every weekday at 10am ET */
  func: (dep: Dependencies) => notifyUserSignups(...dep),
  opts: { timezone: 'America/Toronto' },
}];

const sched = (j: JobParams) => schedule(j.expr, () => j.func, j.opts);

const start = () => {
  console.log('Starting cron');
  const dependencies = setupDependencies(slack);
  const tasks = jobs.map(j => ({ task: schedule(j.expr, () => j.func, j.opts) }));
  console.log(`Scheduled ${tasks.length} jobs\n`);
};

start();
