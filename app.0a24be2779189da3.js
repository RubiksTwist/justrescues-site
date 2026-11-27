const escapeHtml=value=>String(value??"").replace(/[&<>'"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]));
const label=value=>String(value||"unknown").replaceAll("_"," ").replace(/\b\w/g,char=>char.toUpperCase());
const dateLabel=value=>{const date=new Date(value);return Number.isNaN(date.valueOf())?String(value||""):date.toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})};
const relativeUpdate=value=>{const date=new Date(value);if(Number.isNaN(date.valueOf()))return "Updated date unavailable";const today=new Date();today.setHours(0,0,0,0);const observed=new Date(date);observed.setHours(0,0,0,0);const days=Math.max(0,Math.round((today-observed)/86400000));return days===0?"Updated today":days===1?"Updated yesterday":`Updated ${days} days ago`};
const safeHttps=value=>{try{const url=new URL(value);return url.protocol==="https:"?url.href:""}catch{return ""}};
const favoriteStorageKey="just-rescues:favorites:v1";
const readFavorites=()=>{try{const value=JSON.parse(localStorage.getItem(favoriteStorageKey)||"[]");return new Set(Array.isArray(value)?value.filter(item=>typeof item==="string"):[])}catch{return new Set()}};
const writeFavorites=favorites=>localStorage.setItem(favoriteStorageKey,JSON.stringify([...favorites]));
const favoriteButton=(id,name)=>`<button class="favorite-button" type="button" data-favorite-id="${escapeHtml(id)}" data-favorite-name="${escapeHtml(name)}" aria-pressed="false" aria-label="Add ${escapeHtml(name)} to favorites"><span aria-hidden="true">♡</span></button>`;
const syncFavoriteButton=(button,favorites=readFavorites())=>{const saved=favorites.has(button.dataset.favoriteId);const name=button.dataset.favoriteName||"this pet";button.setAttribute("aria-pressed",String(saved));button.setAttribute("aria-label",`${saved?"Remove":"Add"} ${name} ${saved?"from":"to"} favorites`);button.innerHTML=`<span aria-hidden="true">${saved?"♥":"♡"}</span>`};
const syncFavoriteButtons=root=>{const favorites=readFavorites();root.querySelectorAll("[data-favorite-id]").forEach(button=>syncFavoriteButton(button,favorites))};
const photo=dog=>{const source=safeHttps(dog.image_url);return source?`<div class="photo"><img data-rescue-image loading="lazy" decoding="async" referrerpolicy="no-referrer" src="${escapeHtml(source)}" alt="${escapeHtml(dog.name)}"><span data-photo-fallback class="hidden" hidden>No photo available</span></div>`:`<div class="photo"><span>No photo available</span></div>`};
const outboundAttributes=(rescue,dog,surface,kind)=>`data-outbound-referral data-outbound-rescue="${escapeHtml(rescue)}"${dog?` data-outbound-dog="${escapeHtml(dog)}"`:""} data-outbound-surface="${escapeHtml(surface)}" data-outbound-kind="${escapeHtml(kind)}"`;
const rescueLink=dog=>{const url=safeHttps(dog.rescue_website_url);const name=escapeHtml(dog.rescue_name);return url?`<a ${outboundAttributes(dog.source_key,dog.id,"catalog_card","rescue_website")} href="${escapeHtml(url)}" target="_blank" rel="noopener" aria-label="Visit ${name}">${name}</a>`:name};
const sitePath=path=>`/${String(path||"").replace(/^\/+/,"")}`;
const petNoun=(species,count)=>`${species==="cat"?"cat":species==="dog"?"dog":"pet"}${count===1?"":"s"}`;
const traits=dog=>[dog.species==="cat"&&dog.age_group==="puppy"?"kitten":dog.age_group,dog.size_group,dog.sex].filter(value=>value&&value!=="unknown").map(value=>`<span class="pill">${escapeHtml(label(value))}</span>`).join("");
const card=dog=>`<article class="card"><div class="photo-wrap"><a class="photo-link" href="${escapeHtml(sitePath(dog.page_path))}">${photo(dog)}</a>${favoriteButton(dog.id,dog.name)}</div><div class="card-body"><div class="eyebrow">${rescueLink(dog)}</div><h3><a href="${escapeHtml(sitePath(dog.page_path))}">${escapeHtml(dog.name)}</a></h3><div class="muted">${escapeHtml(dog.breed_display||dog.breed_primary||"Breed not listed")} · ${escapeHtml(dog.source_location_label||"Location not listed")}</div><div class="traits">${traits(dog)}</div><div class="card-updated">${escapeHtml(relativeUpdate(dog.last_observed_at))}</div></div></article>`;
const revealNoPhoto=image=>{const photo=image.closest(".photo");image.remove();const fallback=photo?.querySelector("[data-photo-fallback]");if(fallback){fallback.classList.remove("hidden");fallback.hidden=false}};
const installImageFallbacks=root=>root.querySelectorAll("img[data-rescue-image]").forEach(image=>{image.addEventListener("error",()=>revealNoPhoto(image),{once:true});if(image.complete&&!image.naturalWidth)revealNoPhoto(image)});
installImageFallbacks(document);
const scrollMotion=()=>matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth";
const navToggle=document.querySelector("[data-nav-toggle]");
const navMenu=document.querySelector("#main-navigation");
const closeNavMenu=()=>{if(!navToggle||!navMenu)return;navMenu.classList.remove("is-open");navToggle.setAttribute("aria-expanded","false");navToggle.setAttribute("aria-label","Open navigation menu")};
if(navToggle&&navMenu){navToggle.addEventListener("click",()=>{const open=!navMenu.classList.contains("is-open");navMenu.classList.toggle("is-open",open);navToggle.setAttribute("aria-expanded",String(open));navToggle.setAttribute("aria-label",`${open?"Close":"Open"} navigation menu`)});document.addEventListener("click",event=>{if(!navMenu.contains(event.target)&&!navToggle.contains(event.target))closeNavMenu()});document.addEventListener("keydown",event=>{if(event.key==="Escape"){closeNavMenu();navToggle.focus()}})}
syncFavoriteButtons(document);
document.addEventListener("click",event=>{const button=event.target.closest("[data-favorite-id]");if(!button)return;event.preventDefault();const favorites=readFavorites();const id=button.dataset.favoriteId;favorites.has(id)?favorites.delete(id):favorites.add(id);writeFavorites(favorites);syncFavoriteButtons(document);document.dispatchEvent(new Event("favoriteschange"))});
document.addEventListener("click",event=>{const button=event.target.closest("[data-breed-scroll]");if(!button)return;const rail=button.parentElement?.querySelector("[data-breed-choices]");if(!rail)return;rail.scrollBy({left:(button.dataset.breedScroll==="next"?1:-1)*Math.max(rail.clientWidth*.8,180),behavior:scrollMotion()})});

const reportOutboundReferral=anchor=>{const destination=new URL(anchor.href);const event={rescue:anchor.dataset.outboundRescue||"",dog:anchor.dataset.outboundDog||"",surface:anchor.dataset.outboundSurface||"",kind:anchor.dataset.outboundKind||"",destination_host:destination.host};const body=JSON.stringify(event);try{if(navigator.sendBeacon?.("/.netlify/functions/outbound-click",new Blob([body],{type:"application/json"})))return;fetch("/.netlify/functions/outbound-click",{method:"POST",body,headers:{"content-type":"application/json"},keepalive:true}).catch(()=>{})}catch{}};
document.addEventListener("click",event=>{if(event.defaultPrevented)return;const anchor=event.target.closest("a[data-outbound-referral]");if(anchor)reportOutboundReferral(anchor)});

const app=document.querySelector("[data-catalog-app]");
if(app){
  const form=document.querySelector("#dog-search");
  const results=document.querySelector("#dog-results");
  const count=document.querySelector("#result-count");
  const more=document.querySelector("#show-more");
  const searchSection=form.closest(".home-search-section");
  const resultsSection=document.querySelector("#catalog-results");
  const backToFilters=document.querySelector("#back-to-filters");
  const queryInput=form.elements.query;
  const suggestionMenu=document.querySelector("#dog-search-suggestions");
  const clearFilters=document.querySelector("#clear-filters");
  const moreFiltersToggle=document.querySelector("#more-filters-toggle");
  const moreFilters=document.querySelector("#more-filters");
  const rail=document.querySelector("[data-breed-choices]");
  const chips=rail?[...rail.querySelectorAll(".breed-choice")]:[];
  const searchStateKey="just-rescues:catalog-search:v1";
  const searchParams=new URLSearchParams(location.search);
  const savedSearch=()=>{try{const value=JSON.parse(sessionStorage.getItem(searchStateKey)||"null");return value&&typeof value==="object"&&value.filters&&typeof value.filters==="object"?value:null}catch{return null}};
  const initialSearch=searchParams.size?{filters:Object.fromEntries(searchParams.entries())}:savedSearch();
  let dogs=[];let shown=Number.isInteger(initialSearch?.shown)&&initialSearch.shown>0?initialSearch.shown:24;let mixedSize="";
  let activeSuggestion=-1;
  const readFilters=()=>({...Object.fromEntries(new FormData(form).entries()),mixed:mixedSize});
  const normalized=value=>String(value||"").trim().toLowerCase();
  const applyFilters=filters=>{form.reset();queryInput.value=String(filters.query??filters.breed??"");for(const name of ["species","age","size","sex"])form.elements[name].value=String(filters[name]??"");mixedSize=["small","medium","large"].includes(filters.mixed)?filters.mixed:""};
  const filterKey=filters=>["query","species","age","size","sex","mixed"].map(name=>normalized(name==="query"?filters.query??filters.breed:filters[name])).join("|");
  const chipFilters=chip=>Object.fromEntries(new URL(chip.href).searchParams.entries());
  const breedLabel=breed=>{const value=normalized(breed);const families=[["husky","Husky"],["retriever","Retriever"],["poodle","Poodle"],["shepherd","Shepherd"],["chihuahua","Chihuahua"],["terrier","Terrier"],["beagle","Beagle"],["boxer","Boxer"],["dachshund","Dachshund"],["corgi","Corgi"],["pit bull","Pit Bull"],["bulldog","Bulldog"]];return families.find(([term])=>value.includes(term))?.[1]||String(breed||"").trim()};
  const filtered=()=>{const f=readFilters();const query=normalized(f.query);return dogs.filter(dog=>{const sourceBreed=normalized(dog.breed_primary);const displayBreed=normalized(dog.breed_display);const isMixed=sourceBreed.includes("mix")||sourceBreed.includes("cross")||!sourceBreed;const matchesQuery=!query||sourceBreed.includes(query)||displayBreed.includes(query);return matchesQuery&&(!f.species||dog.species===f.species)&&(!f.mixed||(isMixed&&dog.size_group===f.mixed))&&(!f.rescue||dog.source_key===f.rescue)&&(!f.age||dog.age_group===f.age)&&(!f.size||dog.size_group===f.size)&&(!f.sex||dog.sex===f.sex)})};
  const closeSuggestions=()=>{activeSuggestion=-1;suggestionMenu.hidden=true;queryInput.setAttribute("aria-expanded","false");suggestionMenu.innerHTML=""};
  const suggestions=()=>{const query=normalized(queryInput.value);if(!query)return[];const labels=new Map();for(const dog of dogs){const label=breedLabel(dog.breed_display||dog.breed_primary);if(label&&normalized(label).startsWith(query)&&!labels.has(normalized(label)))labels.set(normalized(label),label)}return [...labels.values()].sort((left,right)=>left.localeCompare(right)).slice(0,8)};
  const chooseSuggestion=breed=>{queryInput.value=breed;mixedSize="";shown=24;closeSuggestions();queryInput.blur();render();requestAnimationFrame(scrollToResults)};
  const showSuggestions=()=>{const query=normalized(queryInput.value);const items=suggestions();activeSuggestion=-1;if(!items.length){if(!query){closeSuggestions();return}suggestionMenu.innerHTML='<p class="typeahead-empty" role="status">Breed not found in current listings.</p>';suggestionMenu.hidden=false;queryInput.setAttribute("aria-expanded","true");return}suggestionMenu.innerHTML=items.map((breed,index)=>`<button type="button" class="typeahead-option" role="option" id="dog-search-option-${index}" data-suggestion="${index}" aria-selected="false">${escapeHtml(breed)}</button>`).join("");suggestionMenu.hidden=false;queryInput.setAttribute("aria-expanded","true");suggestionMenu.querySelectorAll("[data-suggestion]").forEach(button=>button.addEventListener("click",()=>chooseSuggestion(items[Number(button.dataset.suggestion)])))};
  const setActiveSuggestion=index=>{const options=[...suggestionMenu.querySelectorAll("[data-suggestion]")];if(!options.length)return;activeSuggestion=(index+options.length)%options.length;options.forEach((option,optionIndex)=>{const active=optionIndex===activeSuggestion;option.classList.toggle("is-active",active);option.setAttribute("aria-selected",String(active))});const active=options[activeSuggestion];queryInput.setAttribute("aria-activedescendant",active.id);active.scrollIntoView({block:"nearest"})};
  const syncSizeFilter=()=>{const size=form.elements.size;const catsOnly=form.elements.species.value==="cat";if(catsOnly)size.value="";size.disabled=catsOnly;size.classList.toggle("hidden",catsOnly)};
  const visibleChips=()=>chips.filter(chip=>chip.offsetParent!==null);
  const setRovingChip=current=>chips.forEach(chip=>{chip.tabIndex=chip===current?0:-1});
  const syncRail=filters=>{if(!rail)return;rail.dataset.species=filters.species||"";const key=filterKey(filters);const active=chips.find(chip=>filterKey(chipFilters(chip))===key);chips.forEach(chip=>chip===active?chip.setAttribute("aria-current","true"):chip.removeAttribute("aria-current"));const visible=visibleChips();setRovingChip(active||visible.find(chip=>chip.tabIndex===0)||visible[0])};
  const render=()=>{syncSizeFilter();const filters=readFilters();const matches=filtered();const visibleDogs=matches.slice(0,shown);results.innerHTML=visibleDogs.map(dog=>card(dog)).join("")||`<div class="notice">No ${petNoun(filters.species,0)} match these filters. Try broadening the search.</div>`;count.textContent=`${matches.length} ${petNoun(filters.species,matches.length)}`;more.textContent=`Show more ${petNoun(filters.species,0)}`;more.classList.toggle("hidden",shown>=matches.length);installImageFallbacks(results);syncFavoriteButtons(results);const hasFilters=Object.values(filters).some(value=>Boolean(value));clearFilters.classList.toggle("hidden",!hasFilters);const folded=["age","size","sex"].filter(name=>filters[name]).length;moreFiltersToggle.textContent=folded?`More filters (${folded})`:"More filters";syncRail(filters);const params=new URLSearchParams(Object.entries(filters).filter(([,value])=>value));if(params.size)sessionStorage.setItem(searchStateKey,JSON.stringify({filters,shown}));else sessionStorage.removeItem(searchStateKey);history.replaceState(null,"",params.size?`?${params}`:location.pathname)};
  const scrollToResults=()=>{resultsSection.focus({preventScroll:true});resultsSection.scrollIntoView({behavior:scrollMotion(),block:"start"})};
  const syncBackToFilters=()=>backToFilters.classList.toggle("hidden",searchSection.getBoundingClientRect().bottom>0);
  const index=await fetch("manifest.json",{cache:"no-store"}).then(response=>{if(!response.ok)throw new Error("Catalog manifest unavailable");return response.json()}).then(manifest=>fetch(manifest.assets.index.path)).then(response=>{if(!response.ok)throw new Error("Catalog index unavailable");return response.json()}).catch(()=>null);
  if(!index){count.textContent="Pets could not load";results.innerHTML='<div class="notice">The listings did not load. Check your connection, then refresh the page.</div>'}
  else{
    dogs=index.dogs;
    if(initialSearch)applyFilters(initialSearch.filters);
    form.addEventListener("submit",event=>{event.preventDefault();mixedSize="";shown=24;closeSuggestions();queryInput.blur();render();requestAnimationFrame(scrollToResults)});
    form.addEventListener("change",()=>{mixedSize="";shown=24;render()});
    queryInput.addEventListener("input",()=>{mixedSize="";shown=24;render();showSuggestions()});
    queryInput.addEventListener("keydown",event=>{if(event.key==="ArrowDown"){if(!suggestionMenu.hidden){event.preventDefault();setActiveSuggestion(activeSuggestion+1)}}else if(event.key==="ArrowUp"){if(!suggestionMenu.hidden){event.preventDefault();setActiveSuggestion(activeSuggestion-1)}}else if(event.key==="Enter"&&activeSuggestion>=0&&!suggestionMenu.hidden){event.preventDefault();const item=suggestions()[activeSuggestion];if(item)chooseSuggestion(item)}else if(event.key==="Escape"){closeSuggestions()}});
    queryInput.addEventListener("focus",showSuggestions);
    queryInput.addEventListener("blur",()=>setTimeout(closeSuggestions,150));
    moreFiltersToggle.addEventListener("click",()=>{const open=moreFiltersToggle.getAttribute("aria-expanded")!=="true";moreFiltersToggle.setAttribute("aria-expanded",String(open));moreFilters.classList.toggle("is-open",open)});
    clearFilters.addEventListener("click",()=>{form.reset();mixedSize="";shown=24;closeSuggestions();render();resultsSection.focus({preventScroll:true})});
    rail?.addEventListener("click",event=>{const chip=event.target.closest(".breed-choice");if(!chip||event.button||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();applyFilters(chipFilters(chip));shown=24;closeSuggestions();render();requestAnimationFrame(()=>rail.closest(".popular-breeds").scrollIntoView({behavior:scrollMotion(),block:"start"}))});
    rail?.addEventListener("keydown",event=>{const visible=visibleChips();const position=visible.indexOf(document.activeElement);if(position<0)return;const target={ArrowRight:visible[position+1],ArrowLeft:visible[position-1],Home:visible[0],End:visible.at(-1)}[event.key];if(!target)return;event.preventDefault();setRovingChip(target);target.focus()});
    backToFilters.addEventListener("click",()=>{queryInput.focus({preventScroll:true});searchSection.scrollIntoView({behavior:scrollMotion(),block:"start"})});
    window.addEventListener("scroll",syncBackToFilters,{passive:true});
    more.addEventListener("click",()=>{shown+=24;render()});
    render();
    syncBackToFilters();
  }
}
const favoritesApp=document.querySelector("[data-static-favorites-app]");
if(favoritesApp){const results=favoritesApp.querySelector("[data-favorites-results]");const favorites=[...readFavorites()];if(!favorites.length){results.innerHTML='<div class="notice">You haven’t saved any pets yet. <a href="../index.html">Find pets to favorite.</a></div>'}else{const manifest=await fetch("../manifest.json",{cache:"no-store"}).then(response=>response.json());const detailIndex=await fetch(`../${manifest.assets.details.path}`).then(response=>response.json());const paths=new Map(detailIndex.dogs.map(dog=>[dog.id,dog.path]));const dogs=(await Promise.all(favorites.map(async id=>{const path=paths.get(id);if(!path)return null;const response=await fetch(`../${path}`);return response.ok?(await response.json()).dog:null;}))).filter(Boolean).map(dog=>({...dog,image_url:(dog.image_urls||[])[0]}));results.innerHTML=dogs.length?dogs.map(card).join(""):'<div class="notice">Your saved pets are no longer in this catalog. <a href="../index.html">Find pets to favorite.</a></div>';installImageFallbacks(results);syncFavoriteButtons(results)}}
