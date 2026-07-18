import dayjs from "dayjs";

export function formatDiscoveryTime(value: string | undefined, now = new Date()) {
  if (!value) return "—";
  const time = new Date(value);
  if (Number.isNaN(time.getTime())) return value;
  const diff = now.getTime() - time.getTime();
  const minutes = Math.max(0, Math.floor(diff / 60_000));
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(diff / 3_600_000);
  const clock = time.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  if (hours < 24 && time.getDate() === now.getDate()) return `今天 ${clock}`;
  const dayDiff = Math.floor(
    (new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() -
      new Date(time.getFullYear(), time.getMonth(), time.getDate()).getTime()) /
      86_400_000,
  );
  if (dayDiff === 1) return `昨天 ${clock}`;
  if (dayDiff === 2) return `前天 ${clock}`;
  return `${time.getFullYear()}-${String(time.getMonth() + 1).padStart(2, "0")}-${String(time.getDate()).padStart(2, "0")} ${clock}`;
}

export function formatDiscoveryDateTime(value: string | undefined): string {
  if (!value) return "—";
  const time = dayjs(value);
  return time.isValid() ? time.format("YYYY-MM-DD HH:mm:ss") : value;
}
