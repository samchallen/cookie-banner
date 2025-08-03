(function () {
  class SilktideCookieBanner {
    constructor(config) {
      this.config = config;
      this.wrapper = null;
      this.banner = null;
      this.modal = null;
      this.cookieIcon = null;
      this.backdrop = null;
      this.init();
    }

    init() {
      if (document.querySelector("#silktide-wrapper")) return; // prevent duplicates
      this.createWrapper();
      if (this.config.background?.showBackground) this.createBackdrop();
      this.createCookieIcon();
      this.createModal();

      if (!this.hasSetInitialCookieChoices()) {
        this.createBanner();
        this.showBackdrop();
      } else {
        this.showCookieIcon();
        this.loadRequiredCookies();
        this.runAcceptedCookieCallbacks();
      }

      this.setupEventListeners();
    }

    createWrapper() {
      this.wrapper = document.createElement("div");
      this.wrapper.id = "silktide-wrapper";
      document.body.prepend(this.wrapper);
    }

    createWrapperChild(html, id) {
      const el = document.createElement("div");
      el.id = id;
      el.innerHTML = html;
      this.wrapper.appendChild(el);
      return el;
    }

    createBackdrop() {
      this.backdrop = this.createWrapperChild("", "silktide-backdrop");
    }

    showBackdrop() {
      if (this.backdrop) this.backdrop.style.display = "block";
    }

    hideBackdrop() {
      if (this.backdrop) this.backdrop.style.display = "none";
    }

    createBanner() {
      const html = this.getBannerHTML();
      this.banner = this.createWrapperChild(html, "silktide-banner");
      if (this.config.position?.banner) {
        this.banner.classList.add(this.config.position.banner);
      }
    }

    removeBanner() {
      if (this.banner?.parentNode) this.banner.remove();
      this.banner = null;
    }

    createModal() {
      const html = this.getModalHTML();
      this.modal = this.createWrapperChild(html, "silktide-modal");
      this.modal.style.display = "none";
    }

    toggleModal(show) {
      if (!this.modal) return;
      this.modal.style.display = show ? "flex" : "none";
      document.body.style.overflow = show ? "hidden" : "";
      if (show) {
        this.hideCookieIcon();
        this.removeBanner();
        this.showBackdrop();
        this.updateCheckboxes(false);
      } else {
        this.showCookieIcon();
        this.hideBackdrop();
        this.updateCheckboxes(true);
      }
    }

    createCookieIcon() {
      this.cookieIcon = document.createElement("button");
      this.cookieIcon.id = "silktide-cookie-icon";
      this.cookieIcon.innerHTML = this.getIconHTML();
      this.wrapper.appendChild(this.cookieIcon);
      if (this.config.cookieIcon?.position) {
        this.cookieIcon.classList.add(this.config.cookieIcon.position);
      }
    }

    showCookieIcon() {
      if (this.cookieIcon) this.cookieIcon.style.display = "flex";
    }

    hideCookieIcon() {
      if (this.cookieIcon) this.cookieIcon.style.display = "none";
    }

    hasSetInitialCookieChoices() {
      return localStorage.getItem(`silktideCookieBanner_InitialChoice`) === "1";
    }

    setInitialChoice() {
      localStorage.setItem(`silktideCookieBanner_InitialChoice`, "1");
    }

    handleChoice(acceptAll) {
      this.setInitialChoice();
      this.removeBanner();
      this.toggleModal(false);
      this.showCookieIcon();

      (this.config.cookieTypes || []).forEach((type) => {
        const value = type.required ? true : acceptAll;
        localStorage.setItem(`silktideCookieChoice_${type.id}`, value.toString());
        if (value && type.onAccept) type.onAccept();
        if (!value && type.onReject) type.onReject();
      });

      if (acceptAll && this.config.onAcceptAll) this.config.onAcceptAll();
      if (!acceptAll && this.config.onRejectAll) this.config.onRejectAll();
    }

    getAcceptedCookies() {
      return (this.config.cookieTypes || []).reduce((acc, type) => {
        acc[type.id] = localStorage.getItem(`silktideCookieChoice_${type.id}`) === "true";
        return acc;
      }, {});
    }

    runAcceptedCookieCallbacks() {
      const accepted = this.getAcceptedCookies();
      (this.config.cookieTypes || []).forEach((type) => {
        if (type.required) return;
        if (accepted[type.id] && type.onAccept) type.onAccept();
      });
    }

    loadRequiredCookies() {
      (this.config.cookieTypes || []).forEach((type) => {
        if (type.required && type.onAccept) type.onAccept();
      });
    }

    updateCheckboxes(save) {
      const prefs = this.modal.querySelector("#cookie-preferences");
      if (!prefs) return;
      prefs.querySelectorAll('input[type="checkbox"]').forEach((input) => {
        const id = input.id.replace("cookies-", "");
        const type = this.config.cookieTypes.find(t => t.id === id);
        if (!type) return;

        if (save) {
          const value = input.checked;
          localStorage.setItem(`silktideCookieChoice_${id}`, value.toString());
          if (value && type.onAccept) type.onAccept();
          if (!value && type.onReject) type.onReject();
        } else {
          input.checked = type.required
            ? true
            : localStorage.getItem(`silktideCookieChoice_${id}`) === "true" || !!type.defaultValue;
          if (type.required) input.disabled = true;
        }
      });
    }

    setupEventListeners() {
      if (this.banner) {
        this.banner.querySelector(".accept-all")?.addEventListener("click", () => this.handleChoice(true));
        this.banner.querySelector(".reject-all")?.addEventListener("click", () => this.handleChoice(false));
        this.banner.querySelector(".preferences")?.addEventListener("click", () => this.toggleModal(true));
      }

      if (this.modal) {
        this.modal.querySelector(".modal-close")?.addEventListener("click", () => this.toggleModal(false));
        this.modal.querySelector(".preferences-accept-all")?.addEventListener("click", () => this.handleChoice(true));
        this.modal.querySelector(".preferences-reject-all")?.addEventListener("click", () => this.handleChoice(false));
      }

      if (this.cookieIcon) {
        this.cookieIcon.addEventListener("click", () => this.toggleModal(true));
      }
    }

    getBannerHTML() {
      const t = this.config.text?.banner || {};
      return `
        ${t.description || ""}
        <div class="actions">
          <button class="accept-all st-button st-button--primary">${t.acceptAllButtonText || "Accept all"}</button>
          <button class="reject-all st-button st-button--primary">${t.rejectNonEssentialButtonText || "Reject"}</button>
          <div class="actions-row">
            <button class="preferences">${t.preferencesButtonText || "Preferences"}</button>
          </div>
        </div>
      `;
    }

    getModalHTML() {
      const t = this.config.text?.preferences || {};
      const cookieHTML = (this.config.cookieTypes || []).map(type => {
        return `
          <fieldset>
            <legend>${type.name}</legend>
            <div class="cookie-type-content">
              <div class="cookie-type-description">${type.description}</div>
              <label class="switch" for="cookies-${type.id}">
                <input type="checkbox" id="cookies-${type.id}" ${type.required ? "checked disabled" : ""} />
                <span class="switch__pill" aria-hidden="true"></span>
                <span class="switch__dot" aria-hidden="true"></span>
              </label>
            </div>
          </fieldset>
        `;
      }).join("");

      return `
        <header>
          <h1>${t.title || "Your preferences"}</h1>
          <button class="modal-close">×</button>
        </header>
        ${t.description || ""}
        <section id="cookie-preferences">${cookieHTML}</section>
        <footer>
          <button class="preferences-accept-all st-button st-button--primary">${this.config.text?.banner?.acceptAllButtonText || "Accept all"}</button>
          <button class="preferences-reject-all st-button st-button--primary">${this.config.text?.banner?.rejectNonEssentialButtonText || "Reject"}</button>
        </footer>
      `;
    }

    getIconHTML() {
      return `
        <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19.1172 1.15625C19.0547 0.734374 18.7344 0.390624 18.3125 0.328124C16.5859 0.0859365 14.8281 0.398437 13.2813 1.21875L7.5 4.30469C5.96094 5.125 4.71875 6.41406 3.95313 7.98437L1.08594 13.8906C0.320314 15.4609 0.0703136 17.2422 0.375001 18.9609L1.50781 25.4297C1.8125 27.1562 2.64844 28.7344 3.90625 29.9531L8.61719 34.5156C9.875 35.7344 11.4766 36.5156 13.2031 36.7578L19.6875 37.6719C21.4141 37.9141 23.1719 37.6016 24.7188 36.7812L30.5 33.6953C32.0391 32.875 33.2813 31.5859 34.0469 30.0078L36.9141 24.1094C37.6797 22.5391 37.9297 20.7578 37.625 19.0391C37.5547 18.625 37.2109 18.3125 36.7969 18.25C32.7734 17.6094 29.5469 14.5703 28.6328 10.6406C28.4922 10.0469 28.0078 9.59375 27.4063 9.5C23.1406 8.82031 19.7734 5.4375 19.1094 1.15625H19.1172Z" fill="#FFFFFF"/>
        </svg>
      `;
    }
  }

  window.silktideCookieBannerManager = {
    updateCookieBannerConfig: function (config) {
      function runBannerInit() {
        new SilktideCookieBanner(config);
      }

      function onWixRouteChange() {
        if (!document.querySelector("#silktide-wrapper")) {
          runBannerInit();
        }
      }

      // Initial load
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", onWixRouteChange);
      } else {
        onWixRouteChange();
      }

      // Observe DOM for language change / Wix navigation
      const observer = new MutationObserver(onWixRouteChange);
      observer.observe(document.body, { childList: true, subtree: true });

      // Handle direct route changes (popstate or SPA navigation)
      window.addEventListener("popstate", onWixRouteChange);
      const origPushState = history.pushState;
      history.pushState = function () {
        origPushState.apply(this, arguments);
        onWixRouteChange();
      };
    }
  };
})();
