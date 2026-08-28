# DnD 物品欄管理器 — 完整開發紀錄（DEVLOG）

> 日期：2026-08-29
> 成品網址：https://michelleeechan.github.io/DnDBestManager/
> Repo：https://github.com/michelleeechan/DnDBestManager
> 本文記錄整個開發過程中遇到的每一個 bug、陷阱與繞過方法，供日後維護參考。

---

## ⚠️ 零、給下一個 AI session 的強制指引（先讀這段）

本專案在這部 Windows 機（Git Bash）上開發時踩過一個重大事故，日後任何修改這個 repo 的 AI **必須遵守**以下規則：

**事故**：中文內容經過 bash 指令通道傳輸時，被 Windows 的編碼（CP950/Big5 系 legacy codepage）損壞（UTF-8 中文全部變亂碼）；而且較長的指令（約 10KB 以上）會在傳輸中被截斷。兩者疊加，令「用 bash heredoc 直接上傳含中文的大檔」幾乎必然產出損壞且不完整的檔案——而 curl 還會回報成功，極難察覺。

**規則（改任何檔案請照做）**：
1. **永遠不要**把檔案內容（尤其含中文）直接放在 bash 指令裡（heredoc / echo / printf 都不行）。
2. 用 **Write 工具**將完整檔案（UTF-8，不走 bash 通道，不會壞）寫到一個**臨時資料夾**（例如 `C:\Users\cheung\AppData\Local\Temp\dnd-bridge\`），純作上傳中轉。
3. 用 `node --check` 驗語法；用 node 從檔案做 base64 組 JSON body（`fs.readFileSync` → `Buffer.toString('base64')` → 寫 `.body.json`）；用 `curl --data @body.json` 上傳（body 走檔案，不吃指令長度限制）。
4. 更新已存在的檔案**必須**先 GET 拿 `sha` 放進 body，否則 GitHub 回 409。
5. 上傳後**必須**重新下載驗證：byte 數一致、`node --check`、中文關鍵字抽查。
6. **上傳完成後立即刪除全部臨時檔**（`rm -rf` 中轉資料夾），使用者部機不留任何檔案——這是使用者的明確要求（全在 GitHub 做）。

---

## 一、需求與決策

使用者想管理 D&D 角色的物品欄：身上小袋、背包等多個容器，物品和金錢可以拖放搬移，金錢可加減。最初零設計，討論後確定：

1. **WebUI 而非 Windows UI**：拖放互動在 web 生態現成、手機平板可用、免費 hosting。
2. **Hosting：GitHub Pages**（免費、零維護、靜態網站）。注意免費版要 public repo。
3. **儲存：不開 Supabase 等新帳號**，改為「GitHub 為主儲存」：改動即時（debounce 1.5 秒）commit `data.json` 回本 repo；localStorage 只作快取（離線可用、開啟快）；另有 JSON 匯出/匯入做離線備份。
4. 多角色管理、中英雙語可切換、貨幣用 5e 五種幣（cp/sp/ep/gp/pp）。
5. 使用者明確要求：**不在本地電腦建立專案檔案，全部在 GitHub 上做**。

## 二、架構

純靜態、零 build、無框架、無依賴：

| 檔案 | 大小 | 內容 |
|---|---|---|
| `index.html` | 468B | 骨架：topbar / sidebar / main / modal / 隱藏 file input |
| `style.css` | 4259B | 深色主題、卡片 grid、拖放高亮、chip、modal、手機 RWD |
| `app.js` | 16620B | 全部邏輯（見下） |

資料模型（`data.json` / localStorage key `dnd-inv-v1`）：

```json
{
  "version": 1, "lang": "zh", "savedAt": 1720000000000, "curChar": "id",
  "gh": { "repo": "michelleeechan/DnDBestManager", "pat": "" },
  "characters": [{
    "id": "...", "name": "角色名",
    "containers": [{ "id": "...", "name": "身上小袋", "money": { "pp":0,"gp":0,"ep":0,"sp":0,"cp":0 } }],
    "items": [{ "id":"...", "cid":"容器id", "name":"長劍", "qty":1, "weight":"3", "notes":"" }]
  }]
}
```

功能要點：
- 每個容器一張卡：物品列表＋五種貨幣 chip。物品卡可拖到其他容器卡（HTML5 drag & drop，`dataTransfer` 傳 `{kind:'item',id}`）。
- 貨幣 chip 可拖到另一個容器 → prompt 問搬移數量（預設全部，上限為源容器現有量）。點金額可直接輸入新值或 `+50` / `-50` 算式；chip 上的 +/- 按鈕同理。
- 總值自動換算成 gp（cp=1, sp=10, ep=50, gp=100, pp=1000）、總重量 lb 顯示在角色頭。
- 同步：`pushData()` 先 GET `data.json` 取 sha，再 PUT（更新必須帶 sha，否則 GitHub 回 409 衝突）；`pullIfRemoteNewer()` 在開啟時比較 `savedAt` 決定要不要採用遠端。
- **Token 安全**：`publicData()` 在 push/export 前一律把 `gh.pat` 清空——token 只存在瀏覽器 localStorage，永不會被 commit 到 repo 或匯出檔。

## 三、踩過的每一個坑（按時間序）

### 坑 0：一開始的本地建檔被擋
最初嘗試在本地 `D:\_VoxCPMTest\dnd-inventory` 建 `mkdir` 和 `Write index.html`，使用者拒絕——明確表示要「全在 GitHub 做」。之後全部改走 GitHub REST API。

### 坑 1：這部機的 `gh` 不是 GitHub CLI
`gh --version` 回 `v0.0.4`，且 `gh auth status` 報 `unrecognized arguments`——這是另一個同名 Python 工具，不是 GitHub CLI。結論：此機沒有 gh，一切遠端操作只能用 `curl` + Personal Access Token 打 REST API。

### 坑 2：第一個 token 權限不足（讀得到、寫不進）
第一枚 fine-grained token 打 `GET /contents/README.md` 回 200，但 `PUT` 上傳檔案回 **403 "Resource not accessible by personal access token"**。原因：token 的 Contents 權限是 **Read-only**，不是 Read and write。教訓：**token 可讀不代表可寫，兩種權限要分開驗證**（先傳一個 `.permission-test` 小檔確認可寫再開工）。使用者後來改給另一個 repo `DnDBestManager` 的 token，寫入測試通過。

### 坑 3：遺留了一個空 repo
過程中曾用 API 建了 `michelleeechan/dnd-inventory`（只有 auto_init 的 README）。後來改用 `DnDBestManager`，這個空 repo 仍留在帳號裡，**可以刪掉**（Settings → Danger Zone → Delete repository）。

### 坑 4（最痛）：用 bash heredoc 上傳大檔會被「截斷＋編碼損壞」雙重破壞
把 `app.js` 內容放在 bash 指令裡用 heredoc 餵給 `base64` 再 curl PUT，出事：

**4a. 指令長度截斷**：bash 警告 `here-document at line 5 delimited by end-of-file (wanted FILEOF)`，即關鍵字 `FILEOF` 從未被匹配到——整條指令在傳輸途中被截斷（約 10KB 附近），上傳的 `app.js` 只有 **7887 bytes**（完整應為 16620），內容在 `renderMain()` 中間硬生生斷掉。更陰險的是 **curl 照樣執行、回報成功**，不檢查的話就以為沒事。

**4b. 中文全部變亂碼**：下載回來檢查，`新角色` 變成 `閪User` 之類的垃圾。原因：指令文字要經過 Windows Git Bash 的通道傳輸，這條通道用 legacy codepage（CP950/Big5 系）處理，UTF-8 中文字節被錯誤轉碼。診斷關鍵：在指令裡 `grep '鉑金幣'` 竟然 match 到 1——證明壞的是「檔案本身儲存的內容」，不是終端機顯示問題。（`index.html` 和 `style.css` 內容恰好純 ASCII，所以同一方法上傳沒壞——事後證明這只是運氣好。）

**解法（日後改 code 請照這個流程）**：
1. 用 **Write 工具**（harness 直接寫 UTF-8 檔案，完全不經 bash 通道）把完整檔案寫到一個臨時資料夾（本例 `C:\Users\cheung\AppData\Local\Temp\dnd-bridge\`，純做上傳中轉）。
2. `node --check` 驗證語法。
3. 用 node 從檔案讀內容做 base64、組好 PUT 的 JSON body 寫成 `.body.json`：
   `node -e "const fs=require('fs');const c=fs.readFileSync(檔案,'utf8');..."`
4. `curl --data @body.json`（body 走檔案，不吃指令長度限制，也不經轉碼通道）。
5. PUT 前先 GET 檔案拿 `sha`，更新已存在檔案「必須」帶 sha，否則 GitHub 回 409。
6. 上傳後**必定**重新下載驗證：byte 數一致、`node --check`、中文關鍵字抽查。用完刪光臨時檔。

### 坑 5：判斷「顯示亂碼」vs「資料真的壞了」
終端機顯示中文也可能亂碼（同一條 out 通道），所以光看 `head` 出亂碼不能下結論。用「指令裡打 UTF-8 中文字串去 grep 檔案」match 到壞字，才能證明磁碟上/GitHub 上的位元組本身就壞了。日後除錯編碼問題記得先做這步區分。

### 坑 6：小的設計自坑（自查發現）
第一版 `renderMain` 裡把 `data-cid` 塞進 `btn()` 的 class 參數拼接（`'itemadd" data-cid="'+id`）——剛好能動但極脆弱，正式版已改成明寫 `<button class="itemadd" data-act="addItem" data-cid="...">`。另外非 ASCII 符號（✎ ⚙ 🗑 等）一律改用 HTML entity（`&#9998;` 等），確保 JS 原始碼主體盡量 ASCII，降低再次踩編碼坑的機率（i18n 中文字串除外，那些走 Write 工具上傳所以安全）。

## 四、GitHub Pages 開啟方式

不用進網頁設定，直接 API：

```
POST /repos/michelleeechan/DnDBestManager/pages
{"source":{"branch":"main","path":"/"}}
```

回 201 即成功；等約一分鐘 build，`https://michelleeechan.github.io/DnDBestManager/` 回 200。因為是零 build 靜態站，直接由 main branch root 出，不需要 Actions workflow。

## 五、使用方式

1. 開網址，預設有一個「新角色」，帶「身上小袋」＋「背包」兩個容器。
2. 點角色名稱可改名；側欄可新增/切換角色。
3. 「＋ 物品」新增；物品卡上 +/- 調數量、✎ 改名/數量/重量/備註、✕ 刪除；**直接拖到另一張容器卡即可搬移**。
4. 每張卡下方五個貨幣 chip：點數字輸入新值或 `+50`/`-50`；+/- 按鈕快速加減；**拖 chip 到另一容器搬錢**（會問數量）。
5. 「⚙ 同步設定」貼 GitHub token（見下），之後每次改動 1.5 秒後自動 commit `data.json` 到 repo；換裝置開網址會自動抓最新。
6. 匯出＝下載 JSON 備份；匯入＝讀回。

## 六、安全備註

- 開發用的 token 具 repo 寫入權限，**用完建議撤銷**（GitHub → Settings → Developer settings → Personal access tokens）。
- 給 app 日常同步用，建議另開一枚**只**給 `DnDBestManager`、**只有 Contents: Read and write** 權限的 fine-grained token，洩露時影響範圍最小。
- repo 是 public（Pages 免費版要求），`data.json` 技術上任何人讀得到——只是沒人知道 URL。若介意，可改 host 到 Cloudflare Pages（支援 private repo，app 代碼不用改）。

## 七、已知限制

- 兩部裝置同時編輯時是 last-writer-wins，後推的覆蓋先推的；PUT 撞到中間有人更新會報 409，畫面會顯示「同步失敗」，重按「立即上傳」即可。
- 編輯介面用 `prompt()`，陽春但可靠；日後想升級成行內編輯，改 `editItemDialog` 一處即可。
- 沒有容量/槽位限制（5e 用容量規則的話要自己加 `slots` 欄位）。

---

*本文件由開發過程如實記錄，包含所有失敗嘗試，避免日後重踩。*
