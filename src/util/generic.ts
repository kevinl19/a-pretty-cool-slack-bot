import { KeywordsEmojiSet } from '../constant';

const emojiSet = require('emoji-set');


const nRandomElements = (elems: any[], n: number) =>
  elems.sort(() => 0.5 - Math.random())
  .slice(0, n);

// @todo: Needs more Algoz
const getHappyEmojis = (n: number) => {
  // Ex. ['😀', '😃', ...]
  const emojis = KeywordsEmojiSet.reduce((acc, keyword) => {
    const emojis = emojiSet.searchByKeyword(keyword, false, true);
    return acc.concat(...emojis);
  }, []);

  return nRandomElements(emojis, n);
};

export { getHappyEmojis };
