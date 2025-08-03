(function(){
  class SilktideCookieBanner {
    constructor(config) {
      this.config = config;
      this.init();
    }
    init() {
      if (document.querySelector("#silktide-wrapper")) return;
      this.wrapper = document.createElement("div");
      this.wrapper.id = "silktide-wrapper";
      document.body.prepend(this.wrapper);
      if(this.config.background?.showBackground) this.createBackdrop();
      this.createCookieIcon();
      this.createModal();
      if(!localStorage.getItem("silktideCookieBanner_InitialChoice")) {
        this.createBanner();
        this.showBackdrop();
      } else {
        this.showCookieIcon();
        this.loadRequiredCookies();
        this.runAcceptedCookieCallbacks();
      }
      this.setupEvents();
    }
    createBackdrop() {
      this.backdrop = this.createChild("", "silktide-backdrop");
    }
    showBackdrop(){ this.backdrop?.style.setProperty("display","block"); }
    hideBackdrop(){ this.backdrop?.style.setProperty("display","none"); }
    createBanner(){
      const html = this.getBannerHTML();
      this.banner = this.createChild(html, "silktide-banner");
      this.config.position?.banner && this.banner.classList.add(this.config.position.banner);
    }
    createModal(){
      const html = this.getModalHTML();
      this.modal = this.createChild(html, "silktide-modal");
      this.modal.style.display = "none";
    }
    createCookieIcon(){
      this.cookieIcon = this.createChild(this.getIconHTML(), "silktide-cookie-icon");
      this.cookieIcon.classList.add(this.config.cookieIcon?.position || "");
    }
    createChild(html,id){
      const el = document.createElement("div");
      el.id = id;
      el.innerHTML = html;
      this.wrapper.append(el);
      return el;
    }
    toggleModal(show){
      if (!this.modal) return;
      this.modal.style.display = show?"flex":"none";
      document.body.style.overflow = show?"hidden":"";
      if(show){
        this.banner?.remove();
        this.hideCookieIcon();
        this.showBackdrop();
        this.updateCheckboxes(false);
      }else{
        this.showCookieIcon();
        this.hideBackdrop();
        this.updateCheckboxes(true);
      }
    }
    showCookieIcon(){ this.cookieIcon?.style && (this.cookieIcon.style.display = "flex"); }
    hideCookieIcon(){ this.cookieIcon?.style && (this.cookieIcon.style.display = "none"); }
    setInitial(){ localStorage.setItem("silktideCookieBanner_InitialChoice","1"); }
    handleChoice(acceptAll){
      this.setInitial();
      this.toggleModal(false);
      this.showCookieIcon();
      (this.config.cookieTypes||[]).forEach(type=>{
        const val = type.required?true:acceptAll;
        localStorage.setItem(`silktideCookieChoice_${type.id}`,val.toString());
        val?type.onAccept?.():type.onReject?.();
      });
      acceptAll?this.config.onAcceptAll?.():this.config.onRejectAll?.();
    }
    setupEvents(){
      this.banner?.querySelector(".accept-all")?.addEventListener("click",()=>this.handleChoice(true));
      this.banner?.querySelector(".reject-all")?.addEventListener("click",()=>this.handleChoice(false));
      this.banner?.querySelector(".preferences")?.addEventListener("click",()=>this.toggleModal(true));
      this.modal?.querySelector(".modal-close")?.addEventListener("click",()=>this.toggleModal(false));
      this.modal?.querySelector(".preferences-accept-all")?.addEventListener("click",()=>this.handleChoice(true));
      this.modal?.querySelector(".preferences-reject-all")?.addEventListener("click",()=>this.handleChoice(false));
      this.cookieIcon?.addEventListener("click",()=>this.toggleModal(true));
    }
    updateCheckboxes(save){
      const prefs = this.modal?.querySelector("#cookie-preferences");
      prefs?.querySelectorAll("input[type=checkbox]").forEach(inp=>{
        const id=inp.id.replace("cookies-","");
        const type=this.config.cookieTypes.find(t=>t.id===id);
        if(!type) return;
        if(save){
          const v=inp.checked;
          localStorage.setItem(`silktideCookieChoice_${id}`,v.toString());
          v?type.onAccept?.():type.onReject?.();
        } else {
          if(type.required){ inp.checked=true; inp.disabled=true; }
          else {
            inp.checked = localStorage.getItem(`silktideCookieChoice_${id}`)==="true" || !!type.defaultValue;
          }
        }
      });
    }
    loadRequiredCookies(){ (this.config.cookieTypes||[]).filter(t=>t.required).forEach(t=>t.onAccept?.()); }
    runAcceptedCookieCallbacks(){
      const acc={};
      (this.config.cookieTypes||[]).forEach(t=>acc[t.id]=localStorage.getItem(`silktideCookieChoice_${t.id}`)==="true");
      (this.config.cookieTypes||[]).filter(t=>!t.required&&acc[t.id]).forEach(t=>t.onAccept?.());
    }
    getBannerHTML(){
      const t=this.config.text?.banner||{};
      return `
        ${t.description||""}
        <div class="actions">
          <button class="accept-all st-button st-button--primary">${t.acceptAllButtonText||"Accept all"}</button>
          <button class="reject-all st-button st-button--primary">${t.rejectNonEssentialButtonText||"Reject"}</button>
          <div class="actions-row"><button class="preferences">${t.preferencesButtonText||"Preferences"}</button></div>
        </div>
      `;
    }
    getModalHTML(){
      const t=this.config.text?.preferences||{};
      const cookieTypesHTML=(this.config.cookieTypes||[]).map(type=>`
        <fieldset>
          <legend>${type.name}</legend>
          <div class="cookie-type-content">
            <div class="cookie-type-description">${type.description}</div>
            <label class="switch" for="cookies-${type.id}">
              <input type="checkbox" id="cookies-${type.id}" ${type.required?"checked disabled":""}/>
              <span class="switch__pill" aria-hidden="true"></span>
              <span class="switch__dot" aria-hidden="true"></span>
            </label>
          </div>
        </fieldset>
      `).join("");
      return `
        <header><h1>${t.title||"Customize your cookie preferences"}</h1><button class="modal-close">×</button></header>
        ${t.description||""}
        <section id="cookie-preferences">${cookieTypesHTML}</section>
        <footer>
          <button class="preferences-accept-all st-button st-button--primary">${this.config.text?.banner?.acceptAllButtonText||"Accept all"}</button>
          <button class="preferences-reject-all st-button st-button--primary">${this.config.text?.banner?.rejectNonEssentialButtonText||"Reject"}</button>
        </footer>
      `;
    }
    getIconHTML(){
      return `
        <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19.1172 1.15625C19.0547 0.734374 18.7344 0.390624 18.3125 0.328124C16.5859 0.0859365 14.8281 0.398437 13.2813 1.21875L7.5 4.30469C5.96094 5.125 4.71875 6.41406 3.95313 7.98437L1.08594 13.8906C0.320314 15.4609 0.0703136 17.2422 0.375001 18.9609L1.50781 25.4297C1.8125 27.1562 2.64844 28.7344 3.90625 29.9531L8.61719 34.5156C9.875 35.7344 11.4766 36.5156 13.2031 36.7578L19.6875 37.6719C21.4141 37.9141 23.1719 37.6016 24.7188 36.7812L30.5 33.6953C32.0391 32.875 33.2813 31.5859 34.0469 30.0078L36.9141 24.1094C37.6797 22.5391 37.9297 20.7578 37.625 19.0391C37.5547 18.625 37.2109 18.3125 36.7969 18.25C32.7734 17.6094 29.5469 14.5703 28.6328 10.6406C28.4922 10.0469 28.0078 9.59375 27.4063 9.5C23.1406 8.82031 19.7734 5.4375 19.1094 1.15625H19.1172Z" fill="#FFFFFF"/>
        </svg>
      `;
    }
  }

  window.silktideCookieBannerManager = {
    updateCookieBannerConfig: function(config) {
      const initBanner = () => new SilktideCookieBanner(config);
      const onNavigate = () => {
        if (!document.querySelector("#silktide-wrapper")) {
          initBanner();
        }
      };
      document.readyState==="loading" ? document.addEventListener("DOMContentLoaded", onNavigate) : onNavigate();
      const observer = new MutationObserver(onNavigate);
      observer.observe(document.body, { childList:true, subtree:true });
      window.addEventListener("popstate", onNavigate);
      const orig = history.pushState;
      history.pushState = function() { orig.apply(this, arguments); onNavigate(); };
    }
  };
})();
