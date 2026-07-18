import {
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
  type HubConnection,
} from "@microsoft/signalr";
import type { QueryClient } from "@tanstack/vue-query";
import { ensureValidAccessToken } from "../../lib/auth";
import { createLogger } from "../../lib/logger";
import { queryKeys } from "../../api/queries";

export type RealtimeEvent = "message" | "notification";

export interface MessageQueryInvalidator {
  invalidateQueries: QueryClient["invalidateQueries"];
}

export async function invalidateMessageQueries(
  queryClient: MessageQueryInvalidator,
  event: RealtimeEvent,
): Promise<void> {
  if (event === "message") {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.privateConversationRoot,
    });
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.unreadCountsRoot }),
      queryClient.invalidateQueries({ queryKey: queryKeys.privateContactsRoot }),
    ]);
    return;
  }
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.unreadCountsRoot }),
    queryClient.invalidateQueries({ queryKey: queryKeys.notificationsRoot }),
  ]);
}

const logger = createLogger("message-realtime");

export class MessageRealtimeService {
  private readonly queryClient: QueryClient;
  private connection: HubConnection | null = null;
  private starting: Promise<void> | null = null;

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient;
  }

  async start(): Promise<void> {
    if (this.starting) return this.starting;
    if (this.connection?.state === HubConnectionState.Connected) return;

    const connection =
      this.connection ??
      new HubConnectionBuilder()
        .withUrl("https://api-v2.cc98.org/signalr/notification", {
          accessTokenFactory: async () => (await ensureValidAccessToken()) ?? "",
        })
        .withAutomaticReconnect([0, 2000, 10_000, 30_000])
        .configureLogging(LogLevel.Warning)
        .build();

    if (!this.connection) {
      connection.on("NotifyMessageReceive", () => this.receive("message"));
      connection.on("NotifyNotificationReceive", () => this.receive("notification"));
      connection.onreconnected(() => {
        void invalidateMessageQueries(this.queryClient, "notification");
        void invalidateMessageQueries(this.queryClient, "message");
      });
      connection.onclose((error) => {
        if (error) logger.warn({ error }, "SignalR 连接已关闭");
      });
      this.connection = connection;
    }

    const task = connection
      .start()
      .then(() => logger.info("SignalR 消息连接已建立"))
      .catch((error: unknown) => {
        logger.warn({ error }, "SignalR 消息连接失败，保留 HTTP 刷新");
      })
      .finally(() => {
        this.starting = null;
      });
    this.starting = task;
    return task;
  }

  async stop(): Promise<void> {
    const connection = this.connection;
    if (!connection || connection.state === HubConnectionState.Disconnected) return;
    try {
      await connection.stop();
    } catch (error) {
      logger.warn({ error }, "停止 SignalR 连接失败");
    }
  }

  dispose(): void {
    void this.stop();
  }

  private receive(event: RealtimeEvent): void {
    void invalidateMessageQueries(this.queryClient, event);
  }
}
