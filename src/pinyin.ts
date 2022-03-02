import DICT_ZI from "../data/dict-zi"; // 单个汉字拼音数据。
import DICT_PHRASES from "../data/phrases-dict"; // 词组拼音数据。
import { segment } from "./segment";
import { toFixed } from "./format";
import { combo } from "./util";
import type { IPinyinOptions, IPinyinOptionsUser } from "./declare";
import { PINYIN_STYLE } from "./constant";

const DEFAULT_OPTIONS: IPinyinOptions = {
  style: PINYIN_STYLE.TONE, // 风格
  segment: false,           // 分词。
  heteronym: false,         // 多音字
  group: false,             // 词组拼音分组
};

// export default function(hans: string): string {
//   return hans;
// }
export default function pinyin(hans: string, options?: IPinyinOptionsUser): string[][] {
  if(typeof hans !== "string"){
    return [];
  }
  const opt: IPinyinOptions = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  // 因为分词结果有词性信息，结构不同，处理也不相同，所以需要分别处理。
  if (opt.segment) {
    // 分词加词性标注转换。
    return segment_pinyin(hans, opt);
  } else {
    // 单字拆分转换。连续的非中文字符作为一个词（原样输出，不转换成拼音）。
    return normal_pinyin(hans, opt)
  }
}

function normal_pinyin(hans: string, options: IPinyinOptions): string[][] {
  let pys: string[][] = [];
  let nohans = "";

  for(let i = 0, l = hans.length; i < l; i++) {
    const words = hans[i];
    const firstCharCode = words.charCodeAt(0);

    if(DICT_ZI[firstCharCode]){
      // 处理前面的“非中文”部分。
      if (nohans.length > 0) {
        pys.push([nohans]);
        nohans = ""; // 重置“非中文”缓存。
      }
      pys.push(single_pinyin(words, options));
    } else {
      nohans += words;
    }
  }

  // 清理最后的非中文字符串。
  if(nohans.length > 0){
    pys.push([nohans]);
    nohans = ""; // reset non-chinese words.
  }
  return pys;
}

// 单字拼音转换。
// @param {String} han, 单个汉字
// @return {Array} 返回拼音列表，多音字会有多个拼音项。
function single_pinyin(han: string, options: IPinyinOptions): string[] {
  if (typeof han !== "string") {
    return [];
  }
  if (han.length !== 1) {
    return single_pinyin(han.charAt(0), options);
  }

  let hanCode = han.charCodeAt(0);

  if (!DICT_ZI[hanCode]) {
    return [han];
  }

  let pys = DICT_ZI[hanCode].split(",");
  if(!options.heteronym){
    return [toFixed(pys[0], options.style)];
  }

  // 临时存储已存在的拼音，避免多音字拼音转换为非注音风格出现重复。
  let py_cached: Record<string,string> = {};
  let pinyins = [];
  for(let i = 0, l = pys.length; i < l; i++){
    const py = toFixed(pys[i], options.style);
    if(py_cached.hasOwnProperty(py)){
      continue;
    }
    py_cached[py] = py;

    pinyins.push(py);
  }
  return pinyins;
}

/**
 * 将文本分词，并转换成拼音。
 */
function segment_pinyin(hans: string, options: IPinyinOptions): string[][] {
  const phrases =  segment(hans, "nodejieba");
  let pys: string[][] = [];
  let nohans = "";
  for (let i = 0, l = phrases.length; i < l; i++) {
    const words = phrases[i];
    const firstCharCode = words.charCodeAt(0);

    if(DICT_ZI[firstCharCode]){
      // ends of non-chinese words.
      if(nohans.length > 0){
        pys.push([nohans]);
        nohans = ""; // reset non-chinese words.
      }

      const newPys = words.length === 1
        ? normal_pinyin(words, options)
        : phrases_pinyin(words, options);

      if (options.group) {
        pys.push(groupPhrases(newPys));
      } else {
        pys = pys.concat(newPys);
      }

    } else {
      nohans += words;
    }
  }

  // 清理最后的非中文字符串。
  if(nohans.length > 0){
    pys.push([nohans]);
    nohans = ""; // reset non-chinese words.
  }
  return pys;
}

/*
 * 词语注音
 * @param {String} phrases, 指定的词组。
 * @param {Object} options, 选项。
 * @return {Array}
 */
function phrases_pinyin(phrases: string, options: IPinyinOptions) {
  let py: string[][] = [];
  if (DICT_PHRASES.hasOwnProperty(phrases)){
    //! copy pinyin result.
    DICT_PHRASES[phrases].forEach(function(item: string[], idx: number) {
      py[idx] = [];
      if (options.heteronym) {
        item.forEach(function(py_item, py_index) {
          py[idx][py_index] = toFixed(py_item, options.style);
        });
      } else {
        py[idx][0] = toFixed(item[0], options.style);
      }
    });
  } else {
    for(let i = 0, l = phrases.length; i < l; i++){
      py = py.concat(single_pinyin(phrases[i], options));
    }
  }
  return py;
}

function groupPhrases(phrases: string[][]) {
  if (phrases.length === 1) {
    return phrases[0];
  }

  const grouped = combo(phrases);

  return grouped;
}

/**
 * 比较两个汉字转成拼音后的排序顺序，可以用作默认的拼音排序算法。
 *
 * @param {String} hanA 汉字字符串 A。
 * @return {String} hanB 汉字字符串 B。
 * @return {Number} 返回 -1，0，或 1。
 */
export function compare(hanA: string, hanB: string): number {
  const pinyinA = pinyin(hanA, DEFAULT_OPTIONS);
  const pinyinB = pinyin(hanB, DEFAULT_OPTIONS);
  return String(pinyinA).localeCompare(String(pinyinB));
}
