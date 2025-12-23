import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn } = useAuth();

  const [activeTab, setActiveTab] = useState("");
  const [openModal, setOpenModal] = useState(false);

  /** 모달 입력 데이터 */
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // 비로그인 + "/"이면 네비게이션 숨김
  if (location.pathname === "/" && !isLoggedIn) return null;

  const navTabs = isLoggedIn
    ? [
        { label: "생성", path: "/create-modal" }, 
        { label: "홈", path: "/" },
        { label: "마켓 플레이스", path: "/marketplace" },
        { label: "좋아요한 템플릿", path: "/likes" },
        { label: "내 정보", path: "/profile" },
      ]
    : [
        { label: "회원가입", path: "/sign-up" },
        { label: "마켓 플레이스", path: "/marketplace" },
      ];

  useEffect(() => {
    const currentTab = navTabs.find((tab) => {
      if (tab.path === "/") return location.pathname === "/";
      return location.pathname.startsWith(tab.path);
    });
    setActiveTab(currentTab ? currentTab.label : "");
  }, [location.pathname, isLoggedIn]);

  /** ★ Presigned URL 업로드 */
  const uploadImagesToS3 = async () => {
    const uploadedUrls: string[] = [];

    for (const file of images) {
      const res = await fetch(`/api/s3/presigned?filename=${file.name}`);
      const { presignedUrl, fileUrl } = await res.json();

      await fetch(presignedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      uploadedUrls.push(fileUrl);
    }

    return uploadedUrls;
  };

  /** ★ 최종 생성 API 호출 */
  const handleCreate = async () => {
    if (!title.trim()) {
      alert("제목은 필수입니다.");
      return;
    }

    setIsSaving(true);

    let uploadedImageUrls: string[] = [];
    if (images.length > 0) {
      uploadedImageUrls = await uploadImagesToS3();
    }

    const payload = {
      title,
      description,
      images: uploadedImageUrls,
    };

    // ★ 서버로 Note 생성 요청
    const createRes = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!createRes.ok) {
      alert("문서 생성에 실패했습니다.");
      setIsSaving(false);
      return;
    }

    const createdNote = await createRes.json();

    // createdNote.id 를 사용해 /editor/:id 로 이동
    navigate(`/editor/${createdNote.id}`, {
      state: {
        title,
        description,
        images: uploadedImageUrls,   // presigned 업로드 완료된 이미지 URL
      },
    });


    setIsSaving(false);
    setOpenModal(false);

    setTitle("");
    setDescription("");
    setImages([]);
  };

  const handleTabClick = (tabLabel: string, path: string) => {
    if (tabLabel === "생성") {
      setOpenModal(true);
      return;
    }
    navigate(path);
  };

  return (
    <>
      <nav className="bg-background border-b border-border sticky top-0 z-50 backdrop-blur-sm bg-background">
        <div className="container mx-auto px-4 py-3 flex flex-col lg:flex-row items-center justify-between gap-3">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl font-extrabold bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent tracking-tight">
              Note Vault
            </span>
          </Link>

          <div className="w-full flex flex-wrap justify-center gap-32 mt-2">
            {navTabs.map((tab) => (
              <Button
                key={tab.label}
                variant="ghost"
                onClick={() => handleTabClick(tab.label, tab.path)}
                className={`
                  text-lg font-bold px-6 py-3 transition-all hover:bg-transparent
                  ${
                    activeTab === tab.label
                      ? "text-primary border-b-2 border-primary pb-1"
                      : "text-muted-foreground hover:text-foreground"
                  }
                `}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </div>
      </nav>

      {/* 생성 모달 */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>새 문서 생성</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Title */}
            <div>
              <label className="text-sm text-gray-600">Title *</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="제목을 입력하세요"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-sm text-gray-600">Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="설명을 입력하세요"
                className="h-32"
              />
            </div>

            {/* Images */}
            <div>
              <label className="text-sm text-gray-600">Images (선택)</label>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setImages(Array.from(e.target.files || []))}
              />
              {images.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {images.length}개 이미지 선택됨
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenModal(false)}>
              취소
            </Button>
            <Button onClick={handleCreate} disabled={isSaving}>
              {isSaving ? "저장 중..." : "생성하기"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
