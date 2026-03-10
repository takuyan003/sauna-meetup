import { EventForm } from "@/components/event-form";

export default function Home() {
  return (
    <div>
      <div className="relative mb-4">
        <div className="flex items-center">
          <div className="w-40 h-40 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/sauna-bu-logo.png"
              alt="たくやんサウナ部"
              className="w-full h-full object-contain mix-blend-multiply"
            />
          </div>
          <div className="ml-5">
            <p className="text-base font-medium text-sky-800 leading-relaxed tracking-wide">
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
