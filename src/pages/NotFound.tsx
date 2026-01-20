import { useNavigate } from "react-router-dom";
import { Button } from "../components/common/Button";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <span className="text-6xl mb-4 block">🔍</span>
        <h1 className="text-4xl font-bold text-gray-800 mb-2">404</h1>
        <p className="text-xl text-gray-600 mb-6">Sayfa bulunamadı</p>
        <Button onClick={() => navigate("/")}>Ana Sayfaya Dön</Button>
      </div>
    </div>
  );
}
