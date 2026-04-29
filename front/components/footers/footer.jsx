import { Typography } from "@material-tailwind/react";

export default function SimpleFooter({ setPrivacyOpen }) {
  return (
    <footer className="flex w-full flex-row flex-wrap items-center justify-center gap-y-6 gap-x-12  py-6 text-center md:justify-between">
      <Typography color="white" className="font-normal text-xs">
        &copy; 2026 Fun Guys
      </Typography>
      <ul className="flex flex-wrap items-center gap-y-2 gap-x-8">
        <li>
          <Typography
            as="a"
            href="#"
            color="white"
            className="font-normal text-xs transition-colors hover:text-blue-500 focus:text-blue-500"
             onClick={()=>{setPrivacyOpen(true)}}
          >
          Privacy Policy and Terms of Service
          </Typography>
        </li>
      </ul>
    </footer>
  );
}