import { RandomEmojis } from './constant';

// @todo: Need more algos
export const getRandomEmojis = (n: number = 3) => {
  const shuffled = RandomEmojis.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n).join('');
};

