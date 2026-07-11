import type { z } from "zod";

export type ApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export type ApiRisk = "read-only" | "account-scoped" | "write" | "destructive";
export type ApiVerificationStatus =
  | "unknown"
  | "legacy-observed"
  | "verified-anonymous"
  | "verified-authenticated"
  | "verified-write"
  | "permission-denied"
  | "authentication-rejected"
  | "conflicted";

export interface OperationParameter {
  name: string;
  in: "path" | "query" | "header" | "cookie";
  required: boolean;
  schema: z.ZodType;
  description?: string;
  probeValue?: unknown;
}

export interface OperationBody {
  required: boolean;
  contentType: string;
  schema: z.ZodType;
}

export interface OperationResponse {
  description: string;
  contentType?: string;
  schema?: z.ZodType;
}

export interface ApiOperation {
  method: ApiMethod;
  path: string;
  operationId: string;
  summary: string;
  description?: string;
  tags: string[];
  servers?: { url: string; description?: string }[];
  parameters: OperationParameter[];
  requestBody?: OperationBody;
  responses: Record<string, OperationResponse>;
  auth: "anonymous" | "required";
  risk: ApiRisk;
  verificationStatus: ApiVerificationStatus;
  sources: string[];
  deprecated?: boolean;
}

export function defineOperations<const Operations extends readonly ApiOperation[]>(
  operations: Operations,
): Operations {
  return operations;
}
