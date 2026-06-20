import { apiRequest, jsonRequest } from "./api";
import { getToken } from "./auth";

const withToken = (options = {}) => ({
  token: getToken(),
  ...options,
});

export const fetchAvailableRiderJobs = () =>
  apiRequest("/rider/jobs/available", {
    method: "GET",
    ...withToken(),
  });

export const fetchActiveRiderJob = () =>
  apiRequest("/rider/jobs/active", {
    method: "GET",
    ...withToken(),
  });

export const fetchRiderJobHistory = () =>
  apiRequest("/rider/jobs/history", {
    method: "GET",
    ...withToken(),
  });

export const acceptRiderJob = (orderId, location) =>
  jsonRequest(`/rider/jobs/${orderId}/accept`, {
    method: "POST",
    body: location || {},
    ...withToken(),
  });

export const updateRiderJobStatus = (orderId, status, location) =>
  jsonRequest(`/rider/jobs/${orderId}/status`, {
    method: "PATCH",
    body: {
      status,
      ...(location || {}),
    },
    ...withToken(),
  });

export const updateRiderJobLocation = (orderId, location) =>
  jsonRequest(`/rider/jobs/${orderId}/location`, {
    method: "PATCH",
    body: location,
    ...withToken(),
  });
