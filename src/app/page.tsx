import { EventForm } from "@/components/event-form";

export default function Home() {
  return (
    <div>
      <div className="relative mb-2">
        <div className="flex flex-col items-center sm:flex-row sm:items-center">
          <div className="w-28 h-28 sm:w-40 sm:h-40 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/sauna-bu-logo.png"
              alt="たくやんサウナ部"
              className="w-full h-full object-contain mix-blend-multiply"
            />
          </div>
          <div className="mt-2 sm:mt-0 sm:ml-5 text-center sm:text-left">
            <p className="text-sm sm:text-base font-medium text-sky-800 leading-relaxed tracking-wide">
              候補日とサウナ施設を入力して、
              <br />
              <span className="text-sky-600">URLをメンバーに共有するだけ</span>
            </p>
          </div>
        </div>
      </div>
      <EventForm />
    </div>
  );
}
