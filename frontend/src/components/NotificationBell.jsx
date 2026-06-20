import { useEffect, useMemo, useRef, useState } from "react";
import { getCurrentUserFromStorage } from "../lib/auth";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../lib/notifications";
import { navigateTo } from "../lib/navigation";

const buildSeenKey = (userId) => `feedback_seen_notifications:${userId}`;

const loadSeenIds = (userId) => {
  if (!userId) return new Set();

  try {
    const raw = localStorage.getItem(buildSeenKey(userId));
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
};

const storeSeenIds = (userId, ids) => {
  if (!userId) return;
  localStorage.setItem(buildSeenKey(userId), JSON.stringify([...ids]));
};

const timeAgo = (value) => {
  const seconds = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;
  return `${Math.floor(seconds / 86400)} day ago`;
};

export default function NotificationBell() {
  const currentUser = getCurrentUserFromStorage();
  const [state, setState] = useState({
    loading: true,
    error: "",
    unreadCount: 0,
    notifications: [],
    open: false,
  });
  const bellRef = useRef(null);
  const initializedRef = useRef(false);

  const userId = currentUser?.id;
  const canUseBrowserNotifications = typeof window !== "undefined" && "Notification" in window;

  const loadNotifications = async () => {
    if (!currentUser) {
      return;
    }

    try {
      const response = await fetchNotifications();
      const data = response.data;

      setState((current) => ({
        ...current,
        loading: false,
        error: "",
        unreadCount: data.unreadCount || 0,
        notifications: data.notifications || [],
      }));

      const seenIds = loadSeenIds(userId);

      if (!initializedRef.current) {
        data.notifications.forEach((notification) => seenIds.add(notification.id));
        storeSeenIds(userId, seenIds);
        initializedRef.current = true;
        return;
      }

      const newUnreadNotifications = (data.notifications || []).filter(
        (notification) => !notification.isRead && !seenIds.has(notification.id)
      );

      if (newUnreadNotifications.length) {
        newUnreadNotifications.forEach((notification) => seenIds.add(notification.id));
        storeSeenIds(userId, seenIds);

        if (canUseBrowserNotifications && Notification.permission === "granted") {
          newUnreadNotifications.forEach((notification) => {
            new Notification(notification.title, {
              body: notification.message,
            });
          });
        }
      }
    } catch (error) {
      setState((current) => ({
        ...current,
        loading: false,
        error: error.message || "Failed to load notifications.",
      }));
    }
  };

  useEffect(() => {
    if (!currentUser) {
      return undefined;
    }

    initializedRef.current = false;
    loadNotifications();

    const intervalId = window.setInterval(loadNotifications, 15000);
    return () => window.clearInterval(intervalId);
  }, [currentUser?.id]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!bellRef.current?.contains(event.target)) {
        setState((current) => ({ ...current, open: false }));
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadLabel = useMemo(() => {
    if (state.unreadCount > 99) return "99+";
    return `${state.unreadCount}`;
  }, [state.unreadCount]);

  if (!currentUser) {
    return null;
  }

  return (
    <div ref={bellRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setState((current) => ({ ...current, open: !current.open }));
          if (!state.open) {
            loadNotifications();
          }
        }}
        className="relative rounded-full border border-[#e2e7d8] bg-white/85 px-4 py-2 text-[#415041] shadow-[0_8px_20px_rgba(104,97,59,0.05)] transition-all hover:border-[#b9d48f] hover:bg-[#f7fbf1]"
        aria-label="Notifications"
      >
        <span className="material-symbols-outlined text-[20px]">notifications</span>
        {state.unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex min-h-[20px] min-w-[20px] items-center justify-center rounded-full bg-[#f2994a] px-1 text-[11px] font-bold text-white">
            {unreadLabel}
          </span>
        )}
      </button>

      {state.open && (
        <div className="absolute right-0 z-50 mt-3 w-[360px] overflow-hidden rounded-[1.6rem] border border-[#e7eddc] bg-white shadow-[0_24px_48px_rgba(92,103,70,0.18)]">
          <div className="flex items-center justify-between border-b border-[#edf3e4] px-5 py-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#71806c]">Notifications</p>
              <p className="mt-1 text-sm text-[#5f6d5b]">{state.unreadCount} unread</p>
            </div>
            <button
              type="button"
              onClick={async () => {
                await markAllNotificationsRead().catch(() => null);
                loadNotifications();
              }}
              className="text-xs font-bold uppercase tracking-[0.12em] text-primary"
            >
              Mark all read
            </button>
          </div>

          {canUseBrowserNotifications && Notification.permission === "default" && (
            <div className="border-b border-[#edf3e4] bg-[#f7fbf1] px-5 py-3">
              <button
                type="button"
                onClick={async () => {
                  await Notification.requestPermission();
                }}
                className="text-sm font-semibold text-[#476846]"
              >
                Enable browser alerts
              </button>
            </div>
          )}

          {state.error && (
            <div className="px-5 py-4 text-sm text-red-700">{state.error}</div>
          )}

          {state.loading ? (
            <div className="px-5 py-8 text-sm text-[#5f6d5b]">Loading notifications...</div>
          ) : state.notifications.length === 0 ? (
            <div className="px-5 py-8 text-sm text-[#5f6d5b]">No notifications yet.</div>
          ) : (
            <div className="max-h-[420px] overflow-y-auto">
              {state.notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={async () => {
                    if (!notification.isRead) {
                      await markNotificationRead(notification.id).catch(() => null);
                    }
                    setState((current) => ({ ...current, open: false }));
                    if (notification.link) {
                      navigateTo(notification.link);
                    }
                    loadNotifications();
                  }}
                  className={`block w-full border-b border-[#edf3e4] px-5 py-4 text-left transition hover:bg-[#fbfdf8] ${
                    notification.isRead ? "bg-white" : "bg-[#f7fbf1]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#1d3720]">{notification.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-[#5f6d5b]">{notification.message}</p>
                    </div>
                    {!notification.isRead && (
                      <span className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-[#f2994a]" />
                    )}
                  </div>
                  <p className="mt-2 text-xs text-[#71806c]">{timeAgo(notification.createdAt)}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
