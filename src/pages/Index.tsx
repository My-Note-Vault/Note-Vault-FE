import React, { useEffect, useState } from "react";
import { Navigation } from "@/components/ui/navigation";
import { FeaturesSection } from "@/components/features-section";
import { TemplateShowcase } from "@/components/template-showcase";
import { CTASection } from "@/components/cta-section";
import { Footer } from "@/components/footer";
import { useAuth } from "@/context/AuthContext";
import { HeroSection } from "@/components/hero-section";
import TemplateList from "@/components/template-list";
import SectionHeader from "@/components/section-header";

import {
  getRecentTemplates,
  getLikedTemplates,
  getMyTemplates,
} from "@/api/template";

const Index = () => {
  const { isLoggedIn } = useAuth();

  const [recent, setRecent] = useState([]);
  const [likes, setLikes] = useState([]);
  const [myTemplates, setMyTemplates] = useState([]);

  // ⭐ login时 API 호출
  useEffect(() => {
    if (!isLoggedIn) return;

    (async () => {
      try {
        const recentList = await getRecentTemplates();
        setRecent(recentList);

        const likedList = await getLikedTemplates();
        setLikes(likedList);

        const myList = await getMyTemplates();
        setMyTemplates(myList);
      } catch (e) {
        console.error("메인 데이터 로딩 실패:", e);
      }
    })();
  }, [isLoggedIn]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* 로그인 여부에 따라 화면 전환 */}
      {!isLoggedIn ? (
        <>
          <HeroSection />
          <FeaturesSection />
          <TemplateShowcase />
          <CTASection />
        </>
      ) : (
        <>
          {/*  최근 본 템플릿 */}
          <div className="container mx-auto px-4 py-12">
            <SectionHeader
              title="최근에 본 템플릿"
              subtitle="최근에 사용한 템플릿을 다시 확인하세요."
            />
            <TemplateList templates={recent} />
          </div>

          {/* 찜한 템플릿 */}
          <div className="container mx-auto px-4 py-12">
            <SectionHeader
              title="찜한 템플릿"
              subtitle="내가 관심있어하는 템플릿입니다."
            />
            <TemplateList templates={likes} />
          </div>

          {/*  내가 작성한 템플릿 */}
          <div className="container mx-auto px-4 py-12">
            <SectionHeader
              title="내가 작성한 템플릿"
              subtitle="내가 작성한 템플릿 목록입니다."
            />
            <TemplateList templates={myTemplates} />
          </div>
        </>
      )}

      <Footer />
    </div>
  );
};

export default Index;
