'use client'

import { useSession } from "next-auth/react";
import { logout } from "@/actions/auth";
import Link from "next/link";

export default function Dashboard() {
    const { data: session, status } = useSession()

    return (
        <div className="flex flex-col">
            <div className="mb-4">
                <p>Member Area</p>
                <p>Signed in as&nbsp;
                    {status === 'authenticated'
                        ? session?.user?.email
                        : '...'
                    }
                </p>
                <Link className="underline" href='/member/settings'>Settings</Link>
            </div>
            <form action={logout}>
                <button disabled={status === 'loading' ? true : false} className="flex h-[48px] grow items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 md:flex-none md:justify-start md:p-2 md:px-3 disabled:bg-slate-50 disabled:text-slate-500">
                    Sign Out {status === 'loading' ? '...' : ''}
                </button>
            </form>
        </div>
    );
}
