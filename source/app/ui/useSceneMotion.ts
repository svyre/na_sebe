import { useEffect, useState } from 'react';
const STORAGE='na-sebe-scene-motion';
export function useSceneMotion(){
 const [wanted,setWanted]=useState(()=>{try{return localStorage.getItem(STORAGE)!=='off';}catch{return true;}});
 const [reduced,setReduced]=useState(()=>typeof window!=='undefined'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
 useEffect(()=>{
  const query=window.matchMedia('(prefers-reduced-motion: reduce)'),update=()=>setReduced(query.matches);
  update();query.addEventListener('change',update);return()=>query.removeEventListener('change',update);
 },[]);
 const toggle=()=>setWanted(value=>{const next=!value;try{localStorage.setItem(STORAGE,next?'on':'off');}catch{}return next;});
 return {enabled:wanted&&!reduced,reduced,toggle};
}
