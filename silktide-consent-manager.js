/* Silktide Cookie Banner - Final Version with Fixes for:
   - Icon with cookie & chips
   - Popup closing on all routes
   - Persistent icon click handler
   - Wix subpage routing & language change support */

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
      if (document.querySelector("#silktide-wrapper")) return;
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
      const iconHTML = `
        <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19.117 1.156c-.062-.422-.382-.766-.804-.828-1.727-.242-3.485.07-5.031.89L7.5 4.305C5.96 5.125 4.719 6.414 3.953 7.984L1.086 13.89c-.766 1.57-1.016 3.351-.711 5.07l1.133 6.469c.305 1.727 1.141 3.305 2.399 4.524l4.711 4.563c1.258 1.219 2.86 2 4.586 2.242l6.485.914c1.727.242 3.485-.07 5.032-.89l5.781-3.086c1.539-.82 2.781-2.109 3.547-3.688l2.867-5.898c.766-1.57 1.016-3.351.711-5.07-.07-.414-.414-.727-.828-.79-4.023-.64-7.25-3.68-8.164-7.61-.14-.593-.625-1.047-1.226-1.14-4.266-.68-7.633-4.063-8.297-8.344Z" fill="#fff"/>
        </svg>
      `;
      this.cookieIcon = document.createElement("button");
      this.cookieIcon.id = "silktide-cookie-icon";
      this.cookieIcon.innerHTML = iconHTML;
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

    updateCheckboxes(save) {
      const prefs = this.modal.querySelector("#cookie-preferences");
      prefs?.querySelectorAll('input[type="checkbox"]').forEach((input) => {
        const id = input.id.replace("cookies-", "");
        const type = this.config.cookieTypes.find((t) => t.id === id);
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
      const cookieHTML = (this.config.cookieTypes || []).map((type) => `
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
      `).join("");

      return `
        <header>
          <h1>${t.title || "Customize your cookie preferences"}</h1>
          <button class="modal-close">Ã—</button>
        </header>
        ${t.description || ""}
        <section id="cookie-preferences">${cookieHTML}</section>
        <footer>
          <button class="preferences-accept-all st-button st-button--primary">${this.config.text?.banner?.acceptAllButtonText || "Accept all"}</button>
          <button class="preferences-reject-all st-button st-button--primary">${this.config.text?.banner?.rejectNonEssentialButtonText || "Reject"}</button>
        </footer>
      `;
    }

    setupEventListeners() {
      this.banner?.querySelector(".accept-all")?.addEventListener("click", () => this.handleChoice(true));
      this.banner?.querySelector(".reject-all")?.addEventListener("click", () => this.handleChoice(false));
      this.banner?.querySelector(".preferences")?.addEventListener("click", () => this.toggleModal(true));
      this.modal?.querySelector(".modal-close")?.addEventListener("click", () => this.toggleModal(false));
      this.modal?.querySelector(".preferences-accept-all")?.addEventListener("click", () => this.handleChoice(true));
      this.modal?.querySelector(".preferences-reject-all")?.addEventListener("click", () => this.handleChoice(false));
      this.cookieIcon?.addEventListener("click", () => this.toggleModal(true));
    }
  }

  function initBanner(config) {
    new SilktideCookieBanner(config);
  }

  window.silktideCookieBannerManager = {
    updateCookieBannerConfig: function (config) {
      const onPageChange = () => {
        if (!document.querySelector("#silktide-wrapper")) {
          initBanner(config);
        }
      };

      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", onPageChange);
      } else {
        onPageChange();
      }

      new MutationObserver(onPageChange).observe(document.body, { childList: true, subtree: true });

      const origPush = history.pushState;
      history.pushState = function () {
        origPush.apply(this, arguments);
        onPageChange();
      };
      window.addEventListener("popstate", onPageChange);
    }
  };
})();
