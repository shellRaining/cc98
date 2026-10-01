import { StringDecoder } from "node:string_decoder";

/** JSON 字符串可含 U+2028/U+2029，协议只以 LF 分帧。 */
export async function* jsonLines(input: AsyncIterable<Uint8Array>) {
  const decoder = new StringDecoder("utf8");
  let pending = "";
  for await (const chunk of input) {
    pending += decoder.write(chunk);
    let end: number;
    while ((end = pending.indexOf("\n")) !== -1) {
      yield pending.slice(0, end);
      pending = pending.slice(end + 1);
    }
  }
  pending += decoder.end();
  if (pending) throw new Error("JSONL 最后一行缺少换行结尾");
}
