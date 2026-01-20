import { useParams, useNavigate } from "react-router-dom";

export default function EditPost() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
      >
        <span>←</span>
        <span>Geri</span>
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <span className="text-4xl mb-4 block">✏️</span>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Post Düzenleme
        </h1>
        <p className="text-gray-600">Post: {slug}</p>
        <p className="text-gray-500 mt-2">Bu sayfa yapım aşamasında...</p>
      </div>
    </div>
  );
}
