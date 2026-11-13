import type { Metadata } from "next";
import { RoomView } from "@/components/study-room/room-view";

export const metadata: Metadata = {
  title: "Study room — Study Paws",
  description: "You've been invited to study together on Study Paws.",
};

export default async function RoomPage({ params }: PageProps<"/rooms/[code]">) {
  const { code } = await params;
  return <RoomView code={code.toUpperCase()} />;
}
