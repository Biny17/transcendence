

export default function ListCard() {
  const players = [
    { name: "Tania Andrew", img: "https://docs.material-tailwind.com/img/face-1.jpg" },
    { name: "Alexander", img: "https://docs.material-tailwind.com/img/face-2.jpg" },
    { name: "Emma Willever", img: "https://docs.material-tailwind.com/img/face-3.jpg" },
    { name: "Candice", img: "https://docs.material-tailwind.com/img/face-1.jpg" },
    { name: "John Doe", img: "https://randomuser.me/api/portraits/men/1.jpg" },
    { name: "Jane Smith", img: "https://randomuser.me/api/portraits/women/2.jpg" },
    { name: "Lucas", img: "https://randomuser.me/api/portraits/men/3.jpg" },
    { name: "Sophie", img: "https://randomuser.me/api/portraits/women/4.jpg" },
  ];

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#0b1328]">
      <nav
        className="flex flex-col gap-4 w-full h-full overflow-y-auto scrollbar-hide p-2 box-border pb-12 max-h-[calc(100%-8px)]"
      >
        {players.map((player, idx) => (
          <div
            key={idx}
            className="flex w-full items-center rounded-lg p-4 bg-[#0b1328] text-white shadow-md border border-slate-700 transition-all hover:bg-[#162447] focus:bg-[#162447] active:bg-[#162447]"
          >
            <div className="mr-4 grid place-items-center">
              <img
                alt={player.name}
                src={player.img}
                className="relative inline-block h-12 w-12 rounded-full! object-cover object-center"
              />
            </div>
            <div>
              <h6 className="font-medium text-white">{player.name}</h6>
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}