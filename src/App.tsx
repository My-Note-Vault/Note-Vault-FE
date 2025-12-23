import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Editor from "./pages/Editor";
import Marketplace from "./pages/Marketplace";
import NotFound from "./pages/NotFound";
import SignUp from "./pages/SignUp";
import Callback from "./pages/Callback";
import LoginModal from "./pages/LoginModal";
import { AuthProvider } from "./context/AuthContext";
import Likes from "./pages/Likes";
import { MyPage } from "./pages/MyPage";
import { ReviewList } from "./pages/ReviewList";
import { ReviewDetail } from "./pages/ReviewDetail";
import { PurchaseList } from "./pages/PurchaseList";
import { PurchaseDetail } from "./pages/PurchaseDetail";
import TemplateDetail from "@/pages/TemplateDetail";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/editor" element={<Editor />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/sign-up" element={<SignUp />} />
          <Route path="/oauth/callback" element={<Callback />} />
          <Route path="/likes" element={<Likes />} />
          <Route path="profile" element={<MyPage />} />
          <Route path="/template/:id" element={<TemplateDetail />} />


          {/* 리뷰 전체 목록 */}
          <Route path="/reviews" element={<ReviewList />} />
          {/* 리뷰 상세 */}
          <Route path="/reviews/:id" element={<ReviewDetail />} />
          {/* 구매 내역 전체 */}
          <Route path="/purchases" element={<PurchaseList />} />
          {/* 구매 상세 */}
          <Route path="/purchase/:id" element={<PurchaseDetail />} />


          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
