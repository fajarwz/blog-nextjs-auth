import { useFormStatus } from "react-dom"

export default function ResendButton() {
    const { pending } = useFormStatus()

    return <button type="submit" className="bg-white py-2 px-4 rounded disabled:bg-slate-50 disabled:text-slate-500" disabled={pending ? true : false}>Send verification link {pending ? '...' : ''}</button>
}