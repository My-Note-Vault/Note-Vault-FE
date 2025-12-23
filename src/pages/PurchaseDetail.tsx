import { useParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

type Purchase = {
  id: number;
  itemName: string;
  price: number;
  purchasedAt: string;
};

export const PurchaseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [purchase, setPurchase] = useState<Purchase | null>(null);

  useEffect(() => {
    // TODO: 실제 API
    setPurchase({
      id: Number(id),
      itemName: "Study Template Pack",
      price: 4900,
      purchasedAt: "2025-02-10",
    });
  }, [id]);

  if (!purchase) return null;

  return (
    <div className="container mx-auto max-w-3xl py-10">
      <h1 className="text-3xl font-bold mb-8 text-center">구매 상세</h1>

      <Card>
        <CardHeader>
          <CardTitle>{purchase.itemName}</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div>
            <p className="text-gray-500 mb-1">구매일</p>
            <p className="font-medium">{purchase.purchasedAt}</p>
          </div>

          <div>
            <p className="text-gray-500 mb-1">가격</p>
            <p className="font-medium">{purchase.price.toLocaleString()}원</p>
          </div>

          <Button className="w-full mt-6" onClick={() => navigate(-1)}>
            뒤로가기
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
