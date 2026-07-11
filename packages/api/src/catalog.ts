import { operationRegistry } from "./operations/index.ts";
import type { ApiMethod, ApiRisk, ApiVerificationStatus } from "./operations/types.ts";

export type { ApiRisk, ApiVerificationStatus } from "./operations/types.ts";

export interface ApiEndpoint {
  method: ApiMethod;
  path: string;
  operationId: string;
  summary: string;
  tags: string[];
  risk: ApiRisk;
  verificationStatus: ApiVerificationStatus;
  requiresAuthentication: boolean;
}

export const endpointCatalog: ApiEndpoint[] = operationRegistry.map((operation) => ({
  method: operation.method,
  path: operation.path,
  operationId: operation.operationId,
  summary: operation.summary,
  tags: operation.tags,
  risk: operation.risk,
  verificationStatus: operation.verificationStatus,
  requiresAuthentication: operation.auth === "required",
}));
