import { Suspense } from "react";
import ChatInputBox from "./_components/ChatInputBox";


export default function HomePage() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <ChatInputBox />
    </Suspense>
  );
}
