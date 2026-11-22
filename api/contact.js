export default async function handler(req,res){
  if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'Method not allowed'});}
  const {name,email,message,website}=req.body||{};
  if(website)return res.status(200).json({ok:true});
  if(typeof name!=='string'||name.trim().length<2||name.length>120||typeof email!=='string'||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254||typeof message!=='string'||message.trim().length<10||message.length>4000)return res.status(400).json({error:'Invalid form data'});
  const key=process.env.RESEND_API_KEY,to=process.env.CONTACT_TO_EMAIL,from=process.env.CONTACT_FROM_EMAIL;
  if(!key||!to||!from)return res.status(503).json({error:'Email delivery not configured'});
  const clean=v=>v.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  try{
    const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({from,to:[to],reply_to:email,subject:'FAVR Europe contact: '+name.trim().slice(0,90),html:'<p><b>Name:</b> '+clean(name.trim())+'</p><p><b>Email:</b> '+clean(email)+'</p><p><b>Message:</b></p><p>'+clean(message.trim()).replace(/\n/g,'<br>')+'</p>'})});
    if(!response.ok)return res.status(502).json({error:'Email delivery failed'});
    return res.status(200).json({ok:true});
  }catch{return res.status(502).json({error:'Email delivery failed'});}
}