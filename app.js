/* LocalCouchGuy site script.
   Listings come from data/couches.json and checkout settings from data/settings.json.
   Both are edited in Pages CMS (app.pagescms.org). */
(function () {
  "use strict";

  const PHONE = "+13653249689";
  const PHONE_TEXT = "(365) 324-9689";

  const REVIEWS = [
    { name: "Glynis", date: "July 12, 2026", role: "bought", text: "The seller was quick to respond and shared information well, good experience." },
    { name: "Tom", date: "July 25, 2026", role: "sold", text: "Awesome guy, reliable and showed up as soon as he said he would." },
    { name: "Aidin", date: "August 28, 2026", role: "sold", text: "Amazing buyer. Fair, polite and respectful" }
  ];

  /* ---------- helpers ---------- */
  const $ = (s, el = document) => el.querySelector(s);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const smsHref = body => "sms:" + PHONE + "?&body=" + encodeURIComponent(body);
  const num = v => (v === "" || v == null || isNaN(Number(v))) ? null : Number(v);
  const money = n => n == null ? "" : Number(n).toLocaleString("en-CA", { style: "currency", currency: "CAD" });
  const round2 = n => Math.round(n * 100) / 100;
  const hasPrice = c => num(c.price) != null && num(c.price) > 0;
  const priceText = c => hasPrice(c) ? "$" + Number(c.price).toLocaleString("en-CA") : (c.sample ? "$ —" : "Message for price");
  const inch = v => (v === "" || v == null) ? "—" : v + "″";
  const src = p => String(p).replace(/^\/+/, ""); // works on username.github.io and on /repo/ sites
  const STAR = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z"/></svg>';

  /* ---------- data ---------- */
  let COUCHES = [];
  let SETTINGS = { etransfer_email: "", deposit_percent: 10, delivery_zones: [] };

  function slug(s, i) {
    const b = String(s || "couch").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "couch";
    return b + "-" + (i + 1);
  }
  function normalizeCouches(raw) {
    const list = Array.isArray(raw) ? raw : (raw && Array.isArray(raw.couches) ? raw.couches : []);
    return list.filter(c => c && typeof c === "object").map((c, i) => {
      let photos = c.photos;
      if (typeof photos === "string") photos = photos ? [photos] : [];
      if (!Array.isArray(photos)) photos = [];
      return {
        id: String(c.id || slug(c.name, i)),
        name: String(c.name || "Couch"),
        status: c.status === "sold" ? "sold" : "available",
        price: num(c.price) == null ? "" : num(c.price),
        width: c.width == null ? "" : String(c.width),
        depth: c.depth == null ? "" : String(c.depth),
        height: c.height == null ? "" : String(c.height),
        photos: photos.filter(p => typeof p === "string" && p).map(src),
        description: String(c.description || ""),
        sample: !!c.sample
      };
    });
  }
  function normalizeSettings(raw) {
    const s = raw && typeof raw === "object" ? raw : {};
    const pct = num(s.deposit_percent);
    return {
      etransfer_email: String(s.etransfer_email || "").trim(),
      deposit_percent: pct != null && pct > 0 && pct <= 100 ? pct : 10,
      delivery_zones: (Array.isArray(s.delivery_zones) ? s.delivery_zones : []).filter(z => z && z.name).map(z => ({
        name: String(z.name), areas: String(z.areas || ""), price: num(z.price)
      }))
    };
  }
  async function getJSON(path) {
    const r = await fetch(path, { cache: "no-cache" });
    if (!r.ok) throw new Error(path + " " + r.status);
    return r.json();
  }

  /* ---------- static bits ---------- */
  document.querySelectorAll(".stars").forEach(el => { el.innerHTML = STAR.repeat(5); });
  $("#rev-list").innerHTML = REVIEWS.map(r => `<figure class="rev" style="margin:0">
    <span class="stars" aria-label="5 out of 5 stars">${STAR.repeat(5)}</span>
    <blockquote>“${esc(r.text)}”</blockquote>
    <figcaption class="who"><b>${esc(r.name)}</b><span class="mono">${r.role === "bought" ? "Bought from Matvei" : "Sold to Matvei"} · ${esc(r.date)}</span></figcaption>
  </figure>`).join("");
  $("#sell-sms").href = smsHref("Hi Matvei, I have a couch I'd like to sell. Here are some photos, the measurements and my asking price:");
  function applyPct() { document.querySelectorAll("[data-pct]").forEach(el => { el.textContent = SETTINGS.deposit_percent; }); }

  /* ---------- couch grid ---------- */
  let currentFilter = "all";
  function renderCouches(loadError) {
    const grid = $("#couch-grid");
    const all = COUCHES;
    $("#count-all").textContent = all.length;
    $("#count-available").textContent = all.filter(c => c.status === "available").length;
    $("#count-sold").textContent = all.filter(c => c.status === "sold").length;
    $("#preview-note").hidden = !all.some(c => c.sample);
    if (loadError) {
      grid.innerHTML = `<p class="muted">Couldn't load the couches right now. Text me at ${PHONE_TEXT} and I'll send you what's available.</p>`;
      return;
    }
    const list = all.filter(c => currentFilter === "all" || c.status === currentFilter);
    if (!list.length) {
      grid.innerHTML = `<p class="muted">Nothing here right now. Text me what you're looking for at ${PHONE_TEXT}.</p>`;
      return;
    }
    grid.innerHTML = list.map(c => {
      const sold = c.status === "sold";
      const media = c.photos.length
        ? `<img src="${esc(c.photos[0])}" alt="${esc(c.name)}" loading="lazy">`
        : `<span class="ph"><span class="mono">Photos coming soon</span></span>`;
      let actions;
      if (sold) actions = `<a class="text-btn" href="${smsHref("Hi Matvei, I saw the " + c.name + " was sold. Do you have anything similar?")}">Ask about similar couches</a>`;
      else if (hasPrice(c)) actions = `<button class="text-btn buy" type="button" data-buy="${esc(c.id)}">Buy or reserve</button>
           <button class="text-btn" type="button" data-view="${esc(c.id)}">Book a viewing</button>`;
      else actions = `<button class="text-btn primary" type="button" data-view="${esc(c.id)}">Book a viewing</button>
           <button class="text-btn" type="button" data-open="${esc(c.id)}">View details</button>`;
      return `<article class="couch${sold ? " is-sold" : ""}">
        <button class="couch-media" type="button" data-open="${esc(c.id)}" aria-label="See photos and details for ${esc(c.name)}">
          ${media}
          <span class="tag mono${sold ? " sold" : ""}">${sold ? "Sold" : "Available"}</span>
          ${c.sample ? `<span class="tag tag-r mono">Sample</span>` : (c.photos.length > 1 ? `<span class="tag tag-r mono">${c.photos.length} photos</span>` : "")}
        </button>
        <div class="couch-info">
          <div class="couch-top"><h3>${esc(c.name)}</h3><span class="price">${esc(priceText(c))}</span></div>
          <div class="dims mono"><span>W <b>${esc(inch(c.width))}</b></span><span>D <b>${esc(inch(c.depth))}</b></span><span>H <b>${esc(inch(c.height))}</b></span></div>
          <p class="couch-desc">${esc(c.description)}</p>
          <div class="couch-actions">${actions}</div>
        </div>
      </article>`;
    }).join("");
  }
  document.querySelectorAll(".tab").forEach(btn => {
    btn.addEventListener("click", () => {
      currentFilter = btn.dataset.filter;
      document.querySelectorAll(".tab").forEach(b => b.setAttribute("aria-pressed", String(b === btn)));
      renderCouches();
    });
  });

  /* ---------- couch details ---------- */
  const modal = $("#couch-modal");
  function openCouch(id) {
    const c = COUCHES.find(x => x.id === id);
    if (!c) return;
    const sold = c.status === "sold";
    $("#m-title").textContent = c.name;
    $("#m-status").textContent = (sold ? "Sold" : "Available") + (c.sample ? " · Sample listing" : "");
    $("#m-status").className = "m-status mono" + (sold ? " sold" : "");
    $("#m-price").textContent = priceText(c);
    $("#m-dims").innerHTML = `<div><span class="v">${esc(inch(c.width))}</span><span class="k mono">Width</span></div>
      <div><span class="v">${esc(inch(c.depth))}</span><span class="k mono">Depth</span></div>
      <div><span class="v">${esc(inch(c.height))}</span><span class="k mono">Height</span></div>`;
    $("#m-desc").textContent = c.description;
    const main = $("#m-main"), thumbs = $("#m-thumbs");
    if (c.photos.length) {
      const show = i => {
        main.innerHTML = `<img src="${esc(c.photos[i])}" alt="${esc(c.name)}, photo ${i + 1} of ${c.photos.length}">`;
        thumbs.querySelectorAll("button").forEach((b, j) => b.setAttribute("aria-current", String(i === j)));
      };
      thumbs.innerHTML = c.photos.length > 1 ? c.photos.map((p, i) =>
        `<button type="button" aria-label="Photo ${i + 1}"><img src="${esc(p)}" alt=""></button>`).join("") : "";
      thumbs.querySelectorAll("button").forEach((b, i) => b.addEventListener("click", () => show(i)));
      show(0);
    } else {
      main.innerHTML = `<span class="ph"><span class="mono">Photos coming soon</span></span>`;
      thumbs.innerHTML = "";
    }
    let actions;
    if (sold) actions = `<a class="btn btn-primary" href="${smsHref("Hi Matvei, I saw the " + c.name + " was sold. Do you have anything similar?")}">Ask about similar couches</a>`;
    else actions = (hasPrice(c) ? `<button class="btn btn-primary" type="button" data-buy="${esc(c.id)}">Buy or reserve <span class="arr" aria-hidden="true">→</span></button>
         <button class="btn btn-outline" type="button" data-view="${esc(c.id)}">Book a viewing</button>`
      : `<button class="btn btn-primary" type="button" data-view="${esc(c.id)}">Book a viewing <span class="arr" aria-hidden="true">→</span></button>`)
      + `<a class="btn btn-outline" href="${smsHref("Hi Matvei, is the " + c.name + " still available?")}">Text about this couch</a>
         <p class="muted mono" style="margin:4px 0 0">Or text ${PHONE_TEXT}</p>`;
    $("#m-actions").innerHTML = actions;
    if (typeof modal.showModal === "function") modal.showModal(); else modal.setAttribute("open", "");
  }
  function closeModal() { if (modal.open) { modal.close ? modal.close() : modal.removeAttribute("open"); } }
  $("#m-close").addEventListener("click", closeModal);
  modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });

  /* ---------- viewing form ---------- */
  const sel = $("#f-couch");
  function fillSelect() {
    const keep = sel.value;
    const avail = COUCHES.filter(c => c.status === "available");
    sel.innerHTML = avail.map(c => `<option value="${esc(c.id)}">${esc(c.name)}${c.sample ? "" : " · " + esc(priceText(c))}</option>`).join("")
      + `<option value="">Not sure yet, just looking</option>`;
    if (keep && avail.some(c => c.id === keep)) sel.value = keep;
  }
  function bookViewing(id) {
    closeModal();
    if (location.hash === "#checkout") leaveCheckout(false);
    if (id) sel.value = id;
    $("#result").hidden = true;
    $("#viewing-form").hidden = false;
    $("#book").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    setTimeout(() => $("#f-name").focus({ preventScroll: true }), 500);
  }
  document.querySelectorAll('input[name="how"]').forEach(r => r.addEventListener("change", () => {
    $("#city-field").hidden = !$("#f-how-delivery").checked;
  }));
  $("#viewing-form").addEventListener("submit", e => {
    e.preventDefault();
    const name = $("#f-name").value.trim(), phone = $("#f-phone").value.trim();
    if (!name || !phone) { $("#form-error").hidden = false; (name ? $("#f-phone") : $("#f-name")).focus(); return; }
    $("#form-error").hidden = true;
    const c = COUCHES.find(x => x.id === sel.value);
    const city = $("#f-city").value.trim();
    const lines = [
      "Hi Matvei, I'd like to book a viewing.",
      "Name: " + name,
      "Phone: " + phone,
      "Couch: " + (c ? c.name : "Not sure yet"),
      $("#f-how-delivery").checked ? "Delivery to: " + (city || "(city to confirm)") : "Pickup in Kitchener"
    ];
    const when = $("#f-when").value.trim();
    if (when) lines.push("Best time: " + when);
    const msg = $("#f-msg").value.trim();
    if (msg) lines.push("Note: " + msg);
    const text = lines.join("\n");
    $("#result-text").textContent = text;
    $("#result-sms").href = smsHref(text);
    $("#copy-status").innerHTML = "If Messages doesn't open, copy the message and text it to <b>" + PHONE_TEXT + "</b>.";
    $("#viewing-form").hidden = true;
    $("#result").hidden = false;
  });
  async function copyText(text, btn, okLabel) {
    const label = btn.textContent;
    try {
      await navigator.clipboard.writeText(text);
      btn.textContent = okLabel || "Copied";
      btn.classList.add("done");
    } catch (err) {
      btn.textContent = "Select and copy it";
    }
    setTimeout(() => { btn.textContent = label; btn.classList.remove("done"); }, 2200);
  }
  $("#copy-btn").addEventListener("click", e => copyText($("#result-text").textContent, e.currentTarget));
  $("#edit-btn").addEventListener("click", () => { $("#result").hidden = true; $("#viewing-form").hidden = false; $("#f-name").focus(); });

  /* ============================================================
     CHECKOUT
     ============================================================ */
  const co = { couchId: null, order: null };
  const coEl = $("#checkout");

  function zoneOptions() {
    const zones = SETTINGS.delivery_zones;
    const sel = $("#co-zone");
    if (!zones.length) {
      sel.innerHTML = `<option value="">Anywhere in Ontario · quote by text</option>`;
      return;
    }
    const keep = sel.value;
    sel.innerHTML = zones.map((z, i) => `<option value="${i}">${esc(z.name)} · ${z.price == null ? "quote by text" : money(z.price)}</option>`).join("");
    if (keep && zones[Number(keep)]) sel.value = keep;
  }
  function currentZone() {
    const v = $("#co-zone").value;
    return v === "" ? null : SETTINGS.delivery_zones[Number(v)] || null;
  }
  function calc() {
    const c = COUCHES.find(x => x.id === co.couchId);
    if (!c) return null;
    const price = num(c.price);
    const pct = SETTINGS.deposit_percent;
    const plan = $("#co-pay-full").checked ? "full" : "deposit";
    const delivery = $("#co-how-delivery").checked;
    const zone = delivery ? currentZone() : null;
    const fee = delivery ? (zone && zone.price != null ? zone.price : null) : 0; // null = quote by text
    const deposit = round2(price * pct / 100);
    const payNow = plan === "deposit" ? deposit : round2(price + (fee || 0));
    const total = fee == null ? null : round2(price + fee);
    const dueLater = plan === "deposit" ? (fee == null ? round2(price - deposit) : round2(price + fee - deposit)) : 0;
    return { c, price, pct, plan, delivery, zone, fee, deposit, payNow, total, dueLater };
  }
  function renderSummary() {
    const k = calc();
    if (!k) return;
    const { c } = k;
    $("#co-deposit-line").textContent = `Pay ${money(k.deposit)} now to hold it. Pay the rest at ${k.delivery ? "delivery" : "pickup"}.`;
    $("#co-full-line").textContent = k.delivery
      ? (k.fee == null ? `Pay ${money(k.price)} for the couch now. I'll text you a delivery quote.` : `Pay ${money(k.payNow)} now, delivery included.`)
      : `Pay ${money(k.price)} now and pick it up in Kitchener.`;
    const z = k.zone;
    $("#co-zone-areas").textContent = z && z.areas ? "Includes: " + z.areas : "";
    const feeText = !k.delivery ? "Free pickup" : (k.fee == null ? "Quote by text" : money(k.fee));
    let lines = `
      <div class="co-line"><span>Couch</span><span>${money(k.price)}</span></div>
      <div class="co-line"><span>${k.delivery ? "Delivery" + (z ? " · " + esc(z.name) : "") : "Pickup in Kitchener"}</span><span>${feeText}</span></div>`;
    lines += k.total != null ? `<div class="co-line total"><span>Total</span><span>${money(k.total)}</span></div>` : `<div class="co-line total"><span>Total</span><span>${money(k.price)} + delivery</span></div>`;
    lines += `<div class="co-line now"><span>Pay now by e-Transfer</span><span>${money(k.payNow)}</span></div>`;
    if (k.plan === "deposit") lines += `<div class="co-line"><span>Due at ${k.delivery ? "delivery" : "pickup"}</span><span>${money(k.dueLater)}${k.delivery && k.fee == null ? " + delivery" : ""}</span></div>`;
    else if (k.delivery && k.fee == null) lines += `<div class="co-line"><span>Delivery</span><span>Paid once quoted</span></div>`;
    $("#co-summary").innerHTML = `
      <h2>Your order</h2>
      <div class="co-item">
        <span class="img">${c.photos[0] ? `<img src="${esc(c.photos[0])}" alt="">` : ""}</span>
        <span><b>${esc(c.name)}</b><span class="mono">W ${esc(inch(c.width))} · D ${esc(inch(c.depth))} · H ${esc(inch(c.height))}</span></span>
      </div>
      <div class="co-lines">${lines}</div>
      <p class="co-note">${k.plan === "deposit" ? `The ${k.pct}% deposit comes off the price.` : "Paid in full, so it's yours once I confirm the payment."} Questions? Text ${PHONE_TEXT}.</p>`;
  }

  function enterCheckout(id) {
    const c = COUCHES.find(x => x.id === id);
    if (!c || c.status !== "available" || !hasPrice(c)) return;
    closeModal();
    co.couchId = id;
    try { sessionStorage.setItem("lcg-checkout", id); } catch (e) {}
    $("#co-form").hidden = false;
    $("#co-paybox").hidden = true;
    $("#co-error").hidden = true;
    $("#co-step").textContent = "Step 1 of 2 · Your order";
    $("#co-title").textContent = "Checkout";
    zoneOptions();
    renderSummary();
    coEl.hidden = false;
    document.body.classList.add("in-checkout");
    if (location.hash !== "#checkout") history.pushState(null, "", "#checkout");
    window.scrollTo(0, 0);
  }
  function leaveCheckout(scroll) {
    coEl.hidden = true;
    document.body.classList.remove("in-checkout");
    if (location.hash === "#checkout") history.replaceState(null, "", "#couches");
    if (scroll !== false) $("#couches").scrollIntoView();
  }
  $("#co-back").addEventListener("click", () => leaveCheckout(true));
  window.addEventListener("hashchange", () => {
    if (location.hash === "#checkout") {
      let id = co.couchId;
      try { id = id || sessionStorage.getItem("lcg-checkout"); } catch (e) {}
      if (id && COUCHES.length) enterCheckout(id); else leaveCheckout(true);
    } else if (!coEl.hidden) {
      coEl.hidden = true;
      document.body.classList.remove("in-checkout");
      const t = location.hash && document.getElementById(location.hash.slice(1));
      if (t) t.scrollIntoView();
    }
  });

  ["co-pay-deposit", "co-pay-full", "co-how-pickup", "co-how-delivery"].forEach(id => $("#" + id).addEventListener("change", () => {
    $("#co-delivery").hidden = !$("#co-how-delivery").checked;
    renderSummary();
  }));
  $("#co-zone").addEventListener("change", renderSummary);

  function orderCode() {
    const n = Math.floor(1000 + Math.random() * 9000);
    return "LCG-" + n;
  }
  $("#co-form").addEventListener("submit", e => {
    e.preventDefault();
    const k = calc();
    if (!k) return;
    const name = $("#co-name").value.trim(), phone = $("#co-phone").value.trim();
    const address = $("#co-address").value.trim(), city = $("#co-city").value.trim(), postal = $("#co-postal").value.trim();
    const err = $("#co-error");
    let missing = null;
    if (k.delivery && (!address || !city)) missing = !address ? "#co-address" : "#co-city";
    if (!phone) missing = "#co-phone";
    if (!name) missing = "#co-name";
    if (missing) {
      err.textContent = missing === "#co-name" || missing === "#co-phone" ? "Add your name and phone number so I can reach you." : "Add the street address and city for delivery.";
      err.hidden = false;
      $(missing).focus();
      return;
    }
    err.hidden = true;
    const code = orderCode();
    const email = $("#co-email").value.trim(), when = $("#co-when").value.trim(), notes = $("#co-notes").value.trim();
    const memo = code + " " + k.c.name;
    const lines = [
      "Hi Matvei, new order " + code + ".",
      "Couch: " + k.c.name + " (" + money(k.price) + ")",
      k.plan === "deposit"
        ? "Option: " + k.pct + "% deposit to hold it. Sending " + money(k.payNow) + " now, " + money(k.dueLater) + (k.delivery && k.fee == null ? " + delivery" : "") + " due at " + (k.delivery ? "delivery" : "pickup") + "."
        : "Option: Buy it now. Sending " + money(k.payNow) + " now" + (k.delivery ? (k.fee == null ? " (delivery to be quoted)." : " (delivery included).") : "."),
      k.delivery
        ? "Delivery" + (k.zone ? " (" + k.zone.name + (k.fee != null ? ", " + money(k.fee) : "") + ")" : "") + ": " + address + ", " + city + (postal ? " " + postal : "")
        : "Pickup in Kitchener",
      "Name: " + name,
      "Phone: " + phone
    ];
    if (email) lines.push("Email: " + email);
    if (when) lines.push("Best time: " + when);
    if (notes) lines.push("Notes: " + notes);
    lines.push("Paying by Interac e-Transfer" + (SETTINGS.etransfer_email ? " to " + SETTINGS.etransfer_email : "") + " with message: " + memo);
    co.order = { code, text: lines.join("\n"), memo, amount: k.payNow };
    renderPay(k);
  });

  function renderPay(k) {
    const o = co.order;
    const emailSet = !!SETTINGS.etransfer_email;
    $("#co-step").textContent = "Step 2 of 2 · Payment";
    $("#co-title").textContent = "Pay by e-Transfer";
    const box = $("#co-paybox");
    box.innerHTML = emailSet ? `
      <h2>Send ${money(o.amount)} by Interac e-Transfer</h2>
      <p class="muted">Your order number is <b style="color:var(--ink)">${esc(o.code)}</b>. Send the payment from your bank's app using the details below.</p>
      <dl class="co-rows">
        <div><dt>Amount</dt><dd>${money(o.amount)}</dd><button class="copy-btn" type="button" data-copy="${esc(o.amount.toFixed(2))}">Copy</button></div>
        <div><dt>Send to</dt><dd>${esc(SETTINGS.etransfer_email)}</dd><button class="copy-btn" type="button" data-copy="${esc(SETTINGS.etransfer_email)}">Copy</button></div>
        <div><dt>Message</dt><dd>${esc(o.memo)}</dd><button class="copy-btn" type="button" data-copy="${esc(o.memo)}">Copy</button></div>
      </dl>
      <ol class="co-howto">
        <li>Open your bank's app and choose <b>Interac e-Transfer</b>.</li>
        <li>Send <b>${money(o.amount)}</b> to <b>${esc(SETTINGS.etransfer_email)}</b>.</li>
        <li>Put <b>${esc(o.memo)}</b> in the message.</li>
        <li>Text me your order with the button below so I know to look for it.</li>
      </ol>
      <div class="ctas">
        <a class="btn btn-primary" href="${smsHref(o.text)}">Text my order to Matvei</a>
        <button class="btn btn-outline" type="button" data-copy-order>Copy order details</button>
      </div>
      <p class="co-callout">${k.plan === "deposit" ? "Your couch is held" : "The couch is yours"} once I confirm your payment by text. If the Messages button doesn't open, copy your order details and text them to <b>${PHONE_TEXT}</b>.</p>
      <div><button class="text-btn" type="button" id="co-edit">← Change order details</button></div>`
      : `
      <h2>Almost done</h2>
      <p class="muted">Your order number is <b style="color:var(--ink)">${esc(o.code)}</b>. Text me your order and I'll send you where to e-Transfer ${money(o.amount)}.</p>
      <div class="ctas">
        <a class="btn btn-primary" href="${smsHref(o.text)}">Text my order to Matvei</a>
        <button class="btn btn-outline" type="button" data-copy-order>Copy order details</button>
      </div>
      <p class="co-callout">If the Messages button doesn't open, copy your order details and text them to <b>${PHONE_TEXT}</b>.</p>
      <div><button class="text-btn" type="button" id="co-edit">← Change order details</button></div>`;
    $("#co-form").hidden = true;
    box.hidden = false;
    $("#co-edit").addEventListener("click", () => {
      box.hidden = true;
      $("#co-form").hidden = false;
      $("#co-step").textContent = "Step 1 of 2 · Your order";
      $("#co-title").textContent = "Checkout";
    });
    window.scrollTo(0, 0);
  }
  $("#co-paybox").addEventListener("click", e => {
    const b = e.target.closest("[data-copy]");
    if (b) { copyText(b.dataset.copy, b); return; }
    const o = e.target.closest("[data-copy-order]");
    if (o && co.order) copyText(co.order.text, o, "Copied order");
  });

  /* ---------- global clicks ---------- */
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-buy]");
    if (b) { e.preventDefault(); enterCheckout(b.dataset.buy); return; }
    const v = e.target.closest("[data-view]");
    if (v) { e.preventDefault(); bookViewing(v.dataset.view); return; }
    const o = e.target.closest("[data-open]");
    if (o) { e.preventDefault(); openCouch(o.dataset.open); }
  });

  /* ---------- header: progress, active section, mobile menu ---------- */
  const header = $("#site-header"), bar = $("#progress");
  function onScroll() {
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.width = (max > 0 ? (scrollY / max) * 100 : 0) + "%";
    header.classList.toggle("scrolled", scrollY > 8);
  }
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  const navLinks = [...document.querySelectorAll(".nav a")];
  const sections = navLinks.map(a => document.querySelector(a.getAttribute("href"))).filter(Boolean);
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) navLinks.forEach(a => a.setAttribute("aria-current", String(a.getAttribute("href") === "#" + en.target.id)));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(s => io.observe(s));
  }
  const menuBtn = $("#menu-btn"), nav = $("#site-nav");
  menuBtn.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.textContent = open ? "Close" : "Menu";
  });
  nav.addEventListener("click", e => {
    if (e.target.closest("a")) { nav.classList.remove("open"); menuBtn.setAttribute("aria-expanded", "false"); menuBtn.textContent = "Menu"; }
  });

  /* ---------- load data ---------- */
  renderCouches();
  fillSelect();
  applyPct();
  Promise.allSettled([getJSON("data/couches.json"), getJSON("data/settings.json")]).then(([cs, st]) => {
    if (st.status === "fulfilled") SETTINGS = normalizeSettings(st.value);
    applyPct();
    if (cs.status === "fulfilled") { COUCHES = normalizeCouches(cs.value); renderCouches(); }
    else renderCouches(true);
    fillSelect();
    if (location.hash === "#checkout") {
      let id = null;
      try { id = sessionStorage.getItem("lcg-checkout"); } catch (e) {}
      if (id && COUCHES.some(c => c.id === id)) enterCheckout(id);
      else history.replaceState(null, "", "#couches");
    }
  });
})();
