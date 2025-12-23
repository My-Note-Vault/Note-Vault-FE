// src/pages/Home.tsx
import React from "react";
import { useAuth } from "../context/AuthContext";
import { HeroSection } from "@/components/hero-section";
import UserHome from "../components/UserHome";

const Home = () => {
  const { isLoggedIn } = useAuth();

  return (
    <div>
      {isLoggedIn ? <UserHome /> : <HeroSection />}
    </div>
  );
};

export default Home;
