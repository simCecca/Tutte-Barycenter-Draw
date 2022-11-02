/**
 *
 * @param {Array<Promise<unknown>>} promises
 * @param {(value: any) => unknown} action
 * @returns
 */
export const promiseAllOneFirst = async (
  promises, // Array<Promise<unknown>>
  action // (value: any) => unknown
) => {
  let barrier = 0;
  return new Promise((resolve) => {
    promises.forEach((promise) =>
      promise.then((r) => {
        action(r);
        if (barrier == promises.length - 1) {
          resolve("ok");
          return;
        }
        barrier++;
      })
    );
  });
};

export const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
