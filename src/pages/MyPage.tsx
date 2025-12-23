import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/ui/navigation";

import { getMyInfo, updateMyInfo, getMyReviews, getMyPurchases } from "@/api/user";

export const MyPage = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState({ nickname: "", email: "" });

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editNickname, setEditNickname] = useState("");
  const [editEmail, setEditEmail] = useState("");

  const [reviews, setReviews] = useState([]);
  const [purchases, setPurchases] = useState([]);

  // ⭐ 실제 서버와 연동
  useEffect(() => {
    (async () => {
      const userInfo = await getMyInfo();
      setUser(userInfo);
      setEditNickname(userInfo.nickname);
      setEditEmail(userInfo.email);

      const reviewList = await getMyReviews();
      setReviews(reviewList);

      const purchaseList = await getMyPurchases();
      setPurchases(purchaseList);
    })();
  }, []);

  // ⭐ 닉네임 / 이메일 저장 API
  const handleSave = async () => {
    const updated = await updateMyInfo({
      nickname: editNickname,
      email: editEmail,
    });

    setUser(updated);
    setIsEditOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    navigate("/login");
  };

  return (
    <>
      <Navigation />

      <main className="container mx-auto max-w-3xl py-10">
        <h1 className="text-3xl font-bold mb-8 text-center">내 정보</h1>

        {/* 계정 정보 */}
        <Card className="mb-8">
          <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle>계정 정보</CardTitle>

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">수정</Button>
              </DialogTrigger>

              <DialogContent>
                <DialogHeader>
                  <DialogTitle>계정 정보 수정</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">닉네임</p>
                    <Input
                      value={editNickname}
                      onChange={(e) => setEditNickname(e.target.value)}
                    />
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-1">이메일</p>
                    <Input
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                    취소
                  </Button>
                  <Button onClick={handleSave}>저장</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>

          <CardContent className="space-y-4">
            <div>
              <p className="text-gray-500">닉네임</p>
              <p className="text-lg font-semibold">{user.nickname}</p>
            </div>

            <div>
              <p className="text-gray-500">이메일</p>
              <p className="text-lg font-semibold">{user.email}</p>
            </div>
          </CardContent>
        </Card>

        {/* 리뷰 */}
        <Card className="mb-8">
          <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle>내가 작성한 리뷰</CardTitle>
            <Button size="sm" variant="outline" onClick={() => navigate("/reviews")}>
              전체 보기
            </Button>
          </CardHeader>

          <CardContent className="space-y-4">
            {reviews.length === 0 ? (
              <p className="text-gray-500">아직 작성한 리뷰가 없습니다.</p>
            ) : (
              reviews.map((r) => (
                <div
                  key={r.id}
                  className="border-b pb-3 cursor-pointer hover:bg-gray-50 p-1 rounded transition"
                  onClick={() => navigate(`/reviews/${r.id}`)}
                >
                  <p className="text-gray-900 font-medium">{r.content}</p>
                  <p className="text-sm text-gray-500 mt-1">{r.createdAt}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* 구매 내역 */}
        <Card className="mb-8">
          <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle>구매 내역</CardTitle>
            <Button size="sm" variant="outline" onClick={() => navigate("/purchases")}>
              전체 보기
            </Button>
          </CardHeader>

          <CardContent className="space-y-4">
            {purchases.length === 0 ? (
              <p className="text-gray-500">구매 내역이 없습니다.</p>
            ) : (
              purchases.map((p) => (
                <div
                  key={p.id}
                  className="border-b pb-3 cursor-pointer hover:bg-gray-50 p-1 rounded transition"
                  onClick={() => navigate(`/purchase/${p.id}`)}
                >
                  <p className="font-semibold">{p.itemName}</p>
                  <p className="text-sm text-gray-500">
                    {p.price.toLocaleString()}원 · {p.purchasedAt}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Button variant="destructive" className="w-full" onClick={handleLogout}>
          로그아웃
        </Button>
      </main>
    </>
  );
};
