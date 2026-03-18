import { useState } from "react";

export default function Tabs({ tabs }) {
  const [active, setActive] = useState(0);
  return (
    <div>
      <div className="flex border-b mb-4">
        {tabs.map((tab, i) => (
          <button key={i} className={`px-4 py-2 font-semibold ${active === i ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500"}`} onClick={() => setActive(i)}>
            {tab.label}
          </button>
        ))}
      </div>
      <div>{tabs[active].content}</div>
    </div>
  );
}
