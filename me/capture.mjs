export async function captureResource(config,email,source,website='',fetcher=fetch,updatesRequested=false){
 if(config.mode!=='live'||!config.endpoint||!config.publicKey)throw Error('This signup is in review. Email collection will open when the hub launches.');
 const response=await fetcher(config.endpoint,{method:'POST',headers:{'Content-Type':'application/json',apikey:config.publicKey},body:JSON.stringify({email,source,website,resource:'build-with-enrique',noticeVersion:'resources-v2',updatesRequested}),signal:AbortSignal.timeout(15000)});
 const result=await response.json();
 if(!response.ok||result.saved!==true||result.resourceUrl!==config.links.repository)throw Error(result.error||'We could not confirm your signup. Please try again.');
 return result.resourceUrl;
}
