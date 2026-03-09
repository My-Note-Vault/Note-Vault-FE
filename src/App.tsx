import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./old/context/AuthContext";
import Editor from "./page/Editor";
import Sidebar from "./components/Sidebar";

const queryClient = new QueryClient();

const App = () => (
    <QueryClientProvider client={queryClient}>
        <BrowserRouter>
            <AuthProvider>
                <div className="flex h-screen">
                    <Sidebar onSelectDocument={(id) => console.log("문서 선택:", id)} />
                    <main className="flex-1 overflow-auto">
                        <Routes>
                            <Route path="/" element={<div>Home</div>} />
                            <Route path="/editor" element={<Editor />} />
                        </Routes>
                    </main>
                </div>
            </AuthProvider>
        </BrowserRouter>
    </QueryClientProvider>
);

export default App;
