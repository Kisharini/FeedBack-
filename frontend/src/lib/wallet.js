import { apiRequest, jsonRequest } from "./api";
import { getToken } from "./auth";

const withToken = (options = {}) => ({
  token: getToken(),
  ...options,
});

export const fetchWalletSummary = () =>
  apiRequest("/wallet", {
    method: "GET",
    ...withToken(),
  });

export const withdrawWalletBalance = (payload) =>
  jsonRequest("/wallet/withdraw", {
    method: "POST",
    body: payload,
    ...withToken(),
  });
