'use client';
import {useRef,useState} from 'react';
import {DEMO_VIDEO_REVIEWS,type VideoReview} from './video-reviews/video-review-data';
import './video-reviews/video-reviews.css';
const Play=()=> <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 3.8c0-.8.9-1.3 1.6-.8l13 8.2a1 1 0 0 1 0 1.6l-13 8.2c-.7.5-1.6 0-1.6-.8z"/></svg>;
export function VideoReviewPlayer({review,index,total}:{review:VideoReview;index:number;total:number}){
 const [message,setMessage]=useState(''),[started,setStarted]=useState(false);const video=useRef<HTMLVideoElement>(null);
 async function play(){if(!review.src){setMessage('ভিডিও শীঘ্রই আসছে');return;}try{await video.current?.play();setStarted(true);setMessage('');}catch{setMessage('ভিডিও চালু করা যাচ্ছে না। ভিডিওর path পরীক্ষা করুন।');}}
 return <div className="nvr-player">
 {review.src?<video ref={video} src={review.src} poster={review.poster} controls={started} playsInline preload="metadata" onEnded={()=>setStarted(false)} onError={()=>setMessage('ভিডিও পাওয়া যায়নি। ভিডিওর path পরীক্ষা করুন।')} style={{objectFit:review.contain?'contain':'cover'}}/>:<img className="nvr-poster" src={review.poster} alt={`${review.product} placeholder`} style={{objectFit:review.contain?'contain':'cover'}}/>}
 {!started&&<><div className="nvr-shade"/><div className="nvr-brand">NIYAMAH<small>REAL STORIES</small></div><span className="nvr-count">{String(index+1).padStart(2,'0')} / {String(total).padStart(2,'0')}</span><div className="nvr-handwriting">More than<br/>a product<br/>A feeling ♡</div><button className="nvr-main-play" onClick={play} aria-label="Play selected video"><Play/></button><blockquote className="nvr-customer-quote"><span>“</span><p>{review.quote}</p><footer>— &nbsp; {review.name}</footer></blockquote><div className="nvr-placeholder-controls" aria-hidden="true">0:00 / —:—<span>♫ &nbsp; ⛶</span><i/></div></>}
 <p className="nvr-message" role="status">{message}</p></div>;
}
export type VideoReviewSectionProps={reviews?:VideoReview[];id?:string;title?:string;description?:string};
export function VideoReviewSection({reviews=DEMO_VIDEO_REVIEWS,id='video-reviews',title='তাদের চোখে',description='যারা আমাদের পণ্য ব্যবহার করেছেন, তাদের বাস্তব অভিজ্ঞতা থেকে শুনুন নিয়ামাহ্’র গল্প।'}:VideoReviewSectionProps={}){
 const [selected,setSelected]=useState(0);const rail=useRef<HTMLDivElement>(null);
 if(!reviews.length)return null;const active=Math.min(selected,reviews.length-1),review=reviews[active];
 function select(n:number){const next=(n+reviews.length)%reviews.length;setSelected(next);const node=rail.current?.children[next] as HTMLElement|undefined;if(node&&rail.current)rail.current.scrollTo({left:node.offsetLeft-rail.current.offsetLeft-8,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}
 return <section id={id} className="nvr-section" lang="bn" aria-labelledby={`${id}-title`}><div className="nvr-layout">
 <header className="nvr-heading"><p className="nvr-eyebrow">REAL PEOPLE, REAL STORIES</p><h2 id={`${id}-title`}>নিয়ামাহ্<span>{title}</span></h2><p className="nvr-description">{description}</p><div className="nvr-values" aria-hidden="true"><b>❀</b>FAITH<br/>MODESTY<br/>BEAUTY<br/>YOU</div></header>
 <div className="nvr-feature"><VideoReviewPlayer key={review.id} review={review} index={active} total={reviews.length}/></div>
 <div className="nvr-selection"><div className="nvr-rail" ref={rail} aria-label="Customer video stories">{reviews.map((item,i)=><button key={item.id} className={`nvr-thumb ${i===active?'is-active':''}`} onClick={()=>select(i)} aria-pressed={i===active} aria-label={`Select ${item.name}, ${item.product}`}><img src={item.poster} alt="" style={{objectFit:item.contain?'contain':'cover'}}/><span className="nvr-thumb-shade"/><span className="nvr-thumb-play"><Play/></span><span className="nvr-thumb-label"><strong>{item.name}</strong><small>{item.product}</small><i/></span></button>)}</div><div className="nvr-arrows"><button onClick={()=>select(active-1)} aria-label="Previous video story" disabled={reviews.length<2}>←</button><button onClick={()=>select(active+1)} aria-label="Next video story" disabled={reviews.length<2}>→</button></div></div>
 <footer className="nvr-editorial"><span>“</span><blockquote>Their stories inspire us<br/>to do better, every day.</blockquote><p>NIYAMAH ATTIRES</p><small>A MORE<br/>MEANINGFUL<br/>YOU</small></footer></div></section>;
}
export type {VideoReview} from './video-reviews/video-review-data';
