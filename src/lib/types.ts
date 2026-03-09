export interface Event {
  id: string;
  slug: string;
  title: string;
  description: string;
  dates: EventDate[];
  facilities: EventFacility[];
  participants: Participant[];
  createdAt: string;
}

export interface EventDate {
  id: string;
  eventId: string;
  date: string; // YYYY-MM-DD
  timeLabel: string; // "14:00〜" など
}

export interface EventFacility {
  id: string;
  eventId: string;
  name: string;
  address: string;
  url: string;
  votes: number;
}

export interface Participant {
  id: string;
  eventId: string;
  name: string;
  comment: string;
  dateResponses: DateResponse[];
  facilityVotes: string[]; // facility IDs
  createdAt: string;
}

export interface DateResponse {
  eventDateId: string;
  response: "○" | "△" | "×";
}

// フォーム用
export interface CreateEventInput {
  title: string;
  description: string;
  dates: { date: string; timeLabel: string }[];
  facilities: { name: string; address: string; url: string }[];
}

export interface CreateResponseInput {
  name: string;
  comment: string;
  dateResponses: DateResponse[];
  facilityVotes: string[];
}
