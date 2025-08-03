// Simplified consent manager setup
window.silktideCookieBannerManager = {
  updateCookieBannerConfig: function(config) {
    window.addEventListener("DOMContentLoaded", function() {
      const wrapper = document.createElement("div");
      wrapper.id = "cookie-banner-wrapper";
      document.body.appendChild(wrapper);

      // Banner content
      wrapper.innerHTML = `
        <div id="cookie-banner" style="
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: white;
          color: black;
          border: 1px solid #ccc;
          border-radius: 8px;
          padding: 16px;
          z-index: 99999;
          max-width: 500px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          font-family: sans-serif;
        ">
          <p>We use cookies to enhance your experience. <a href='/cookie-policy' target='_blank'>Learn more</a></p>
          <div style="margin-top: 10px; display: flex; gap: 10px;">
            <button id="accept-cookies" style="padding: 6px 12px;">Accept all</button>
            <button id="reject-cookies" style="padding: 6px 12px;">Reject</button>
          </div>
        </div>
        <button id="cookie-icon" style="
          position: fixed;
          bottom: 15px;
          left: 15px;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: black;
          color: white;
          border: none;
          z-index: 99999;
          display: none;
        " title="Cookie Preferences">
          🍪
        </button>
      `;

      document.getElementById("accept-cookies").onclick = () => {
        localStorage.setItem("cookie-consent", "accepted");
        wrapper.querySelector("#cookie-banner").remove();
        document.getElementById("cookie-icon").style.display = "block";
      };

      document.getElementById("reject-cookies").onclick = () => {
        localStorage.setItem("cookie-consent", "rejected");
        wrapper.querySelector("#cookie-banner").remove();
        document.getElementById("cookie-icon").style.display = "block";
      };

      document.getElementById("cookie-icon").onclick = () => {
        localStorage.removeItem("cookie-consent");
        location.reload();
      };

      if (localStorage.getItem("cookie-consent")) {
        document.getElementById("cookie-icon").style.display = "block";
      }
    });
  }
};