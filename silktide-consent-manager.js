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
      if (show) {
        this.hideCookieIcon();
        this.removeBanner();
        document.body.style.overflow = "hidden"; // ONLY this line
        this.showBackdrop();
        this.updateCheckboxes(false);
      } else {
        this.showCookieIcon();
        document.body.style.overflow = "";
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
      // Banner
      if (this.banner) {
        this.banner.querySelector(".accept-all")?.addEventListener("click", () => this.handleChoice(true));
        this.banner.querySelector(".reject-all")?.addEventListener("click", () => this.handleChoice(false));
        this.banner.querySelector(".preferences")?.addEventListener("click", () => this.toggleModal(true));
      }

      // Modal
      if (this.modal) {
        this.modal.querySelector(".modal-close")?.addEventListener("click", () => this.toggleModal(false));
        this.modal.querySelector(".preferences-accept-all")?.addEventListener("click", () => this.handleChoice(true));
        this.modal.querySelector(".preferences-reject-all")?.addEventListener("click", () => this.handleChoice(false));
      }

      // Cookie icon
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
      return `<svg width="38" height="38" viewBox="0 0 38 38"><circle cx="19" cy="19" r="18" fill="#000"/></svg>`;
    }
  }

  // Attach to window
  window.silktideCookieBannerManager = {
    updateCookieBannerConfig: function (config) {
      if (!document.body) {
        document.addEventListener("DOMContentLoaded", () => new SilktideCookieBanner(config));
      } else {
        new SilktideCookieBanner(config);
      }
    }
  };
})();
