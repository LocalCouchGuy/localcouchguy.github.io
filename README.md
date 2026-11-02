# LocalCouchGuy website

Static website for LocalCouchGuy (Kitchener, ON). Hosted free on GitHub Pages and edited with Pages CMS.

- `index.html`, `site.css`, `app.js`: the website
- `data/couches.json`: the couches for sale (edit in Pages CMS → Couches)
- `data/settings.json`: e-Transfer email, deposit %, delivery zones and prices (edit in Pages CMS → Checkout settings)
- `images/couches/`: couch photos (Pages CMS puts uploads here)
- `pages-cms-config.txt`: the editor setup. Its contents go in a file named `.pages.yml` (step 5)

## Publish it (one time)

1. **Create a free GitHub account** at github.com. If it's available, pick the username `LocalCouchGuy`, because your free web address will be `https://<username>.github.io`. Turn on two-factor authentication in Settings → Password and authentication. This account is the only key to editing your site.

2. **Create the repository.** Click **+** (top right) → **New repository**. Name it exactly `<your-username>.github.io` (for example `localcouchguy.github.io`). Set it to **Public** and click **Create repository**.

3. **Upload the site files.** Unzip `localcouchguy-website.zip` and open the folder. On the new repository page, click **uploading an existing file**. Select everything inside the folder (`index.html`, `site.css`, `app.js`, `README.md`, `pages-cms-config.txt` and the `data` folder) and drag it all in. Click **Commit changes**. The files must sit at the top level of the repository, not inside another folder.

4. **Turn on GitHub Pages.** In the repository, go to **Settings** → **Pages**. Under **Build and deployment**, set **Source** to **Deploy from a branch** and **Branch** to `main` and `/ (root)`, then **Save**. After 1–10 minutes your site is live at `https://<your-username>.github.io`.

5. **Add the editor settings file.** In the repository, click **Add file** → **Create new file**. Name it `.pages.yml` (with the dot at the start). Paste in everything from `pages-cms-config.txt` and click **Commit changes**.

6. **Connect Pages CMS** (free). Go to app.pagescms.org and click **Sign in with GitHub**. When asked, install the Pages CMS GitHub App on your account and give it access to **only** your website repository. Then open the repository.

7. **Set up checkout and add your couches** in Pages CMS:
   - **Checkout settings**: enter your Interac e-Transfer email, keep the deposit at 10, and type a delivery price for each zone. Leave a price empty to show "quote by text". Save.
   - **Couches**: delete the three sample couches. Then add each real couch with its name, status, price, width, depth, height, photos (the first photo is the cover) and description, and save.
   - Each save goes live on the site within a few minutes. To mark a couch sold, change its status to Sold.

8. **Test it and share it.** Open the site on your phone and in a private window. Try **Buy or reserve** on a couch all the way to the payment step, and tap **Text my order to Matvei** to check the text reaches you. Then put the link on your Facebook Marketplace profile and listings.

## Optional: your own domain

Buy a domain such as `localcouchguy.ca` from any registrar. In the repository, go to **Settings** → **Pages** → **Custom domain** and enter it. Then add the DNS records GitHub shows you at your registrar.

## Good to know

- Only people with access to this GitHub repository can change the site. Don't add collaborators unless you want them to be able to edit.
- Payments arrive as Interac e-Transfers to your email. Turning on Autodeposit in your bank app makes them deposit automatically.
- Orders aren't stored anywhere on the site. Each order reaches you as a text message from the buyer, with an order number (like `LCG-4821`) that also goes in their e-Transfer message.
