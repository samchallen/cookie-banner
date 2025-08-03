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
        document.body.style.overflow = "hidden";
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
          <path d="M19.1172 1.15625C19.0547 0.734374 18.7344 0.390624 18.3125 0.328124C16.5859 0.0859365 14.8281 0.398437 13.2813 1.21875L7.5 4.30469C5.96094 5.125 4.71875 6.41406 3.95313 7.98437L1.08594 13.8906C0.320314 15.4609 0.0703136 17.2422 0.375001 18.9609L1.50781 25.4297C1.8125 27.1562 2.64844 28.7344 3.90625 29.9531L8.61719 34.5156C9.875 35.7344 11.4766 36.5156 13.2031 36.7578L19.6875 37.6719C21.4141 37.9141 23.1719 37.6016 24.7188 36.7812L30.5 33.6953C32.0391 32.875 33.2813 31.5859 34.0469 30.0078L36.9141 24.1094C37.6797 22.5391 37.9297 20.7578 37.625 19.0391C37.5547 18.625 37.2109 18.3125 36.7969 18.25C32.7734 17.6094 29.5469 14.5703 28.6328 10.6406C28.4922 10.0469 28.0078 9.59375 27.4063 9.5C23.1406 8.82031 19.7734 5.4375 19.1094 1.15625H19.1172ZM15.25 10.25C15.913 10.25 16.5489 10.5134 17.0178 10.9822C17.4866 11.4511 17.75 12.087 17.75 12.75C17.75 13.413 17.4866 14.0489 17.0178 14.5178C16.5489 14.9866 15.913 15.25 15.25 15.25C14.587 15.25 13.9511 14.9866 13.4822 14.5178C13.0134 14.0489 12.75 13.413 12.75 12.75C12.75 12.087 13.0134 11.4511 13.4822 10.9822C13.9511 10.5134 14.587 10.25 15.25 10.25ZM10.25 25.25C10.25 24.587 10.5134 23.9511 10.9822 23.4822C11.4511 23.0134 12.087 22.75 12.75 22.75C13.413 22.75 14.0489 23.0134 14.5178 23.4822C14.9866 23.9511 15.25 24.587 15.25 25.25C15.25 25.913 14.9866 26.5489 14.5178 27.0178C14.0489 27.4866 13.413 27.75 12.75 27.75C12.087 27.75 11.4511 27.4866 10.9822 27.0178C10.5134 26.5489 10.25 25.913 10.25 25.25ZM27.75 20.25C28.413 20.25 29.0489 20.5134 29.5178 20.9822C29.9866 21.4511 30.25 22.087 30.25 22.75C30.25 23.413 29.9866 24.0489 29.5178 24.5178C29.0489 24.9866 28.413 25.25 27.75 25.25C27.087 25.25 26.4511 24.9866 25.9822 24.5178C25.5134 24.0489 25.25 23.413 25.25 22.75C25.25 22.087 25.5134 21.4511 25.9822 20.9822C26.4511 20.5134 27.087 20.25 27.75 20.25Z" fill="#FFFFFF"/>
        </svg>
      `;
    }
  }

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
