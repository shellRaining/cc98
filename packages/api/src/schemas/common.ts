import { z } from "zod";

export const errorEnvelopeSchema = z
  .looseObject({
    data: z.unknown().nullable().optional(),
    count: z.number().optional(),
    from: z.number().optional(),
    size: z.number().optional(),
    extra: z.unknown().nullable().optional(),
    errorCode: z.number().optional(),
  })
  .meta({ id: "ErrorEnvelope" });
export type ErrorEnvelope = z.infer<typeof errorEnvelopeSchema>;

export const errorCodeSchema = z.string().meta({ id: "ErrorCode" });
export type ErrorCode = z.infer<typeof errorCodeSchema>;
