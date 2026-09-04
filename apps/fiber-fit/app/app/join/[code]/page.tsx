"use client";

import JoinScreen from "@/screens/JoinScreen";

export default function JoinPage({ params }: { params: { code: string } }) {
  return <JoinScreen code={params.code} />;
}
