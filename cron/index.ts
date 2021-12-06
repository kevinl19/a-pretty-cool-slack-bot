import { WebClient } from '@slack/web-api';
import { Credentials } from '../src/constant';
import { schedule, ScheduledTask, ScheduleOptions } from 'node-cron';
import { notifyUserSignups } from './tasks';
import { setupDependencies } from '../src/util';
import { Dependencies } from '../src/type';

interface Job {
  expr: string,
  func: () => void,
  opts?: ScheduleOptions,
}

interface CronManagerProps {
  dependencies: Dependencies,
}

class CronManager {
  tasks: ScheduledTask[] = [];
  dependencies?: Dependencies;

  private static _instance: CronManager;

  constructor(props?: CronManagerProps) {
    CronManager._instance = this;
    this.dependencies = props
      ? props.dependencies
      : undefined;
  }

  static getInstance() {
    if (!CronManager._instance) {
      CronManager._instance = new CronManager();
    }
    return CronManager._instance;
  }

  async scheduleJobs(jobs: Job[]) {
    for (const j of jobs) {
      this.tasks.push(schedule(j.expr, j.func, j.opts));
    }
    return true;
  }
}

const setup = async () => {
  const slack = new WebClient(Credentials.slack.token);
  const dependencies = setupDependencies(slack);
  const jobs: Job[] = [{
    func: () => notifyUserSignups(dependencies),
    opts: { timezone: 'America/Toronto' },
    expr: '0 10 * * 0-5', // Every weekday at 10am ET
  }];

  return { dependencies, jobs };
};

(async () => {
  const slack = new WebClient(Credentials.slack.token);
  const dependencies = setupDependencies(slack);
  const jobs: Job[] = [{
    func: () => notifyUserSignups(dependencies),
    opts: { timezone: 'America/Toronto' },
    expr: '0 10 * * 0-5', // Every weekday at 10am ET
  }];


})()

(() => setup().then(
  ({ dependencies }) =>
    ()))();

const manager = CronManager.getInstance().then();
manager.scheduleJobs(object);
