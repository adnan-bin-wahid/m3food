'use client';
import { useEffect, useState } from 'react';
import { Heart, ShoppingCart } from 'lucide-react';
import { cn } from './utils';
export function AddToCartButton({name, className}: {name:string; className?:string; [key:string]:unknown}) {
 const [message, setMessage] = useState(false);
 useEffect(() => { if (!message) return; const id = setTimeout(() => setMessage(false), 3500); return () => clearTimeout(id); }, [message]);
 return <><button type="button" onClick={() => setMessage(true)} className={cn('inline-flex items-center justify-center', className)} aria-label={`Add ${name} to cart`}><ShoppingCart className="h-4 w-4" /></button>{message && <span role="status" className="absolute bottom-12 left-0 w-56 rounded bg-white p-3 text-xs text-black shadow-lg">This product is not available for cart yet.</span>}</>;
}
export function WishlistButton({product}: {product: {id:string; productId:string; [key:string]:unknown}}) {
 const key = `niyamah-wishlist-${product.productId}`;
 const [saved, setSaved] = useState(false);
 useEffect(() => {try {setSaved(localStorage.getItem(key) === '1');} catch {}}, [key]);
 return <button type="button" aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'} aria-pressed={saved} className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/80 shadow-sm hover:bg-white" onClick={() => { const next = !saved; setSaved(next); try {localStorage.setItem(key, next ? '1' : '0');} catch {} }}><Heart className={cn('h-4 w-4',saved ? 'fill-red-600 text-red-600' : 'text-[#3d4a3d]')} /></button>;
}
