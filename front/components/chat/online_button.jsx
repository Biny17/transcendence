import { Badge, IconButton } from "@material-tailwind/react";
import { Bell } from "iconoir-react";

export default function BadgeDot() {
  return (
    <Badge color="green" withBorder overlap="circular" placement="bottom-end">
      <IconButton color="secondary">
        <Bell className="h-4 w-4 stroke-2" />
      </IconButton>
    </Badge>
  );
}
