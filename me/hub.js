import {captureResource} from './capture.mjs';
const form=document.querySelector('#resource-form');
const status=document.querySelector('#form-status');
const button=form.querySelector('button');
const link=document.querySelector('#resource-link');
let config;
try{const response=await fetch('config.json',{cache:'no-store'});if(!response.ok)throw Error();config=await response.json();}
catch{status.textContent='Signup is temporarily unavailable. Please try again later.';button.disabled=true;}
if(config?.mode==='review')status.textContent='Preview — email collection opens at launch.';
const sourceParam=new URL(location.href).searchParams.get('source');
const source=['instagram','youtube','linkedin','tiktok','threads'].includes(sourceParam)?sourceParam:'hub';
form.addEventListener('submit',async event=>{
 event.preventDefault();button.disabled=true;status.textContent='Saving your email…';link.hidden=true;
 try{
  const updatesRequested=form.updates.checked;
  const resource=await captureResource(config,form.email.value,source,form.website.value,fetch,updatesRequested);
  form.hidden=true;link.href=resource;link.hidden=false;status.textContent=updatesRequested?'Your resources are ready. Your request for future updates is saved too.':'Your resources are ready. Pick something that sparks your curiosity.';link.focus();
 }catch(error){status.textContent=error.message||'Signup did not finish. Please try again.';}
 finally{button.disabled=false;}
});
