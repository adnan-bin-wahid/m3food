'use client';
import type { AnchorHTMLAttributes } from 'react';
import Link from 'next/link';
// The destination is this landing page's collection, since it has no Niyamah product routes.
export default function ReferenceLink({href, ...props}: AnchorHTMLAttributes<HTMLAnchorElement>) {
 return <Link {...props} href={href?.startsWith('#') ? href : '#flash-sale'} />;
}
