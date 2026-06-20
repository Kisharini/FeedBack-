import { apiRequest, jsonRequest } from "./api";
import { getToken } from "./auth";

const withToken = (options = {}) => ({
  token: getToken(),
  ...options,
});

export const fetchNotifications = () =>
  apiRequest("/notifications", {
    method: "GET",
    ...withToken(),
  });

export const markNotificationRead = (notificationId) =>
  jsonRequest(`/notifications/${notificationId}/read`, {
    method: "POST",
    body: {},
    ...withToken(),
  });

export const markAllNotificationsRead = () =>
  jsonRequest("/notifications/read-all", {
    method: "POST",
    body: {},
    ...withToken(),
  });
