import { useAuth }  from "@/context/AuthContext"
import { useEffect } from "react";

const Home = () => {
    const { isLoggedIn } = useAuth();

    useEffect(() => {
        (async () => {
            try {

            } catch (e) {
                console.error("홈 데이터 로딩 실패:", e);
                throw e;
            }
        })();

    }, [isLoggedIn]);

    return (
        <div>
            
        </div>
    );
}