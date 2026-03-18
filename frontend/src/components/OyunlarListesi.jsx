import { useEffect, useState } from "react";
import axios from "axios";

export default function OyunlarListesi() {
  const [oyunlar, setOyunlar] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("http://localhost:4000/api/suggestions?accepted=true&limit=50").then((res) => {
      setOyunlar(res.data.rows);
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Yükleniyor...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {oyunlar.map((oyun) => (
        <div key={oyun.id} className="bg-white rounded shadow p-4">
          <img src={oyun.image_url} alt={oyun.title} className="w-full h-48 object-cover mb-2 rounded" />
          <div className="font-bold text-lg mb-1">{oyun.title}</div>
          <div className="text-sm text-gray-500">{oyun.slug}</div>
          <div className="text-xs text-gray-400 mt-2">{oyun.biletinial_url}</div>
        </div>
      ))}
    </div>
  );
}
