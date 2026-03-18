import { useEffect, useState } from "react";
import axios from "axios";

export default function OnerilerListesi() {
  const [oneriler, setOneriler] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("http://localhost:4000/api/suggestions?accepted=false&limit=50").then((res) => {
      setOneriler(res.data.rows);
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Yükleniyor...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {oneriler.map((oner) => (
        <div key={oner.id} className="bg-yellow-50 rounded shadow p-4">
          <img src={oner.image_url} alt={oner.title} className="w-full h-48 object-cover mb-2 rounded" />
          <div className="font-bold text-lg mb-1">{oner.title}</div>
          <div className="text-sm text-gray-500">{oner.slug}</div>
          <div className="text-xs text-gray-400 mt-2">{oner.biletinial_url}</div>
        </div>
      ))}
    </div>
  );
}
