import { EMOJI_KEYWORDS } from './constant';

const emojiSet = require('emoji-set');


const nRandomElements = (n: number) => (el: any[]) =>
  el.sort(() => 0.5 - Math.random());

// @todo: Needz more algoz
const getHappyEmojis = (n: number) => nRandomElements(n)(
  EMOJI_KEYWORDS.reduce((acc, keyword) => {
    const emojis = emojiSet.searchByKeyword(keyword, false, true);
    return acc.concat(...emojis);
  }, []),
);

export {
  getHappyEmojis,
};

