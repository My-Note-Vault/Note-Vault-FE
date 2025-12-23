import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

type Purchase = {
  id: number;
  itemName: string;
  price: number;
  purchasedAt: string;
};

export const PurchaseList = () => {
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState<Purchase[]>([]);

  useEffect(() => {
    // TODO: 실제 API
    setPurchases([
      { id: 1, itemName: "Study Template Pack", price: 4900, purchasedAt: "2025-02-10" },
      { id: 2, itemName: "Business Planner", price: 7900, purchasedAt: "2025-02-15" },
    ]);
  }, []);

  return (
    <div className="container mx-auto max-w-3xl py-10">
      <h1 className="text-3xl font-bold mb-8 text-center">구매 내역 전체</h1>

      <Card>
        <CardHeader>
          <CardTitle>구매한 템플릿 목록</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {purchases.map((p) => (
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
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
