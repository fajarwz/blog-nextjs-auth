import VerifyEmail from "@/components/email/verify/verify-email";
import { Suspense } from "react";

export default function Verify() {
  return (
    <Suspense>
      <div className='flex flex-col'>
        <VerifyEmail />
      </div>
    </Suspense>
  )
}
