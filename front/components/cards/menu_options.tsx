import { Button } from "../../app/animations/Button.jsx";

export default function MenuOptions() {
  const options = [
    "View profile",
    "Keyboard settings",
    "About us",
  ];

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#0b1328]">
      <nav className="flex flex-col gap-4 w-full h-full overflow-y-auto scrollbar-hide p-2 box-border pb-12 max-h-[calc(100%-8px)]">
        {options.map((option, idx) => (
          <div key={idx} className="flex w-full items-center justify-center">
            <div className="w-full max-w-xs flex justify-center">
              <Button statement={option} className="w-full h-12" />
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}