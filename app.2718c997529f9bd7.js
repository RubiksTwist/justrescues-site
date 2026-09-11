const escapeHtml=value=>String(value??"").replace(/[&<>'"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]));
const label=value=>String(value||"unknown").replaceAll("_"," ").replace(/\b\w/g,char=>char.toUpperCase());
const dateLabel=value=>{const date=new Date(value);return Number.isNaN(date.valueOf())?String(value||""):date.toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})};
const relativeUpdate=value=>{const date=new Date(value);if(Number.isNaN(date.valueOf()))return "Updated date unavailable";const today=new Date();today.setHours(0,0,0,0);const observed=new Date(date);observed.setHours(0,0,0,0);const days=Math.max(0,Math.round((today-observed)/86400000));return days===0?"Updated today":days===1?"Updated yesterday":`Updated ${days} days ago`};
const safeHttps=value=>{try{const url=new URL(value);return url.protocol==="https:"?url.href:""}catch{return ""}};
const photo=dog=>{const source=safeHttps(dog.image_url);return source?`<div class="photo"><img data-rescue-image loading="lazy" decoding="async" referrerpolicy="no-referrer" src="${escapeHtml(source)}" alt="${escapeHtml(dog.name)}"><span data-photo-fallback class="hidden" hidden>No photo available</span></div>`:`<div class="photo"><span>No photo available</span></div>`};
const rescueLink=dog=>{const url=safeHttps(dog.rescue_website_url);const name=escapeHtml(dog.rescue_name);return url?`<a href="${escapeHtml(url)}" target="_blank" rel="noopener" aria-label="Visit ${name}">${name}</a>`:name};
const card=dog=>`<article class="card"><a class="photo-link" href="${escapeHtml(dog.page_path)}">${photo(dog)}</a><div class="card-body"><div class="eyebrow">${rescueLink(dog)}</div><h3><a href="${escapeHtml(dog.page_path)}">${escapeHtml(dog.name)}</a></h3><div class="muted">${escapeHtml(dog.breed_display||dog.breed_primary||"Breed not listed")} · ${escapeHtml(dog.source_location_label||"Location not listed")}</div><div class="traits"><span class="pill">${escapeHtml(label(dog.age_group))}</span><span class="pill">${escapeHtml(label(dog.size_group))}</span><span class="pill">${escapeHtml(label(dog.sex))}</span></div><div class="card-updated">${escapeHtml(relativeUpdate(dog.last_observed_at))}</div></div></article>`;
const revealNoPhoto=image=>{const photo=image.closest(".photo");image.remove();const fallback=photo?.querySelector("[data-photo-fallback]");if(fallback){fallback.classList.remove("hidden");fallback.hidden=false}};
const installImageFallbacks=root=>root.querySelectorAll("img[data-rescue-image]").forEach(image=>{image.addEventListener("error",()=>revealNoPhoto(image),{once:true});if(image.complete&&!image.naturalWidth)revealNoPhoto(image)});
installImageFallbacks(document);
document.addEventListener("click",event=>{const button=event.target.closest("[data-breed-scroll]");if(!button)return;const rail=button.parentElement?.querySelector("[data-breed-choices]");if(!rail)return;rail.scrollBy({left:(button.dataset.breedScroll==="next"?1:-1)*Math.max(rail.clientWidth*.8,180),behavior:"smooth"})});

const app=document.querySelector("[data-catalog-app]");
if(app){
  const form=document.querySelector("#dog-search");
  const results=document.querySelector("#dog-results");
  const count=document.querySelector("#result-count");
  const more=document.querySelector("#show-more");
  let dogs=[];let shown=24;let mixedSize=["small","medium","large"].includes(new URLSearchParams(location.search).get("mixed"))?new URLSearchParams(location.search).get("mixed"):"";
  const readFilters=()=>({...Object.fromEntries(new FormData(form).entries()),mixed:mixedSize});
  const filtered=()=>{const f=readFilters();const breed=f.breed.trim().toLowerCase();return dogs.filter(dog=>{const sourceBreed=String(dog.breed_primary||"").toLowerCase();const displayBreed=String(dog.breed_display||"").toLowerCase();const isMixed=sourceBreed.includes("mix")||sourceBreed.includes("cross")||!sourceBreed.trim();return(!breed||(sourceBreed.includes(breed)||displayBreed.includes(breed)))&&(!f.mixed||(isMixed&&dog.size_group===f.mixed))&&(!f.rescue||dog.source_key===f.rescue)&&(!f.age||dog.age_group===f.age)&&(!f.size||dog.size_group===f.size)&&(!f.sex||dog.sex===f.sex)})};
  const render=()=>{const matches=filtered();results.innerHTML=matches.slice(0,shown).map(card).join("")||'<div class="notice">No dogs match these filters. Try broadening the search.</div>';count.textContent=`${matches.length} ${matches.length===1?"dog":"dogs"}`;more.classList.toggle("hidden",shown>=matches.length);installImageFallbacks(results);const params=new URLSearchParams(Object.entries(readFilters()).filter(([,value])=>value));history.replaceState(null,"",params.size?`?${params}`:location.pathname)};
  const manifest=await fetch("manifest.json",{cache:"no-store"}).then(response=>{if(!response.ok)throw new Error("Catalog manifest unavailable");return response.json()});
  const [index,rescueData]=await Promise.all([fetch(manifest.assets.index.path).then(response=>response.json()),fetch(manifest.assets.rescues.path).then(response=>response.json())]);
  dogs=index.dogs;
  const rescueSelect=form.elements.rescue;
  rescueData.rescues.filter(rescue=>rescue.catalog_status==="listings_available").forEach(rescue=>{const option=document.createElement("option");option.value=rescue.source_key;option.textContent=rescue.name;rescueSelect.append(option)});
  const initial=new URLSearchParams(location.search);for(const name of ["breed","rescue","age","size","sex"]){if(initial.has(name))form.elements[name].value=initial.get(name)}
  form.addEventListener("submit",event=>{event.preventDefault();mixedSize="";shown=24;render()});
  form.addEventListener("change",()=>{mixedSize="";shown=24;render()});
  more.addEventListener("click",()=>{shown+=24;render()});
  render();
}
