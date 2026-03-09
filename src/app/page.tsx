import { EventForm } from "@/components/event-form";

export default function Home() {
  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-sky-900 mb-2">
          サウナオフ会をつくろう
        </h1>
        <p className="text-sky-700">
          候補日とサウナ施設を入力して、URLをメンバーに共有するだけ
        </p>
      </div>
      <EventForm />
    </div>
  );
}
