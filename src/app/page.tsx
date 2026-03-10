import { EventForm } from "@/components/event-form";

export default function Home() {
  return (
    <div>
      <div className="flex items-center gap-6 mb-8">
        <p className="flex-1 text-lg text-sky-700 leading-relaxed">
          候補日とサウナ施設を入力して、
          <br />
          URLをメンバーに共有するだけ
        </p>
        <div className="flex-1 h-48 rounded-2xl overflow-hidden shadow-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/sauna-bu-logo.png"
            alt="たくやんサウナ部"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
      <EventForm />
    </div>
  );
}
