import { Dependencies } from '../src/type';
import { setupDependencies } from '../src/util';
import { WebClient } from '@slack/web-api';
import { Credentials } from '../src/constant';
import { schedule, ScheduleOptions } from 'node-cron';
import { notifyUserSignups } from './tasks';

interface CronTask {
  task: Function,
  options: ScheduleOptions,
  cronExpression: string,
}

class CronManager {
  private readonly dependencies: Dependencies;
  constructor(props: { dependencies: Dependencies }) {
    this.dependencies = props.dependencies;
  }

  assignTasks(tasks: CronTask[]) {
    for (const task of tasks) {
      schedule(task.cronExpression, () => {
        task.task(this.dependencies);
      } );
    }
  }
}

const slackClient = new WebClient(Credentials.slack.token);
const dependencies = setupDependencies(slackClient);

const manager = new CronManager({dependencies});
manager.assignTasks([
  {
    task: notifyUserSignups,
    cronExpression: '0 10 * * 0-5',
    options: { timezone: 'America/Toronto' }
  }
]);

console.log('Cron job started 👌');
