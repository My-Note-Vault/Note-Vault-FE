import api from "./axiosInstance";

export function getMyInfo() {
  return api.get("/users/me").then(res => res.data);
}

export function updateMyInfo(data: { nickname: string; email: string }) {
  return api.put("/users/me", data).then(res => res.data);
}

export function getMyReviews() {
  return api.get("/reviews/me").then(res => res.data);
}

export function getMyPurchases() {
  return api.get("/purchases/me").then(res => res.data);
}
