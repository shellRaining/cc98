import { authOperations } from "./auth.ts";
import { configOperations } from "./config.ts";
import { boardOperations } from "./board.ts";
import { topicOperations } from "./topic.ts";
import { postOperations } from "./post.ts";
import { userOperations } from "./user.ts";
import { meOperations } from "./me.ts";
import { messageOperations } from "./message.ts";
import { fileOperations } from "./file.ts";

export * from "./types.ts";

export const operationRegistry = [
  ...authOperations,
  ...configOperations,
  ...boardOperations,
  ...topicOperations,
  ...postOperations,
  ...userOperations,
  ...meOperations,
  ...messageOperations,
  ...fileOperations,
];
