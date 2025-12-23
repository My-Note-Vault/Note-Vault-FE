import api from "./axiosInstance";

export async function getPresignedUrl(filename: string) {
  const res = await api.get(`/files/presigned?filename=${filename}`);
  return res.data;  // { url, accessUrl }
}
