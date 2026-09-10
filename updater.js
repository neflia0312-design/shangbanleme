if('serviceWorker' in navigator){
  window.addEventListener('load',async()=>{
    let refreshing=false;
    navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!refreshing){refreshing=true;location.reload()}});
    try{
      const registration=await navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'});
      await registration.update();
      if(registration.waiting)registration.waiting.postMessage('SKIP_WAITING');
    }catch(error){console.info('Update check will retry next time the app opens.');}
  });
}
