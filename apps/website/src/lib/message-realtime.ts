import {
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
  type HubConnection,
} from "@microsoft/signalr";
import type { QueryClient } from "@tanstack/vue-query";
import { ensureValidAccessToken } from "./auth";
import { createLogger } from "./logger";
import { queryKeys } from "../api/queries";

type RealtimeEvent = "message" | "notification";

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
        void this.invalidate("notification");
        void this.invalidate("message");
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
    void this.invalidate(event);
  }

  private async invalidate(event: RealtimeEvent): Promise<void> {
    if (event === "message") {
      await this.queryClient.invalidateQueries({
        queryKey: queryKeys.privateConversationRoot,
      });
      await Promise.all([
        this.queryClient.invalidateQueries({ queryKey: queryKeys.unreadCountsRoot }),
        this.queryClient.invalidateQueries({ queryKey: queryKeys.privateContactsRoot }),
      ]);
      return;
    }
    await Promise.all([
      this.queryClient.invalidateQueries({ queryKey: queryKeys.unreadCountsRoot }),
      this.queryClient.invalidateQueries({ queryKey: queryKeys.notificationsRoot }),
    ]);
  }
}
