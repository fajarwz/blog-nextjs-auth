import Form from "@/components/email/verify/send/form";
import { Suspense } from "react";

export default function Send() {
  return (
    <div className="flex flex-col">
      <div className="mb-4">Please verify your email first.</div>
      <Suspense>
        <Form />
      </Suspense>
    </div>
  )
}
