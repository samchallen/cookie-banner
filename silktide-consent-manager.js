class SilktideCookieBanner {
  constructor(config) {
    this.config = config;
    this.wrapper = null;
    this.banner = null;
    this.modal = null;
    this.cookieIcon = null;
    this.backdrop = null;
    this.createWrapper();

    if (this.shouldShowBackdrop()) {
      this.createBackdrop();
    }

    this.createCookieIcon();
    this.createModal();

    if (this.shouldShowBanner()) {
      this.createBanner();
      this.showBackdrop();
    } else {
      this.showCookieIcon();
    }

    this.setupEventListeners();

    if (this.hasSetInitialCookieChoices()) {
      this.loadRequiredCookies();
      this.runAcceptedCookieCallbacks();
    }
  }

  destroyCookieBanner() {
    if (this.wrapper && this.wrapper.parentNode) {
      this.wrapper.parentNode.removeChild(this.wrapper);
    }
    this.allowBodyScroll();
    this.wrapper = this.banner = this.modal = this.cookieIcon = this.backdrop = null;
  }

  createWrapper() {
    this.wrapper = document.createElement("div");
    this.wrapper.id = "silktide-wrapper";
    document.body.insertBefore(this.wrapper, document.body.firstChild);
  }

  createWrapperChild(htmlContent, id) {
    const child = document.createElement("div");
    child.id = id;
    child.innerHTML = htmlContent;
    if (!this.wrapper || !document.body.contains(this.wrapper)) {
      this.createWrapper();
    }
    this.wrapper.appendChild(child);
    return child;
  }

  createBackdrop() {
    this.backdrop = this.createWrapperChild(null, "silktide-backdrop");
  }

  showBackdrop() {
    if (this.backdrop) this.backdrop.style.display = "block";
    if (typeof this.config.onBackdropOpen === "function") {
      this.config.onBackdropOpen();
    }
  }

  hideBackdrop() {
    if (this.backdrop) this.backdrop.style.display = "none";
    if (typeof this.config.onBackdropClose === "function") {
      this.config.onBackdropClose();
    }
  }

  shouldShowBackdrop() {
    return this.config?.background?.showBackground || false;
  }

  preventBodyScroll() {
    document.body.style.overflow = 'hidden';
    // Removed: document.body.style.position = 'fixed';
    // Removed: document.body.style.width = '100%';
  }

  allowBodyScroll() {
    document.body.style.overflow = '';
    // Removed: document.body.style.position = '';
    // Removed: document.body.style.width = '';
  }

  hasSetInitialCookieChoices() {
    return !!localStorage.getItem(`silktideCookieBanner_InitialChoice${this.getBannerSuffix()}`);
  }

  setInitialCookieChoiceMade() {
    localStorage.setItem(`silktideCookieBanner_InitialChoice${this.getBannerSuffix()}`, "1");
  }

  getBannerSuffix() {
    return this.config.bannerSuffix ? `_${this.config.bannerSuffix}` : "";
  }

  createBanner() {
    this.banner = this.createWrapperChild(this.getBannerContent(), "silktide-banner");
    if (this.banner && this.config.position?.banner) {
      this.banner.classList.add(this.config.position.banner);
    }
    if (this.banner && typeof this.config.onBannerOpen === "function") {
      this.config.onBannerOpen();
    }
  }

  showCookieIcon() {
    if (this.cookieIcon) {
      this.cookieIcon.style.display = "flex";
    }
  }

  hideCookieIcon() {
    if (this.cookieIcon) {
      this.cookieIcon.style.display = "none";
    }
  }

  removeBanner() {
    if (this.banner && this.banner.parentNode) {
      this.banner.parentNode.removeChild(this.banner);
      this.banner = null;
      if (typeof this.config.onBannerClose === "function") {
        this.config.onBannerClose();
      }
    }
  }

  shouldShowBanner() {
    return (
      this.config.showBanner !== false &&
      localStorage.getItem(`silktideCookieBanner_InitialChoice${this.getBannerSuffix()}`) === null
    );
  }

  createModal() {
    this.modal = this.createWrapperChild(this.getModalContent(), "silktide-modal");
  }

  toggleModal(show) {
    if (!this.modal) return;
    this.modal.style.display = show ? "flex" : "none";
    if (show) {
      this.showBackdrop();
      this.hideCookieIcon();
      this.removeBanner();
      this.preventBodyScroll();
      const modalCloseButton = this.modal.querySelector(".modal-close");
      modalCloseButton.focus();
      if (typeof this.config.onPreferencesOpen === "function") {
        this.config.onPreferencesOpen();
      }
      this.updateCheckboxState(false);
    } else {
      this.setInitialCookieChoiceMade();
      this.updateCheckboxState(true);
      this.hideBackdrop();
      this.showCookieIcon();
      this.allowBodyScroll();
      if (typeof this.config.onPreferencesClose === "function") {
        this.config.onPreferencesClose();
      }
    }
  }

  createCookieIcon() {
    this.cookieIcon = document.createElement("button");
    this.cookieIcon.id = "silktide-cookie-icon";
    this.cookieIcon.innerHTML = this.getCookieIconContent();
    if (!this.wrapper || !document.body.contains(this.wrapper)) {
      this.createWrapper();
    }
    this.wrapper.appendChild(this.cookieIcon);
    if (this.cookieIcon && this.config.cookieIcon?.position) {
      this.cookieIcon.classList.add(this.config.cookieIcon.position);
    }
    if (this.cookieIcon && this.config.cookieIcon?.colorScheme) {
      this.cookieIcon.classList.add(this.config.cookieIcon.colorScheme);
    }
  }

  handleCookieChoice(accepted) {
    this.setInitialCookieChoiceMade();
    this.removeBanner();
    this.hideBackdrop();
    this.toggleModal(false);
    this.showCookieIcon();

    this.config.cookieTypes.forEach((type) => {
      if (type.required) {
        localStorage.setItem(`silktideCookieChoice_${type.id}${this.getBannerSuffix()}`, "true");
        if (typeof type.onAccept === "function") {
          type.onAccept();
        }
      } else {
        localStorage.setItem(
          `silktideCookieChoice_${type.id}${this.getBannerSuffix()}`,
          accepted.toString()
        );
        if (accepted && typeof type.onAccept === "function") {
          type.onAccept();
        } else if (!accepted && typeof type.onReject === "function") {
          type.onReject();
        }
      }
    });

    if (accepted && typeof this.config.onAcceptAll === "function") {
      this.config.onAcceptAll();
    } else if (!accepted && typeof this.config.onRejectAll === "function") {
      this.config.onRejectAll();
    }

    this.updateCheckboxState();
  }

  updateCheckboxState(saveToStorage = false) {
    const preferencesSection = this.modal?.querySelector("#cookie-preferences");
    if (!preferencesSection) return;

    const checkboxes = preferencesSection.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach((checkbox) => {
      const [, cookieId] = checkbox.id.split("cookies-");
      const cookieType = this.config.cookieTypes.find((type) => type.id === cookieId);
      if (!cookieType) return;

      if (saveToStorage) {
        const currentState = checkbox.checked;
        if (cookieType.required) {
          localStorage.setItem(`silktideCookieChoice_${cookieId}${this.getBannerSuffix()}`, "true");
        } else {
          localStorage.setItem(
            `silktideCookieChoice_${cookieId}${this.getBannerSuffix()}`,
            currentState.toString()
          );
          if (currentState && typeof cookieType.onAccept === "function") {
            cookieType.onAccept();
          } else if (!currentState && typeof cookieType.onReject === "function") {
            cookieType.onReject();
          }
        }
      } else {
        if (cookieType.required) {
          checkbox.checked = true;
          checkbox.disabled = true;
        } else {
          const storedValue = localStorage.getItem(
            `silktideCookieChoice_${cookieId}${this.getBannerSuffix()}`
          );
          checkbox.checked =
            storedValue !== null ? storedValue === "true" : !!cookieType.defaultValue;
        }
      }
    });
  }

  getAcceptedCookies() {
    return (this.config.cookieTypes || []).reduce((acc, cookieType) => {
      acc[cookieType.id] =
        localStorage.getItem(`silktideCookieChoice_${cookieType.id}${this.getBannerSuffix()}`) ===
        "true";
      return acc;
    }, {});
  }

  runAcceptedCookieCallbacks() {
    if (!this.config.cookieTypes) return;
    const acceptedCookies = this.getAcceptedCookies();
    this.config.cookieTypes.forEach((type) => {
      if (!type.required && acceptedCookies[type.id] && typeof type.onAccept === "function") {
        type.onAccept();
      }
    });
  }

  loadRequiredCookies() {
    if (!this.config.cookieTypes) return;
    this.config.cookieTypes.forEach((cookie) => {
      if (cookie.required && typeof cookie.onAccept === "function") {
        cookie.onAccept();
      }
    });
  }

  // ... other methods (e.g., getBannerContent, getModalContent, getCookieIconContent)
  // remain unchanged unless you want me to optimize those too.

  setupEventListeners() {
    if (this.banner) {
      const acceptButton = this.banner.querySelector(".accept-all");
      const rejectButton = this.banner.querySelector(".reject-all");
      const preferencesButton = this.banner.querySelector(".preferences");

      acceptButton?.addEventListener("click", () => this.handleCookieChoice(true));
      rejectButton?.addEventListener("click", () => this.handleCookieChoice(false));
      preferencesButton?.addEventListener("click", () => {
        this.showBackdrop();
        this.toggleModal(true);
      });
    }

    if (this.modal) {
      const closeButton = this.modal.querySelector(".modal-close");
      const acceptAllButton = this.modal.querySelector(".preferences-accept-all");
      const rejectAllButton = this.modal.querySelector(".preferences-reject-all");

      closeButton?.addEventListener("click", () => {
        this.toggleModal(false);
        if (!this.hasSetInitialCookieChoices()) {
          this.handleCookieChoice(false); // default action
        }
      });
      acceptAllButton?.addEventListener("click", () => this.handleCookieChoice(true));
      rejectAllButton?.addEventListener("click", () => this.handleCookieChoice(false));
    }

    if (this.cookieIcon) {
      this.cookieIcon.addEventListener("click", () => {
        if (!this.modal) {
          this.createModal();
        }
        this.toggleModal(true);
        this.hideCookieIcon();
      });
    }
  }
}

(function () {
  window.silktideCookieBannerManager = {};

  let config = {};
  let cookieBanner;

  function updateCookieBannerConfig(userConfig = {}) {
    config = { ...config, ...userConfig };
    if (cookieBanner) {
      cookieBanner.destroyCookieBanner();
      cookieBanner = null;
    }
    if (document.body) {
      initCookieBanner();
    } else {
      document.addEventListener("DOMContentLoaded", initCookieBanner, { once: true });
    }
  }

  function initCookieBanner() {
    if (!cookieBanner) {
      cookieBanner = new SilktideCookieBanner(config);
    }
  }

  window.silktideCookieBannerManager.updateCookieBannerConfig = updateCookieBannerConfig;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCookieBanner, { once: true });
  } else {
    initCookieBanner();
  }
})();
