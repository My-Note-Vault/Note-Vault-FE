import api from "./axiosInstance";

// 템플릿 목록
export async function getTemplates() {
  const res = await api.get("/templates");
  return res.data;
}

// 템플릿 상세
export async function getTemplateDetail(id) {
  const res = await api.get(`/templates/${id}`);
  return res.data;
}

// 템플릿 생성
export async function createTemplate(data) {
  const res = await api.post("/templates", data);
  return res.data; // { templateId }
}

// 템플릿 좋아요 토글
export async function toggleLike(id) {
  const res = await api.post(`/templates/${id}/like`);
  return res.data;
}

// 내가 좋아요한 템플릿 목록
export async function getLikedTemplates() {
  const res = await api.get("/templates/likes");
  return res.data;
}

// 자동 저장
export async function saveMarkdown(templateId, markdown) {
  await api.put(`/templates/${templateId}/markdown`, { markdown });
}

// 전체 템플릿 업데이트
export async function updateTemplate(templateId, data) {
  await api.put(`/templates/${templateId}`, data);
}


export function getRecentTemplates() {
  return api.get("/templates/recent").then(res => res.data);
}


export function getMyTemplates() {
  return api.get("/templates/my").then(res => res.data);
}
