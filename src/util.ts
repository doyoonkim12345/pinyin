/**
 * 组合 2 个拼音数组。
 * @param {string[]} a1 第一个数组，形如 ["zhāo", "cháo"]
 * @param {string[]} a2 字符串型数组。形如 ["yáng"]
 * @return {string[]} 组合后的一维数组，如上可得 ["zhāoyáng", "cháoyáng"]
 */
export function combo2array(a1: string[], a2: string[]): string[] {
  const result: string[] = [];
  if (!a1.length) {
    return a2;
  }
  if (!a2.length) {
    return a1;
  }
  for (let i = 0, l = a1.length; i < l; i++) {
    for (let j = 0, m = a2.length; j < m; j++) {
      result.push(a1[i] + a2[j]);
    }
  }
  return result;
}

/**
 * 合并二维元祖。
 * @param {string[][]} arr 二维元祖 [["zhāo", "cháo"], ["yáng"], ["dōng"], ["shēng"]]
 * @return {string[]} 返回二维字符串组合数组。形如
 *  [
 *    ["zhāoyáng"], ["dōng"], ["shēng"],
 *    ["cháoyáng"], ["dōng"], ["shēng"]
 *  ]
 */
export function combo(arr: string[][]): string[] {
  if (arr.length === 0) {
    return [];
  }
  if (arr.length === 1) {
    return arr[0];
  }
  let result: string[] = combo2array(arr[0], arr[1]);
  for (let i = 2, l = arr.length; i < l; i++) {
    result = combo2array(result, arr[i]);
  }
  return result;
}
