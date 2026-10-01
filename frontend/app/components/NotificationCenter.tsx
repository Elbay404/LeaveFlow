"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  CheckCheck,
  Clock3,
  X,
} from "lucide-react";
import {
  connectNotificationSocket,
  disconnectNotificationSocket,
} from "@/lib/notificationSocket";

type Notification = {
  id: number;
  type: string;
  title: string;
  message: string;
  entityType?: string;
  entityId?: number;
  read: boolean;
  createdAt: string;
  readAt?: string | null;
};

export default function NotificationCenter() {
  const router = useRouter();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);

  const loadNotifications = async () => {
    try {
      const response = await fetch(
        "http://localhost:8080/api/notifications",
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to load notifications");
      }

      const data: Notification[] = await response.json();

      setNotifications(data);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();

    connectNotificationSocket((notification: Notification) => {
      setNotifications((current) => {
        if (
          current.some(
            (item) => item.id === notification.id
          )
        ) {
          return current;
        }

        return [notification, ...current]; //show the newest on top
      });
    });

    return () => {
      disconnectNotificationSocket();
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          event.target as Node //bc the contains method expects a  dom Node 
        )
      ) {
        setOpen(false);
      }
    };

    document.addEventListener( //listens for clicks outside the notification center to close it
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  const markAsRead = async (id: number) => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/notifications/${id}/read`,
        {
          method: "PATCH",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to mark notification as read"
        );
      }

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === id
            ? {
                ...notification,
                read: true,
                readAt: new Date().toISOString(),
              }
            : notification
        )
      );
    } catch (error) {
      console.error(
        "Failed to mark notification as read:",
        error
      );
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch(
        "http://localhost:8080/api/notifications/read-all",
        {
          method: "PATCH",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to mark all notifications as read"
        );
      }

      const now = new Date().toISOString();

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          read: true,
          readAt: notification.readAt ?? now,
        }))
      );
    } catch (error) {
      console.error(
        "Failed to mark all notifications as read:",
        error
      );
    }
  };

  const handleNotificationClick = async (
    notification: Notification
  ) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    if (notification.entityType === "LEAVE") {
      router.push("/leaves");
      setOpen(false);
    }
  };

  const formatDate = (date: string) => {
    const value = new Date(date);
    const now = new Date();

    const difference =
      (now.getTime() - value.getTime()) / 1000;

    if (difference < 60) {
      return "Just now";
    }

    if (difference < 3600) {
      return `${Math.floor(difference / 60)} min ago`;
    }

    if (difference < 86400) {
      return `${Math.floor(difference / 3600)}h ago`;
    }

    if (difference < 604800) {
      return `${Math.floor(difference / 86400)}d ago`;
    }

    return value.toLocaleDateString();
  };

  const getNotificationStyle = (type: string) => {
    switch (type) {
      case "LEAVE_APPROVED":
        return {
          bg: "bg-emerald-50",
          icon: "text-emerald-600",
          dot: "bg-emerald-500",
        };

      case "LEAVE_REJECTED":
        return {
          bg: "bg-red-50",
          icon: "text-red-600",
          dot: "bg-red-500",
        };

      case "LEAVE_CANCELLED":
        return {
          bg: "bg-orange-50",
          icon: "text-orange-600",
          dot: "bg-orange-500",
        };

      case "LEAVE_EXPIRED":
        return {
          bg: "bg-slate-100",
          icon: "text-slate-600",
          dot: "bg-slate-500",
        };

      default:
        return {
          bg: "bg-blue-50",
          icon: "text-blue-600",
          dot: "bg-blue-500",
        };
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative"
    >
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => setOpen((value) => !value)}
        className={`group relative flex h-11 w-11 items-center justify-center rounded-full border shadow-sm transition-all ${
          open
            ? "border-blue-200 bg-blue-50 text-blue-600"
            : "border-slate-200 bg-white text-slate-500 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
        }`}
      >
        <Bell
          className={`h-[19px] w-[19px] transition-transform duration-200 ${
            open
              ? "rotate-[-8deg]"
              : "group-hover:rotate-[-8deg]"
          }`}
        />

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex min-h-[20px] min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-[58px] z-50 w-[380px] max-w-[calc(100vw-24px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Notifications
              </h3>

              <p className="mt-0.5 text-xs text-slate-400">
                {unreadCount === 0
                  ? "You're all caught up"
                  : `${unreadCount} unread notification${
                      unreadCount > 1 ? "s" : ""
                    }`}
              </p>
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  title="Mark all as read"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                >
                  <CheckCheck size={17} />
                </button>
              )}

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={17} />
              </button>
            </div>
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center px-6 py-12">
                <div className="flex items-center gap-3 text-sm text-slate-400">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
                  Loading notifications...
                </div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <Bell size={24} />
                </div>

                <h4 className="mt-4 text-sm font-semibold text-slate-700">
                  No notifications
                </h4>

                <p className="mt-1 max-w-[240px] text-xs leading-5 text-slate-400">
                  New leave requests and updates will appear
                  here.
                </p>
              </div>
            ) : (
              notifications.map((notification) => {
                const style = getNotificationStyle(
                  notification.type
                );

                return (
                  <div
                    key={notification.id}
                    className={`group border-b border-slate-100 px-4 py-4 transition ${
                      notification.read
                        ? "bg-white"
                        : "bg-blue-50/40"
                    } hover:bg-slate-50`}
                  >
                    <div
                      onClick={() =>
                        handleNotificationClick(
                          notification
                        )
                      }
                      className="flex cursor-pointer gap-3"
                    >
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${style.bg} ${style.icon}`}
                      >
                        <Bell size={17} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <h4
                              className={`text-sm ${
                                notification.read
                                  ? "font-semibold text-slate-700"
                                  : "font-bold text-slate-900"
                              }`}
                            >
                              {notification.title}
                            </h4>

                            {!notification.read && (
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${style.dot}`}
                              />
                            )}
                          </div>

                          <span className="shrink-0 text-[10px] font-medium text-slate-400">
                            {formatDate(
                              notification.createdAt
                            )}
                          </span>
                        </div>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {notification.message}
                        </p>
                      </div>
                    </div>

                    {!notification.read && (
                      <button
                        type="button"
                        onClick={() =>
                          markAsRead(notification.id)
                        }
                        className="ml-[52px] mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 transition hover:text-blue-700"
                      >
                        <Check size={13} />
                        Mark as read
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {notifications.length > 0 && (
            <div className="border-t border-slate-100 bg-slate-50 px-5 py-3">
              <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400">
                <Clock3 size={13} />
                Notifications are updated in real time
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}