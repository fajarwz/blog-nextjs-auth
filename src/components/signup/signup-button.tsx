'use client'

import { useFormStatus } from "react-dom"

export default function SignupButton() {
    const { pending } = useFormStatus()

    return <button className="bg-gray-200 py-2 rounded w-full disabled:bg-slate-50 disabled:text-slate-500" disabled={pending ? true : false}>
        Sign Up {pending ? '...' : ''}
    </button>
}